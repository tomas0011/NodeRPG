import { Escenario } from "../Escenario/Escenario";
import ILugar from "../Escenario/Lugar/ILugar";
import LugarFactory from "../Escenario/LugarFactory";
import { Objeto } from "../Objeto/Objeto";
import IPersonaje from "../Personaje/IPersonaje";
import { Personaje } from "../Personaje/Personaje";
import { PersonajeJugable } from "../Personaje/personajes/Jugador";
import {
    EstadoMutableDeSala,
    EstadoMutablePorSala,
    crearEstadoMutableDeSala,
    normalizarEstadoMutablePorSala
} from "./EstadoMutableDeSala";

/**
 * Constructor de un decorador de personaje: recibe el portador envuelto y
 * devuelve un `Personaje` con responsabilidades añadidas (patrón Decorator).
 */
type ModificacionDePersonaje = new (portadorDeArmadura: IPersonaje) => Personaje;

/**
 * Estado de una partida (run). Instancia, NO singleton: cada sesión posee el
 * suyo y son independientes entre sí.
 *
 * El equipo se modela como un **conjunto ordenado de ids de ítems equipados**
 * (`equipados`) más `rebuildDecoratedPlayer()`, que reconstruye el `Personaje`
 * decorado de forma determinista a partir de (jugador base + ids equipados).
 * Así equipar es idempotente, desequipar es trivial y la cadena de decoradores
 * es una función pura del estado serializable — lo que la Fase 2 necesita.
 */
export default class GameState {
    public readonly sessionId: string;
    public readonly creadoEn: Date;

    /** Id de la run (persistencia). Identifica el documento en la colección `runs`. */
    public runId: string;

    /** Semilla del mapa de la run. Se persiste; su uso procedural es Fase 3. */
    public semilla: number;

    /** Id del lugar actual (para `LugarFactory`). */
    public lugarId: string;

    /** Salas ya visitadas en esta run. Se persiste; su lógica es Fase 3. */
    public salasVisitadas: string[];

    /**
     * Delta mutable del mapa base, indexado por `lugarId`.
     * Persiste los cambios de cada sala sin serializar instancias vivas.
     */
    public estadoMutablePorSala: EstadoMutablePorSala;

    /** Jugador base sin decorar. Su inventario es la fuente de los objetos. */
    public readonly jugadorBase: PersonajeJugable;

    /** Escenario actual (lugar). */
    public readonly escenario: Escenario;

    /** Ids (nombres) de los ítems equipados, en orden de equipamiento. */
    public equipados: string[] = [];

    /** Jugador con los decoradores aplicados. Derivado de jugadorBase + equipados. */
    public jugador: IPersonaje;

    /**
     * Plata acumulada durante la run, pendiente de bancar al perfil al cerrarla.
     * Su GENERACIÓN por combate/botín es 3c; aquí sólo se transfiere lo que haya.
     */
    public plataAcumulada: number = 0;

    /**
     * Flag de fin de run. Lo SETEAN los comandos (`abandonar`, `atacar` al
     * detectar muerte); el CIERRE real (bankear/archivar/borrar) lo ejecuta el
     * ciclo de sesión, manteniendo el motor sin dependencia de repositorios.
     */
    public terminada: boolean = false;

    /** Causa del fin de run, si `terminada` es `true`. */
    public causaFin?: 'muerte' | 'abandono';

    constructor(
        jugadorBase: PersonajeJugable,
        escenario: Escenario,
        sessionId: string = 'local',
        runId: string = 'local',
        semilla: number = 0,
        lugarId: string = 'bar',
        salasVisitadas: string[] = [],
        estadoMutablePorSala: EstadoMutablePorSala = {}
    ) {
        this.jugadorBase = jugadorBase;
        this.escenario = escenario;
        this.sessionId = sessionId;
        this.runId = runId;
        this.semilla = semilla;
        this.lugarId = lugarId;
        this.salasVisitadas = salasVisitadas;
        this.estadoMutablePorSala = normalizarEstadoMutablePorSala(estadoMutablePorSala);
        this.creadoEn = new Date();
        this.jugador = jugadorBase;
        this.rebuildDecoratedPlayer();
    }

    /**
     * Devuelve el delta mutable de una sala, creándolo vacío si aún no existe.
     * Es el punto compartido para futuras mutaciones por `lugarId`.
     */
    public obtenerEstadoMutableDeSala(lugarId: string): EstadoMutableDeSala {
        if (!this.estadoMutablePorSala[lugarId]) {
            this.estadoMutablePorSala[lugarId] = crearEstadoMutableDeSala();
        }
        return this.estadoMutablePorSala[lugarId];
    }

