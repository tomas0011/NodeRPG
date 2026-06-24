import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { Objeto } from '../../Objeto/Objeto';
import ObjetoFactory from '../../Objeto/ObjetoFactory';
import type { ResultadoXp } from '../../Personaje/IPersonaje';
import { Personaje } from '../../Personaje/Personaje';
import CatalogoOcupantes from '../../Personaje/pools/CatalogoOcupantes';
import CurvaDeNivel from '../../Personaje/CurvaDeNivel';
import type ILugar from '../../Escenario/Lugar/ILugar';
import type { IEstrategiaDeAtaque } from '../../Objeto/estrategias/IEstrategiaDeAtaque';
import PunosStrategy from '../../Objeto/estrategias/PunosStrategy';
import IComando from '../IComando';

/**
 * Comando `atacar:<nombreNPC>`. El jugador golpea a un NPC presente en la sala.
 *
 * El **daño lo resuelve la estrategia del arma equipada** (patrón Strategy), no
 * un cálculo fijo aquí: este comando sólo localiza objetivo y arma, delega en
 * `estrategia.resolver(...)` y reporta. Sin arma equipada usa la estrategia de
 * puños por defecto.
 *
 * **Orden del turno (determinista):** primero golpea el jugador; **si el golpe
 * mata al NPC, se cobra su botín** - monedas (`getRecompensa()`: `oro` a la run /
 * `plata` a `state.plataAcumulada`) **y objetos encontrables** (`getBotin()`: ids
 * instanciados vía `ObjetoFactory` y **soltados en la sala actual** para que el
 * jugador los recoja con `tomar`, 3g). Sólo si el NPC sobrevive **contraataca**
 * de forma determinista (sin azar): resta a la vida del jugador su `dadoDeGolpe()`
 * mitigado por la `claseDeArmadura()` del jugador. Si tras el intercambio el
 * jugador queda con vida <= 0, la run se marca **terminada por muerte** (sólo se
 * setea el flag; el cierre real lo hace el ciclo de sesión) - el botín ya
 * otorgado se conserva.
 *
 * El botín es **comportamiento del enemigo** (`getRecompensa()`/`getBotin()`), no
 * un valor fijo aquí. El oro se otorga al jugador (viaja en el DTO vía
 * `jugadorBase.getOro()`); la plata se acumula para bancar (3b). Los **objetos**
 * de `getBotin()` son loot **encontrable de la run** (gratis al derrotar),
 * distinto de los **comprables** del hub (plata) y de la tienda en-run (oro): NO
 * usan los catálogos de tienda.
 *
 * **Dónde cae el loot y persistencia:** los objetos del botín caen al **suelo
 * de la sala actual** (refuerza el loop `tomar`/exploración) y, además del
 * lugar vivo, se registran en `state.estadoMutablePorSala[lugarId]` como
 * `objetosAgregadosAlSuelo`. Así, el loot soltado y **no tomado** reaparece al
 * reconstruir la sala por `lugarId` o al rehidratar la run; lo que el jugador
 * **toma** sigue persistiendo vía inventario serializado.
 */
export default class Atacar implements IComando {
    getKey() {
        return 'atacar';
    }

    esComando(comando: string) {
        return comando === this.getKey();
    }

