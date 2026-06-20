import { randomUUID } from "crypto";
import GameState from "../Game/GameState";
import crearGameState from "../Game/crearGameState";
import GameStateMapper from "./GameStateMapper";
import { ProfileDTO } from "./dtos";
import { ProfileRepository } from "./ProfileRepository";
import { RunRepository } from "./RunRepository";

/**
 * Resultado de resolver una sesión: el perfil durable y la run activa (como
 * `GameState` vivo). El llamador (la ruta HTTP) ejecuta el comando sobre el
 * `state` y luego persiste con `guardar`.
 */
export interface SesionResuelta {
    sessionId: string;
    profile: ProfileDTO;
    state: GameState;
}

/**
 * Orquesta sesiones con una **caché en memoria write-through**: lee de caché y,
 * si falta, de los repositorios; al escribir, actualiza caché Y repositorio.
 * Mongo es la fuente de verdad durable; la caché aprovecha que el backend es
 * persistente entre requests.
 *
 * Depende sólo de las **interfaces** de repositorio → en tests se inyectan las
 * implementaciones InMemory y nada toca la red.
 */
export default class SessionManager {
    private readonly profileRepo: ProfileRepository;
    private readonly runRepo: RunRepository;

    /** Caché write-through de perfiles, por sessionId. */
    private readonly cacheProfiles: Map<string, ProfileDTO> = new Map();
    /** Caché write-through de runs vivas, por runId. */
    private readonly cacheStates: Map<string, GameState> = new Map();

    constructor(profileRepo: ProfileRepository, runRepo: RunRepository) {
        this.profileRepo = profileRepo;
        this.runRepo = runRepo;
    }

    /** Genera un sessionId nuevo (UUID). */
    public static nuevoSessionId(): string {
        return randomUUID();
    }

    /**
     * Resuelve una sesión: carga (o crea) su perfil y su run activa. Si no llega
     * `sessionId`, genera uno. Siempre hay perfil; si el perfil no tiene una run
     * activa, se crea una nueva con `crearGameState` y se enlaza al perfil.
     */
    public async resolver(sessionIdEntrante?: string): Promise<SesionResuelta> {
        const sessionId = sessionIdEntrante && sessionIdEntrante.trim().length > 0
            ? sessionIdEntrante.trim()
            : SessionManager.nuevoSessionId();

        const profile = await this.cargarOcrearPerfil(sessionId);
        const state = await this.cargarOcrearRun(profile);

        return { sessionId, profile, state };
    }

    /** Persiste perfil + run (write-through: caché y repositorio). */
    public async guardar(sesion: SesionResuelta): Promise<void> {
        await this.guardarPerfil(sesion.profile);
        await this.guardarRun(sesion.state);
    }

    // --- Perfil ----------------------------------------------------------

    private async cargarOcrearPerfil(sessionId: string): Promise<ProfileDTO> {
        const enCache = this.cacheProfiles.get(sessionId);
        if (enCache) {
            return enCache;
        }
        let perfil = await this.profileRepo.load(sessionId);
        if (!perfil) {
            perfil = await this.profileRepo.create(sessionId);
        }
        this.cacheProfiles.set(sessionId, perfil);
        return perfil;
    }

    private async guardarPerfil(profile: ProfileDTO): Promise<void> {
        this.cacheProfiles.set(profile.sessionId, profile);
        await this.profileRepo.save(profile);
    }

    // --- Run -------------------------------------------------------------

    private async cargarOcrearRun(profile: ProfileDTO): Promise<GameState> {
        const runActivaId = profile.runActivaId;
        if (runActivaId) {
            const enCache = this.cacheStates.get(runActivaId);
            if (enCache) {
                return enCache;
            }
            const dto = await this.runRepo.load(runActivaId);
            if (dto) {
                const state = GameStateMapper.fromDTO(dto);
                this.cacheStates.set(state.runId, state);
                return state;
            }
            // El perfil apuntaba a una run inexistente: se crea una nueva.
        }
        return this.crearRun(profile);
    }

    private async crearRun(profile: ProfileDTO): Promise<GameState> {
        const runId = SessionManager.nuevoSessionId();
        const state = crearGameState(profile.sessionId, runId);
        profile.runActivaId = runId;
        this.cacheStates.set(runId, state);
        // Persistencia inmediata de la run nueva y del enlace en el perfil.
        await this.runRepo.save(GameStateMapper.toDTO(state));
        await this.guardarPerfil(profile);
        return state;
    }

    private async guardarRun(state: GameState): Promise<void> {
        this.cacheStates.set(state.runId, state);
        await this.runRepo.save(GameStateMapper.toDTO(state));
    }
}
