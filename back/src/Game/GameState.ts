import { Escenario } from "../Escenario/Escenario";
import { Objeto } from "../Objeto/Objeto";
import IPersonaje from "../Personaje/IPersonaje";
import { Personaje } from "../Personaje/Personaje";
import { PersonajeJugable } from "../Personaje/personajes/Jugador";

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

    /** Jugador base sin decorar. Su inventario es la fuente de los objetos. */
    public readonly jugadorBase: PersonajeJugable;

    /** Escenario actual (lugar). */
    public readonly escenario: Escenario;

    /** Ids (nombres) de los ítems equipados, en orden de equipamiento. */
    public equipados: string[] = [];

    /** Jugador con los decoradores aplicados. Derivado de jugadorBase + equipados. */
    public jugador: IPersonaje;

    constructor(
        jugadorBase: PersonajeJugable,
        escenario: Escenario,
        sessionId: string = 'local',
        runId: string = 'local',
        semilla: number = 0,
        lugarId: string = 'bar',
        salasVisitadas: string[] = []
    ) {
        this.jugadorBase = jugadorBase;
        this.escenario = escenario;
        this.sessionId = sessionId;
        this.runId = runId;
        this.semilla = semilla;
        this.lugarId = lugarId;
        this.salasVisitadas = salasVisitadas;
        this.creadoEn = new Date();
        this.jugador = jugadorBase;
        this.rebuildDecoratedPlayer();
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

    /** Busca un objeto del inventario del jugador por su nombre. */
    private buscarObjetoEquipado(id: string): Objeto | undefined {
        return this.jugadorBase
            .getInventario()
            .getObjetos()
            .find((objeto: Objeto) => objeto.getNombre() === id);
    }
}
