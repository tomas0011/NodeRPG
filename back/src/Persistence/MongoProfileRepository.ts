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
        // `runActivaId` es opcional: cuando la run se cierra queda `undefined`.
        // Un `$set` con `undefined` lo OMITE (mongoose no lo borra del doc), por lo
        // que hay que usar `$unset` explícito para limpiarlo en Atlas; si no, el
        // perfil quedaría apuntando a una run ya borrada (dato huérfano).
        const { runActivaId, ...resto } = profile;
        const set: Record<string, unknown> = { ...resto };
        const update: Record<string, unknown> = { $set: set };
        if (runActivaId) {
            set.runActivaId = runActivaId;
        } else {
            update.$unset = { runActivaId: "" };
        }
        await ProfileModel.updateOne(
            { sessionId: profile.sessionId },
            update,
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
