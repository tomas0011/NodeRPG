import CommandResult from '../../Game/CommandResult';
import SesionContexto from '../../Game/SesionContexto';
import { ResumenRun } from '../../Persistence/dtos';
import IComandoSesion from '../IComandoSesion';

/**
 * Comando `historial` — lista las **runs archivadas** de la sesión (histórico de
 * personajes, 3j). Es un comando de **nivel sesión** (como `perfil`): consulta el
 * histórico durable, no el `GameState` de la run; es válido en el hub y durante
 * una run.
 *
 * Sólo lectura: los datos ya están archivados (al morir/abandonar) y se inyectan
 * en el `SesionContexto` desde el ciclo de sesión (vía `RunHistoryRepository`).
 * El comando NO importa Mongo ni muta nada.
 *
 * Devuelve en `data` la lista de resúmenes (`ResumenRun`: nombre, causa, nivel,
 * salas, oro, plata bankeada, etc.) y un `content` humano (lista numerada).
 * Puebla `completions.detalle` con los `runId` disponibles para el
 * autocompletado de `detalle:<runId>`.
 */
export default class Historial implements IComandoSesion {
    getKey(): string {
        return 'historial';
    }

    esComando(comando: string): boolean {
        return comando === this.getKey();
    }

    ejecutar(_agente: string, contexto: SesionContexto): CommandResult {
        const runs = contexto.historial;

        if (runs.length === 0) {
            return {
                ok: true,
                message: 'Aún no tienes personajes en tu histórico. Usa "crear" para empezar una run.',
                data: { runs: [] },
                completions: { detalle: [] }
            };
        }

        // Más recientes primero (terminadaEn es ISO, comparable como string).
        const ordenadas = runs
            .slice()
            .sort((a, b) => (a.terminadaEn < b.terminadaEn ? 1 : a.terminadaEn > b.terminadaEn ? -1 : 0));

        const lineas = ordenadas.map((r, i) => `${i + 1}. ${this.linea(r)}`);
        const message = `Histórico de personajes (${ordenadas.length}):\n${lineas.join('\n')}`;

        return {
            ok: true,
            message,
            data: { runs: ordenadas },
            completions: { detalle: ordenadas.map((r) => r.runId) }
        };
    }

    /** Línea humana de un resumen de run. */
    private linea(r: ResumenRun): string {
        const causa = r.causa ?? 'desconocida';
        const nivel = r.nivel ?? 1;
        const plata = r.plataBankeada ?? 0;
        return (
            `${r.nombre} — ${causa} — nivel ${nivel} — ` +
            `${r.salasVisitadas} salas — ${r.oro} oro — ${plata} plata bankeada ` +
            `[${r.runId}]`
        );
    }
}
