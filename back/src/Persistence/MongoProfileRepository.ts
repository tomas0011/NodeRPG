import { ProfileDTO } from "./dtos";
import { ProfileRepository, perfilPorDefecto } from "./ProfileRepository";
import { ProfileModel } from "./mongo";

/**
 * Implementación de `ProfileRepository` sobre MongoDB Atlas (mongoose).
 * Sólo se usa en el proceso real; los tests usan `InMemoryProfileRepository`.
 */
export default class MongoProfileRepository implements ProfileRepository {
    public async load(sessionId: string): Promise<ProfileDTO | null> {
        const doc = await ProfileModel.findOne({ sessionId }).lean<ProfileDTO>().exec();
        if (!doc) {
            return null;
        }
        return normalizar(doc);
    }

    public async save(profile: ProfileDTO): Promise<void> {
        await ProfileModel.updateOne(
            { sessionId: profile.sessionId },
            { $set: profile },
            { upsert: true }
        ).exec();
    }

    public async create(sessionId: string): Promise<ProfileDTO> {
        const perfil = perfilPorDefecto(sessionId);
        await this.save(perfil);
        return perfil;
    }
}

/** Deserialización tolerante: campos ausentes en docs viejos caen a defaults. */
function normalizar(doc: ProfileDTO): ProfileDTO {
    return {
        sessionId: doc.sessionId,
        schemaVersion: typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 1,
        plata: typeof doc.plata === 'number' ? doc.plata : 0,
        mejoras: Array.isArray(doc.mejoras) ? doc.mejoras : [],
        runActivaId: doc.runActivaId
    };
}
