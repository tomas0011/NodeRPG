import { RunDTO } from "./dtos";

/**
 * Repositorio de la **run activa** (colección `runs`). Una run vive mientras se
 * juega; al morir/abandonar (Fase 3) se archiva al histórico y luego se borra de
 * aquí con `delete`. En Fase 2 sólo se crea/carga/guarda/borra.
 *
 * El motor/HTTP dependen de esta **interfaz** → tests con `InMemoryRunRepository`.
 */
export interface RunRepository {
    /** Carga el DTO de una run por su id, o `null` si no existe. */
    load(runId: string): Promise<RunDTO | null>;
    /** Persiste (crea o actualiza) el DTO de la run. */
    save(run: RunDTO): Promise<void>;
    /** Crea/persiste una run a partir de un DTO ya construido. */
    create(run: RunDTO): Promise<RunDTO>;
    /** Borra la run de las activas. No la archiva (eso es Fase 3). */
    delete(runId: string): Promise<void>;
}

/** Implementación en memoria (tests/dev). No toca la red. */
export class InMemoryRunRepository implements RunRepository {
    private readonly almacen: Map<string, RunDTO> = new Map();

    public async load(runId: string): Promise<RunDTO | null> {
        const run = this.almacen.get(runId);
        return run ? clonarRun(run) : null;
    }

    public async save(run: RunDTO): Promise<void> {
        this.almacen.set(run.runId, clonarRun(run));
    }

    public async create(run: RunDTO): Promise<RunDTO> {
        await this.save(run);
        return clonarRun(run);
    }

    public async delete(runId: string): Promise<void> {
        this.almacen.delete(runId);
    }
}

/** Copia profunda ligera de un `RunDTO` para no compartir referencias internas. */
function clonarRun(run: RunDTO): RunDTO {
    return {
        ...run,
        jugador: {
            ...run.jugador,
            inventario: run.jugador.inventario.slice(),
            equipados: run.jugador.equipados.slice()
        },
        escenario: {
            ...run.escenario,
            salasVisitadas: run.escenario.salasVisitadas.slice()
        }
    };
}