    /**
     * Reconstruye una sala viva desde el mapa base de la run y el delta mutable
     * persistido para ese `lugarId`.
     */
    public reconstruirLugar(lugarId: string): ILugar {
        return LugarFactory.crear(lugarId, this.semilla, this.estadoMutablePorSala);
    }

    /**
     * Persiste la toma de un objeto de la sala actual en su delta mutable.
     * Si la ocurrencia visible proviene del contenido base, se registra en
     * `objetosTomados`; si proviene de `objetosAgregadosAlSuelo`, se remueve de
     * esa lista para que no reaparezca al reconstruir la sala.
     */
    public registrarObjetoTomadoDelLugarActual(nombreObjeto: string): void {
        const estadoMutable = this.obtenerEstadoMutableDeSala(this.lugarId);
        if (this.tieneObjetoBaseDisponibleEnSalaActual(nombreObjeto, estadoMutable)) {
            estadoMutable.objetosTomados.push(nombreObjeto);
            return;
        }

        this.removerPrimeraCoincidencia(estadoMutable.objetosAgregadosAlSuelo, nombreObjeto);
    }

    /**
     * Reconstruye `jugador` partiendo de `jugadorBase` y aplicando, en el orden
     * de `equipados`, el decorador de cada ítem equipado. Función pura del
     * estado: mismas (base + ids) ⇒ mismo personaje decorado.
     */
    public rebuildDecoratedPlayer(): void {
        let personaje: IPersonaje = this.jugadorBase;
        for (const id of this.equipados) {
            const objeto = this.buscarObjetoEquipado(id);
            if (!objeto) {
                continue;
            }
            const modificacion = objeto.getModificacion() as ModificacionDePersonaje | undefined;
            if (!modificacion) {
                continue;
            }
            personaje = new modificacion(personaje);
        }
        this.jugador = personaje;
    }

    /**
     * Equipa el ítem identificado por `id` (su nombre). Idempotente: si ya está
     * equipado no lo duplica. Devuelve `true` si quedó equipado.
     */
    public equipar(id: string): boolean {
        const objeto = this.buscarObjetoEquipado(id);
        if (!objeto) {
            return false;
        }
        if (!objeto.getModificacion()) {
            return false;
        }
        if (!this.equipados.includes(id)) {
            this.equipados.push(id);
        }
        this.rebuildDecoratedPlayer();
        return true;
    }

    /**
     * Desequipa el ítem `id`. Devuelve `true` si estaba equipado y se quitó.
     */
    public desequipar(id: string): boolean {
        const posicion = this.equipados.indexOf(id);
        if (posicion === -1) {
            return false;
        }
        this.equipados.splice(posicion, 1);
        this.rebuildDecoratedPlayer();
        return true;
    }

    /**
     * Marca la run como terminada por la `causa` dada. Idempotente: si ya estaba
     * terminada, conserva la primera causa registrada. Sólo cambia el flag; el
     * cierre (bankear/archivar/borrar) lo hace el ciclo de sesión.
     */
    public terminar(causa: 'muerte' | 'abandono'): void {
        if (this.terminada) {
            return;
        }
        this.terminada = true;
        this.causaFin = causa;
    }

    /** Busca un objeto del inventario del jugador por su nombre. */
    private buscarObjetoEquipado(id: string): Objeto | undefined {
        return this.jugadorBase
            .getInventario()
            .getObjetos()
            .find((objeto: Objeto) => objeto.getNombre() === id);
    }

    /**
     * La sala reconstruida siempre ordena primero los objetos base y luego los
     * agregados por delta. Como `tomar` elige la primera coincidencia por nombre,
     * alcanza con saber si aún queda alguna ocurrencia base visible de ese id.
     */
    private tieneObjetoBaseDisponibleEnSalaActual(
        nombreObjeto: string,
        estadoMutable: EstadoMutableDeSala
    ): boolean {
        const cantidadBase = this.contarCoincidencias(
            LugarFactory.crear(this.lugarId, this.semilla)
                .getObjetos()
                .map((objeto) => objeto.getNombre()),
            nombreObjeto
        );
        const cantidadTomados = this.contarCoincidencias(
            estadoMutable.objetosTomados,
            nombreObjeto
        );
        return cantidadBase > cantidadTomados;
    }

    private contarCoincidencias(ids: string[], idBuscado: string): number {
        let coincidencias = 0;
        for (const id of ids) {
            if (id === idBuscado) {
                coincidencias += 1;
            }
        }
        return coincidencias;
    }

    private removerPrimeraCoincidencia(ids: string[], idBuscado: string): void {
        const posicion = ids.indexOf(idBuscado);
        if (posicion !== -1) {
            ids.splice(posicion, 1);
        }
    }
}