    ejecutar(nombreNpc: string, state: GameState): CommandResult {
        const lugar = state.escenario.getLugar();
        const objetivo = this.buscarNpc(lugar.getPersonajes(), nombreNpc);
        const completions = { atacar: this.npcsVivos(lugar.getPersonajes()) };

        if (!objetivo) {
            return {
                ok: false,
                message: `No hay ningún "${nombreNpc}" al que atacar en ${lugar.getNombre()}.`,
                completions
            };
        }

        const estrategia = this.estrategiaDelArmaEquipada(state);
        const resultado = estrategia.resolver(state.jugador, objetivo);
        const vidaRestante = objetivo.getVidaActual();
        const murioNpc = vidaRestante <= 0;

        // Botín del enemigo: si el golpe del jugador lo mata, se cobra ANTES del
        // contraataque (el botín se otorga por el golpe que mató al NPC, aunque
        // el contraataque ya no ocurra). El oro va a la run (jugador -> DTO) y la
        // plata a `plataAcumulada` (a bancar al perfil al cerrar la run, 3b).
        let oroGanado = 0;
        let plataGanada = 0;
        let botinSoltado: string[] = [];
        // XP otorgada al derrotar (3i): vive en la run; al cruzar el umbral sube
        // de nivel (puede subir varios) aumentando vidaMaxima/destreza.
        let resultadoXp: ResultadoXp | undefined;
        if (murioNpc) {
            this.registrarOcupanteEliminado(objetivo, lugar, state);
            const recompensa = objetivo.getRecompensa();
            oroGanado = Math.max(0, recompensa.oro);
            plataGanada = Math.max(0, recompensa.plata);
            state.jugador.ganarOro(oroGanado);
            state.plataAcumulada += plataGanada;
            // XP del enemigo: comportamiento del NPC (getXp()), separado de
            // monedas/loot. Acumula en el jugador y resuelve la subida de nivel.
            resultadoXp = state.jugador.ganarXp(objetivo.getXp());
            // Loot encontrable: instanciar los ids de getBotin() vía ObjetoFactory
            // y soltarlos en el suelo de la sala actual (el jugador los recoge con
            // `tomar`). Objetos, no monedas; no usa los catálogos de tienda.
            botinSoltado = this.soltarBotin(objetivo, lugar, state);
        }

        // Contraataque determinista: sólo si el NPC sigue vivo, golpea al jugador.
        let dañoRecibido = 0;
        if (!murioNpc) {
            dañoRecibido = this.contraatacar(objetivo, state);
        }
        const vidaJugador = state.jugador.getVidaActual();
        const murioJugador = vidaJugador <= 0;

        // La muerte sólo SETEA el flag; el ciclo de sesión ejecuta el cierre.
        if (murioJugador) {
            state.terminar('muerte');
        }

        const message = this.componerMensaje(
            resultado.descripcion,
            objetivo.getNombre(),
            murioNpc,
            vidaRestante,
            dañoRecibido,
            murioJugador,
            vidaJugador,
            oroGanado,
            plataGanada,
            botinSoltado,
            resultadoXp
        );

        return {
            ok: true,
            message,
            data: {
                objetivo: objetivo.getNombre(),
                daño: resultado.daño,
                vidaRestante,
                murio: murioNpc,
                dañoRecibido,
                vidaJugador,
                murioJugador,
                // Botín de esta acción y totales acumulados de la run.
                oroGanado,
                plataGanada,
                // XP de esta acción y estado de progresión (3i). Efímero: vive en
                // la run. `subioNivel`/`nivelesSubidos` indican si subió (y cuántos).
                xpGanada: resultadoXp ? resultadoXp.xpGanada : 0,
                subioNivel: resultadoXp ? resultadoXp.subioNivel : false,
                nivelesSubidos: resultadoXp ? resultadoXp.nivelesSubidos : 0,
                nivel: state.jugador.getNivel(),
                xp: state.jugador.getXpActual(),
                xpParaSiguiente: resultadoXp
                    ? resultadoXp.xpParaSiguiente
                    : CurvaDeNivel.xpParaSiguiente(state.jugador.getNivel()),
                // Ids de los objetos encontrables soltados en la sala por el NPC
                // derrotado (vacío si no soltó loot). El jugador los recoge con
                // `tomar`; viajan en data.botin para que la TUI los anuncie.
                botin: botinSoltado,
                oroTotal: state.jugador.getOro(),
                plataAcumulada: state.plataAcumulada,
                terminada: state.terminada,
                causaFin: state.causaFin
            },
            completions: {
                atacar: this.npcsVivos(lugar.getPersonajes()),
                // Objetos tomables del suelo de la sala (incluye el loot recién
                // soltado), para que el autocompletado de `tomar` lo refleje.
                tomar: lugar.getObjetos().map((objeto) => objeto.getNombre())
            }
        };
    }

    /**
     * Contraataque determinista del NPC al jugador: daño = `dadoDeGolpe()` del
     * NPC mitigado por la `claseDeArmadura()` del jugador (más armadura = menos
     * daño), con mínimo 1. Aplica el daño al jugador decorado y lo devuelve.
     */
    private contraatacar(npc: Personaje, state: GameState): number {
        const mitigacion = Math.floor(state.jugador.claseDeArmadura() / 10);
        const daño = Math.max(1, npc.dadoDeGolpe() - mitigacion);
        state.jugador.recibirDaño(daño);
        return daño;
    }

    /** Compone el mensaje humano del intercambio (golpe + botín + contraataque). */
    private componerMensaje(
        descripcionGolpe: string,
        nombreNpc: string,
        murioNpc: boolean,
        vidaNpc: number,
        dañoRecibido: number,
        murioJugador: boolean,
        vidaJugador: number,
        oroGanado: number,
        plataGanada: number,
        botinSoltado: string[],
        resultadoXp?: ResultadoXp
    ): string {
        if (murioNpc) {
            const botin = this.describirBotin(oroGanado, plataGanada);
            const loot = this.describirLoot(botinSoltado);
            const xp = this.describirXp(resultadoXp);
            return `${descripcionGolpe} ${nombreNpc} murió.${botin}${loot}${xp}`;
        }
        const contra = `${nombreNpc} contraataca por ${dañoRecibido} de daño.`;
        if (murioJugador) {
            return `${descripcionGolpe} ${contra} Has muerto.`;
        }
        return `${descripcionGolpe} A ${nombreNpc} le quedan ${vidaNpc} de vida. ${contra} Te quedan ${vidaJugador} de vida.`;
    }

