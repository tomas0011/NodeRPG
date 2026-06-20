import { RunDTO } from "./dtos";
import { RunRepository } from "./RunRepository";
import { RunModel } from "./mongo";

/**
 * Implementación de `RunRepository` sobre MongoDB Atlas (mongoose).
 * Sólo se usa en el proceso real; los tests usan `InMemoryRunRepository`.
 */
export default class MongoRunRepository implements RunRepository {
    public async load(runId: string): Promise<RunDTO | null> {
        const doc = await RunModel.findOne({ runId }).lean<RunDTO>().exec();
        if (!doc) {
            return null;
        }
        return normalizar(doc);
    }

    public async save(run: RunDTO): Promise<void> {
        await RunModel.updateOne({ runId: run.runId }, { $set: run }, { upsert: true }).exec();
    }

    public async create(run: RunDTO): Promise<RunDTO> {
        await this.save(run);
        return run;
    }

    public async delete(runId: string): Promise<void> {
        await RunModel.deleteOne({ runId }).exec();
    }
}

/** Deserialización tolerante: campos ausentes caen a defaults sensatos. */
function normalizar(doc: RunDTO): RunDTO {
    const jugador = doc.jugador || ({} as RunDTO['jugador']);
    const escenario = doc.escenario || ({} as RunDTO['escenario']);
    return {
        runId: doc.runId,
        sessionId: doc.sessionId,
        schemaVersion: typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 1,
        semilla: typeof doc.semilla === 'number' ? doc.semilla : 0,
        plataAcumulada: typeof doc.plataAcumulada === 'number' ? doc.plataAcumulada : 0,
        jugador: {
            nombre: jugador.nombre || 'Tomas',
            vidaMaxima: typeof jugador.vidaMaxima === 'number' ? jugador.vidaMaxima : 10,
            vidaActual: typeof jugador.vidaActual === 'number' ? jugador.vidaActual : 10,
            destreza: typeof jugador.destreza === 'number' ? jugador.destreza : 1,
            oro: typeof jugador.oro === 'number' ? jugador.oro : 0,
            xp: typeof jugador.xp === 'number' ? jugador.xp : 0,
            nivel: typeof jugador.nivel === 'number' ? jugador.nivel : 1,
            inventario: Array.isArray(jugador.inventario) ? jugador.inventario : [],
            equipados: Array.isArray(jugador.equipados) ? jugador.equipados : []
        },
        escenario: {
            lugarId: escenario.lugarId || 'bar',
            salasVisitadas: Array.isArray(escenario.salasVisitadas) ? escenario.salasVisitadas : []
        }
    };
}
