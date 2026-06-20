import { RunDTO, ResumenRun, RunHistoryDTO, SCHEMA_VERSION } from "./dtos";

/**
 * Repositorio del **histórico durable, de sólo lectura** (colección
 * `runHistory`). Al terminar una run, ésta no se borra: se **archiva** como
 * registro inmutable (resumen para listar + detalle para inspeccionar).
 *
 * En Fase 2 sólo se deja la interfaz, el esquema y la impl InMemory listos; el
 * archivado real lo dispara Fase 3 (muerte/abandono).
 */
export interface RunHistoryRepository {
    /** Archiva una run terminada con su resumen. Inmutable una vez archivada. */
    archive(run: RunDTO, resumen: ResumenRun): Promise<void>;
    /** Lista los resúmenes de las runs archivadas de una sesión. */
    list(sessionId: string): Promise<ResumenRun[]>;
    /** Devuelve el detalle completo de una run archivada, o `null`. */
    getDetalle(runId: string): Promise<RunHistoryDTO | null>;
}

/** Implementación en memoria (tests/dev). No toca la red. */
export class InMemoryRunHistoryRepository implements RunHistoryRepository {
    private readonly almacen: Map<string, RunHistoryDTO> = new Map();

    public async archive(run: RunDTO, resumen: ResumenRun): Promise<void> {
        const doc: RunHistoryDTO = {
            runId: run.runId,
            sessionId: run.sessionId,
            schemaVersion: SCHEMA_VERSION,
            resumen,
            detalle: run
        };
        this.almacen.set(run.runId, doc);
    }

    public async list(sessionId: string): Promise<ResumenRun[]> {
        const resultados: ResumenRun[] = [];
        for (const doc of this.almacen.values()) {
            if (doc.sessionId === sessionId) {
                resultados.push({ ...doc.resumen });
            }
        }
        return resultados;
    }

    public async getDetalle(runId: string): Promise<RunHistoryDTO | null> {
        const doc = this.almacen.get(runId);
        return doc ? doc : null;
    }
}