    /** Describe el botín ganado, si lo hubo. Vacío si no otorgó monedas. */
    private describirBotin(oroGanado: number, plataGanada: number): string {
        if (oroGanado <= 0 && plataGanada <= 0) {
            return '';
        }
        return ` Botín: +${oroGanado} de oro, +${plataGanada} de plata.`;
    }

    /**
     * Describe la XP ganada y, si subió de nivel, lo refleja (incluido multinivel:
     * "subió 2 niveles"). Vacío si no ganó XP. Determinista, sin azar.
     */
    private describirXp(resultadoXp?: ResultadoXp): string {
        if (!resultadoXp || resultadoXp.xpGanada <= 0) {
            return '';
        }
        const base = ` +${resultadoXp.xpGanada} XP.`;
        if (!resultadoXp.subioNivel) {
            return base;
        }
        const niveles =
            resultadoXp.nivelesSubidos > 1
                ? `subiste ${resultadoXp.nivelesSubidos} niveles`
                : 'subiste de nivel';
        return `${base} ¡${niveles}! Ahora eres nivel ${resultadoXp.nivel}.`;
    }

    /**
     * Describe los objetos encontrables soltados en la sala (loot), si los hubo.
     * Vacío si el enemigo no soltó objetos. Invita a `tomar`-los.
     */
    private describirLoot(botinSoltado: string[]): string {
        if (botinSoltado.length === 0) {
            return '';
        }
        return ` Suelta en el suelo: ${botinSoltado.join(', ')} (usa "tomar").`;
    }

    /**
     * Instancia el botín de objetos del NPC derrotado (`getBotin()`) vía
     * `ObjetoFactory` y lo **suelta en el suelo de la sala actual**. Además de
     * agregarlo al array vivo del lugar, lo registra en el delta mutable de la
     * sala actual para que sobreviva a reconstrucciones por `lugarId`.
     * Determinista: el loot es fijo por enemigo (sin azar; 3h lo sembrará). Los
     * ids inválidos se ignoran (tolerante). Devuelve los ids realmente soltados.
     */
    private soltarBotin(npc: Personaje, lugar: ILugar, state: GameState): string[] {
        const objetosDelLugar = lugar.getObjetos();
        const estadoMutable = state.obtenerEstadoMutableDeSala(state.lugarId);
        const soltados: string[] = [];
        for (const id of npc.getBotin()) {
            const objeto = ObjetoFactory.crear(id);
            if (objeto) {
                const nombre = objeto.getNombre();
                objetosDelLugar.push(objeto);
                estadoMutable.objetosAgregadosAlSuelo.push(nombre);
                soltados.push(nombre);
            }
        }
        return soltados;
    }

    /**
     * Registra que este ocupante ya fue eliminado de la sala actual y alinea la
     * instancia viva en memoria con ese delta persistido.
     */
    private registrarOcupanteEliminado(npc: Personaje, lugar: ILugar, state: GameState): void {
        const ocupantes = lugar.getPersonajes();
        const indice = ocupantes.indexOf(npc);
        if (indice !== -1) {
            ocupantes.splice(indice, 1);
        }

        const ocupanteId = CatalogoOcupantes.resolverId(npc);
        if (!ocupanteId) {
            return;
        }

        const estadoMutable = state.obtenerEstadoMutableDeSala(state.lugarId);
        estadoMutable.ocupantesEliminados.push(ocupanteId);
    }

    /** Busca un NPC vivo de la sala por su nombre. */
    private buscarNpc(personajes: Personaje[], nombre: string): Personaje | undefined {
        return personajes.find(
            (personaje) => personaje.getNombre() === nombre && personaje.getVidaActual() > 0
        );
    }

    /** Nombres de los NPCs aún vivos en la sala (para autocompletado). */
    private npcsVivos(personajes: Personaje[]): string[] {
        return personajes
            .filter((personaje) => personaje.getVidaActual() > 0)
            .map((personaje) => personaje.getNombre());
    }

    /**
     * Estrategia del arma equipada: recorre los ids equipados, busca en el
     * inventario el `Objeto` correspondiente y devuelve la primera estrategia de
     * ataque encontrada. Si no hay arma equipada, devuelve la de puños.
     */
    private estrategiaDelArmaEquipada(state: GameState): IEstrategiaDeAtaque {
        const objetos = state.jugadorBase.getInventario().getObjetos();
        for (const id of state.equipados) {
            const objeto = objetos.find((o: Objeto) => o.getNombre() === id);
            const estrategia = objeto?.getEstrategiaDeAtaque();
            if (estrategia) {
                return estrategia;
            }
        }
        return new PunosStrategy();
    }
}
