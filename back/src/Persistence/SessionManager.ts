import { randomUUID } from "crypto";
import GameState from "../Game/GameState";
import crearGameState, { generarSemilla } from "../Game/crearGameState";
import SesionContexto from "../Game/SesionContexto";
import GameStateMapper from "./GameStateMapper";
import { ProfileDTO, ResumenRun, RunHistoryDTO } from "./dtos";
import { ProfileRepository } from "./ProfileRepository";
import { RunRepository } from "./RunRepository";
import { RunHistoryRepository } from "./RunHistoryRepository";

/**
 * Resultado de resolver una sesión: el perfil durable y el **contexto** de
 * sesión (perfil + run activa, o hub si no hay run). El llamador (la ruta HTTP)
 * ejecuta el comando sobre el contexto vía `GameEngine.ejecutarSesion` y luego:
 *   1. `cerrarSiTermino(contexto)` — si la run terminó (muerte/abandono).
 *   2. `guardar(contexto)` — persiste perfil + run activa (si sigue habiendo).
 */
export interface SesionResuelta {
    sessionId: string;
    profile: ProfileDTO;
    contexto: SesionContexto;
}

/**
 * Orquesta sesiones con una **caché en memoria write-through**: lee de caché y,
 * si falta, de los repositorios; al escribir, actualiza caché Y repositorio.
 * Mongo es la fuente de verdad durable; la caché aprovecha que el backend es
 * persistente entre requests.
 *
 * Modelo roguelike: la sesión SIEMPRE tiene un **perfil** (durable); puede o no
 * tener una **run activa**. **NO auto-crea** la run: sin run activa el jugador
 * queda en el **hub** y la run se inicia sólo con `crear` (vía el iniciador del
 * `SesionContexto`).
 *
 * Depende sólo de las **interfaces** de repositorio → en tests se inyectan las
 * implementaciones InMemory y nada toca la red.
 */
export default class SessionManager {
    private readonly profileRepo: ProfileRepository;
    private readonly runRepo: RunRepository;
    private readonly historyRepo: RunHistoryRepository;

    /** Caché write-through de perfiles, por sessionId. */
    private readonly cacheProfiles: Map<string, ProfileDTO> = new Map();
    /** Caché write-through de runs vivas, por runId. */
    private readonly cacheStates: Map<string, GameState> = new Map();

    constructor(
        profileRepo: ProfileRepository,
        runRepo: RunRepository,
        historyRepo: RunHistoryRepository
    ) {
        this.profileRepo = profileRepo;
        this.runRepo = runRepo;
        this.historyRepo = historyRepo;
    }

    /** Genera un sessionId nuevo (UUID). */
    public static nuevoSessionId(): string {
        return randomUUID();
    }

    /**
     * Resuelve una sesión: carga (o crea) su perfil y, **sólo si** el perfil
     * apunta a una run existente, la carga como `state` vivo. Si no, el contexto
     * queda en el **hub** (`state === null`); la run se inicia con `crear`.
     */
    public async resolver(sessionIdEntrante?: string): Promise<SesionResuelta> {
        const sessionId = sessionIdEntrante && sessionIdEntrante.trim().length > 0
            ? sessionIdEntrante.trim()
            : SessionManager.nuevoSessionId();

        const profile = await this.cargarOcrearPerfil(sessionId);
        const state = await this.cargarRunActiva(profile);
        const { historial, detalles } = await this.cargarHistorial(sessionId);

        const contexto = new SesionContexto(
            profile,
            state,
            () => this.iniciarRun(profile),
            historial,
            detalles
        );

        return { sessionId, profile, contexto };
    }

    /**
     * Carga el **histórico (3j)** de la sesión desde el `RunHistoryRepository`:
     * la lista de resúmenes (`list`, ya filtrada por `sessionId`) y, para cada
     * run propia, su detalle completo (`getDetalle`). El mapa de detalles se
     * construye SÓLO con los `runId` que `list` devolvió para esta sesión, así la
     * pertenencia queda garantizada de forma estructural: nunca se inyecta el
     * detalle de una run de otra sesión. El motor/comandos sólo leen este dato
     * desde el `SesionContexto` (no importan Mongo).
     */
    private async cargarHistorial(
        sessionId: string
    ): Promise<{ historial: ResumenRun[]; detalles: Map<string, RunHistoryDTO> }> {
        const historial = await this.historyRepo.list(sessionId);
        const detalles = new Map<string, RunHistoryDTO>();
        for (const resumen of historial) {
            const detalle = await this.historyRepo.getDetalle(resumen.runId);
            // Doble verificación de pertenencia: aunque `list` ya filtra por
            // sessionId, sólo indexamos el detalle si efectivamente es de esta
            // sesión (defensa contra docs inconsistentes).
            if (detalle && detalle.sessionId === sessionId) {
                detalles.set(resumen.runId, detalle);
            }
        }
        return { historial, detalles };
    }

