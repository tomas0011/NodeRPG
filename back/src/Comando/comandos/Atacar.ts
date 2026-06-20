import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { Objeto } from '../../Objeto/Objeto';
import { Personaje } from '../../Personaje/Personaje';
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
 * mata al NPC, se cobra su botín** (`getRecompensa()` del enemigo) — `oro` a la
 * run (jugador) y `plata` a `state.plataAcumulada` (a bancar al perfil al
 * cerrar). Sólo si el NPC sobrevive **contraataca** de forma determinista (sin
 * azar): resta a la vida del jugador su `dadoDeGolpe()` mitigado por la
 * `claseDeArmadura()` del jugador. Si tras el intercambio el jugador queda con
 * vida <= 0, la run se marca **terminada por muerte** (sólo se setea el flag; el
 * cierre real lo hace el ciclo de sesión) — el botín ya cobrado se conserva.
 *
 * El botín es **comportamiento del enemigo** (`getRecompensa()`), no un número
 * fijo aquí. El oro se otorga al jugador (viaja en el DTO de la run vía
 * `jugadorBase.getOro()`); la plata se acumula para bancar (3b lo banca al
 * cerrar). Fuera de alcance: no se toca el perfil/histórico aquí.
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
        // el contraataque ya no ocurra). El oro va a la run (jugador → DTO) y la
        // plata a `plataAcumulada` (a bancar al perfil al cerrar la run, 3b).
        let oroGanado = 0;
        let plataGanada = 0;
        if (murioNpc) {
            const recompensa = objetivo.getRecompensa();
            oroGanado = Math.max(0, recompensa.oro);
            plataGanada = Math.max(0, recompensa.plata);
            state.jugador.ganarOro(oroGanado);
            state.plataAcumulada += plataGanada;
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
            plataGanada
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
                oroTotal: state.jugador.getOro(),
                plataAcumulada: state.plataAcumulada,
                terminada: state.terminada,
                causaFin: state.causaFin
            },
            completions: { atacar: this.npcsVivos(lugar.getPersonajes()) }
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
        plataGanada: number
    ): string {
        if (murioNpc) {
            const botin = this.describirBotin(oroGanado, plataGanada);
            return `${descripcionGolpe} ${nombreNpc} murió.${botin}`;
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
