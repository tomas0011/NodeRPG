import { Escenario } from "../Escenario/Escenario";
import LugarFactory from "../Escenario/LugarFactory";
import ObjetoFactory from "../Objeto/ObjetoFactory";
import { PersonajeJugable } from "../Personaje/personajes/Jugador";
import aplicarMejoras from "../Tienda/aplicarMejoras";
import GameState from "./GameState";

/**
 * Genera una semilla numérica para el mapa de la run. En Fase 2 sólo se
 * persiste y round-trippea; la generación procedural determinista es Fase 3.
 */
function generarSemilla(): number {
    return Math.floor(Math.random() * 2147483647);
}

/**
 * Construye un `GameState` nuevo e independiente con el escenario inicial (Bar)
 * y un jugador base. Cada llamada devuelve estado fresco — sin globales — de
 * modo que dos sesiones no se interfieren.
 *
 * **Meta-progresión (3d):** `mejoras` son los ids de `profile.mejoras`; se
 * aplican (vía catálogo) sobre la config inicial del personaje, de modo que las
 * mejoras compradas en el hub se materializan en los stats/inventario iniciales
 * de la run. Tolerante: ids desconocidos se ignoran.
 *
 * @param sessionId sesión dueña de la run.
 * @param runId id de la run (por defecto reutiliza el sessionId; el ciclo de
 *   `index.ts` pasa un UUID propio de la run).
 * @param semilla semilla del mapa; si no se pasa, se genera una.
 * @param mejoras ids de las mejoras del perfil a aplicar a los stats iniciales.
 */
export default function crearGameState(
    sessionId: string = 'local',
    runId: string = sessionId,
    semilla: number = generarSemilla(),
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
    const lugarId = LugarFactory.LUGAR_INICIAL;
    const escenario = new Escenario(LugarFactory.crear(lugarId));
    return new GameState(jugador, escenario, sessionId, runId, semilla, lugarId, []);
}
