import { Escenario } from "../Escenario/Escenario";
import LugarFactory from "../Escenario/LugarFactory";
import MapaDeRunRegistry from "../Escenario/MapaDeRunRegistry";
import ObjetoFactory from "../Objeto/ObjetoFactory";
import { PersonajeJugable } from "../Personaje/personajes/Jugador";
import aplicarMejoras from "../Tienda/aplicarMejoras";
import GameState from "./GameState";

/**
 * Genera una semilla **variable** para el mapa de una run de producción. En
 * código de producción **sí** se puede usar `Date.now()`/azar para que cada run
 * tenga un mapa distinto: el `RunGenerator` la consumirá de forma determinista
 * (misma semilla ⇒ mismo mapa). Se evita la semilla centinela (layout fijo).
 *
 * Lo expone `iniciarRun` (`SessionManager`) al crear una run real; los tests, en
 * cambio, suelen omitir la semilla y caen al centinela (layout fijo) para tener
 * un grafo conocido.
 */
export function generarSemilla(): number {
    const base = (Date.now() ^ Math.floor(Math.random() * 2147483647)) >>> 0;
    // Evita el centinela (0 = layout fijo): garantiza un mapa procedural.
    return base === MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO ? 1 : base;
}

/**
 * Construye un `GameState` nuevo e independiente con el escenario inicial (la
 * sala inicial del mapa de la `semilla`) y un jugador base. Cada llamada
 * devuelve estado fresco — sin globales — de modo que dos sesiones no se
 * interfieren.
 *
 * **Mapa por semilla (3h):** el escenario inicial se reconstruye desde la
 * `semilla` vía `LugarFactory`/`MapaDeRunRegistry` (cacheado por semilla). La
 * semilla **por defecto es la centinela** (`SEMILLA_LAYOUT_FIJO`), que resuelve
 * al **layout fijo** de 3f: así los llamadores que omiten semilla (tests) tienen
 * un grafo conocido. La producción pasa una `semilla` variable (procedural).
 *
 * **Meta-progresión (3d):** `mejoras` son los ids de `profile.mejoras`; se
 * aplican (vía catálogo) sobre la config inicial del personaje, de modo que las
 * mejoras compradas en el hub se materializan en los stats/inventario iniciales
 * de la run. Tolerante: ids desconocidos se ignoran.
 *
 * @param sessionId sesión dueña de la run.
 * @param runId id de la run (por defecto reutiliza el sessionId; el ciclo de
 *   `index.ts` pasa un UUID propio de la run).
 * @param semilla semilla del mapa; default = centinela (layout fijo de 3f).
 * @param mejoras ids de las mejoras del perfil a aplicar a los stats iniciales.
 */
export default function crearGameState(
    sessionId: string = 'local',
    runId: string = sessionId,
    semilla: number = MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO,
    mejoras: string[] = []
): GameState {
    const config = aplicarMejoras(mejoras);
    const jugador = new PersonajeJugable('Tomas', config.vidaMaxima);
    jugador.destreza = config.destreza;
    for (const id of config.objetosIniciales) {
        const objeto = ObjetoFactory.crear(id);
        if (objeto) {
            jugador.getInventario().agregarObjeto(objeto);
        }
    }
    // Sala inicial del mapa de esta semilla (layout fijo si es la centinela).
    const lugarId = LugarFactory.lugarInicial(semilla);
    const escenario = new Escenario(LugarFactory.crear(lugarId, semilla));
    return new GameState(jugador, escenario, sessionId, runId, semilla, lugarId, []);
}
