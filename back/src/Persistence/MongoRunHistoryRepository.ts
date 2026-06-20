import { RunDTO, ResumenRun, RunHistoryDTO, SCHEMA_VERSION } from "./dtos";
import { RunHistoryRepository } from "./RunHistoryRepository";
import { RunHistoryModel } from "./mongo";

/**
 * Implementación de `RunHistoryRepository` sobre MongoDB Atlas (mongoose).
 * Sólo se usa en el proceso real; los tests usan `InMemoryRunHistoryRepository`.
 */
export default class MongoRunHistoryRepository implements RunHistoryRepository {
    public async archive(run: RunDTO, resumen: ResumenRun): Promise<void> {
        const doc: RunHistoryDTO = {
            runId: run.runId,
            sessionId: run.sessionId,
            schemaVersion: SCHEMA_VERSION,
            resumen,
            detalle: run
        };
        // Inmutable: si ya existe, no se sobrescribe (insertar sólo una vez).
        await RunHistoryModel.updateOne(
            { runId: run.runId },
            { $setOnInsert: doc },
            { upsert: true }
        ).exec();
    }

    public async list(sessionId: string): Promise<ResumenRun[]> {
        const docs = await RunHistoryModel.find({ sessionId })
            .select('resumen')
            .lean<RunHistoryDTO[]>()
            .exec();
        return docs.map((doc) => doc.resumen);
    }

    public async getDetalle(runId: string): Promise<RunHistoryDTO | null> {
        const doc = await RunHistoryModel.findOne({ runId }).lean<RunHistoryDTO>().exec();
        return doc ? doc : null;
    }
}
