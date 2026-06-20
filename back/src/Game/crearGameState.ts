import { Escenario } from "../Escenario/Escenario";
import LugarFactory from "../Escenario/LugarFactory";
import { PersonajeJugable } from "../Personaje/personajes/Jugador";
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
 * @param sessionId sesión dueña de la run.
 * @param runId id de la run (por defecto reutiliza el sessionId; el ciclo de
 *   `index.ts` pasa un UUID propio de la run).
 * @param semilla semilla del mapa; si no se pasa, se genera una.
 */
export default function crearGameState(
    sessionId: string = 'local',
    runId: string = sessionId,
    semilla: number = generarSemilla()
): GameState {
    const jugador = new PersonajeJugable('Tomas', 10);
    const lugarId = LugarFactory.LUGAR_INICIAL;
    const escenario = new Escenario(LugarFactory.crear(lugarId));
    return new GameState(jugador, escenario, sessionId, runId, semilla, lugarId, []);
}
