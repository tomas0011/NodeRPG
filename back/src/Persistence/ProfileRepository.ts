import { ProfileDTO, SCHEMA_VERSION } from "./dtos";

/**
 * Repositorio del **perfil durable** (colección `profiles`). El perfil nunca se
 * borra: es la identidad de la cuenta y su meta-progresión (plata, mejoras).
 *
 * El motor/HTTP dependen de esta **interfaz**, no de una implementación
 * concreta → los tests inyectan `InMemoryProfileRepository` y no tocan la red.
 */
export interface ProfileRepository {
    /** Carga el perfil de una sesión, o `null` si aún no existe. */
    load(sessionId: string): Promise<ProfileDTO | null>;
    /** Persiste (crea o actualiza) el perfil. */
    save(profile: ProfileDTO): Promise<void>;
    /** Crea y persiste un perfil nuevo con valores por defecto. */
    create(sessionId: string): Promise<ProfileDTO>;
}

/**
 * Construye un `ProfileDTO` nuevo con defaults sensatos. Compartido por ambas
 * implementaciones para que la forma del perfil inicial sea única.
 */
export function perfilPorDefecto(sessionId: string): ProfileDTO {
    return {
        sessionId,
        schemaVersion: SCHEMA_VERSION,
        plata: 0,
        mejoras: []
    };
}

/** Implementación en memoria (tests/dev). No toca la red. */
export class InMemoryProfileRepository implements ProfileRepository {
    private readonly almacen: Map<string, ProfileDTO> = new Map();

    public async load(sessionId: string): Promise<ProfileDTO | null> {
        const perfil = this.almacen.get(sessionId);
        // Devuelve una copia para no exponer la referencia interna.
        return perfil ? { ...perfil, mejoras: perfil.mejoras.slice() } : null;
    }

    public async save(profile: ProfileDTO): Promise<void> {
        this.almacen.set(profile.sessionId, {
            ...profile,
            mejoras: profile.mejoras.slice()
        });
    }

    public async create(sessionId: string): Promise<ProfileDTO> {
        const perfil = perfilPorDefecto(sessionId);
        await this.save(perfil);
        return perfil;
    }
}