    /**
     * Cierra la run si quedó marcada como terminada (muerte/abandono). Cierre
     * **atómico en orden**: bankear plata → archivar al histórico → borrar de
     * activas → limpiar `runActivaId` → guardar perfil. El jugador queda en el
     * hub (`contexto.state === null`). Se pierden objetos, equipo y oro; el
     * registro queda en el histórico.
     */
    public async cerrarSiTermino(contexto: SesionContexto): Promise<void> {
        const state = contexto.state;
        if (state === null || !state.terminada) {
            return;
        }

        const profile = contexto.profile;
        const dto = GameStateMapper.toDTO(state);
        const causa = state.causaFin ?? 'abandono';
        const plataBankeada = Math.max(0, state.plataAcumulada);

        // a. Bankear: la plata acumulada de la run pasa al perfil durable.
        profile.plata += plataBankeada;

        // b. Archivar: snapshot inmutable + resumen al histórico.
        const resumen: ResumenRun = {
            runId: state.runId,
            sessionId: state.sessionId,
            nombre: state.jugador.getNombre(),
            salasVisitadas: state.salasVisitadas.length,
            oro: state.jugador.getOro(),
            // Nivel alcanzado en la run (3i): se archiva en el resumen del
            // histórico, NO en el perfil. XP/nivel se pierden con la run. Se lee
            // por getter (reenviado por el Decorator si el jugador está equipado).
            nivel: state.jugador.getNivel(),
            vidaActual: Math.max(0, state.jugador.getVidaActual()),
            plataBankeada,
            causa,
            terminadaEn: new Date().toISOString()
        };
        await this.historyRepo.archive(dto, resumen);

        // c. Borrar de activas y limpiar la caché de la run.
        await this.runRepo.delete(state.runId);
        this.cacheStates.delete(state.runId);

        // c/d. Desenlazar la run del perfil (queda en el hub) y guardar perfil.
        profile.runActivaId = undefined;
        await this.guardarPerfil(profile);

        // El contexto queda en el hub.
        contexto.state = null;
    }

    /** Persiste perfil + run activa (write-through). En el hub sólo el perfil. */
    public async guardar(sesion: SesionResuelta): Promise<void> {
        await this.guardarPerfil(sesion.profile);
        const state = sesion.contexto.state;
        if (state !== null) {
            await this.guardarRun(state);
        }
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

    /**
     * Carga la run activa del perfil, o `null` si está en el hub. NO crea ninguna
     * run. Si `runActivaId` apunta a una run inexistente (p. ej. ya cerrada), se
     * limpia el enlace y se devuelve `null` (hub).
     */
    private async cargarRunActiva(profile: ProfileDTO): Promise<GameState | null> {
        const runActivaId = profile.runActivaId;
        if (!runActivaId) {
            return null;
        }

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

        // El perfil apuntaba a una run inexistente: se desenlaza (hub).
        profile.runActivaId = undefined;
        await this.guardarPerfil(profile);
        return null;
    }

    /**
     * Iniciador de run inyectado en el `SesionContexto` (lo invoca `crear`).
     * Crea un `GameState` fresco, lo enlaza al perfil y lo cachea. **No persiste
     * aquí**: el ciclo de sesión llama a `guardar` al final del request, que
     * escribe run + perfil. Así el iniciador es síncrono (no obliga a comandos
     * async) y la persistencia queda centralizada en `guardar`/`cerrarSiTermino`.
     */
    private iniciarRun(profile: ProfileDTO): GameState {
        const runId = SessionManager.nuevoSessionId();
        // Mapa procedural (3h): genera una semilla VARIABLE para que cada run
        // tenga su propio mapa determinista (el `RunGenerator` la consume por
        // semilla). En tests, en cambio, `crearGameState` cae al layout fijo.
        const semilla = generarSemilla();
        // Meta-progresión (3d): las mejoras compradas en el hub se aplican a los
        // stats/inventario iniciales del personaje al crear la run.
        const state = crearGameState(profile.sessionId, runId, semilla, profile.mejoras);
        profile.runActivaId = runId;
        this.cacheStates.set(runId, state);
        return state;
    }

    private async guardarRun(state: GameState): Promise<void> {
        this.cacheStates.set(state.runId, state);
        await this.runRepo.save(GameStateMapper.toDTO(state));
    }
}
