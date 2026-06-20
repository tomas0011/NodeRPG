/**
 * DTOs planos de persistencia (Fase 2).
 *
 * Punto clave: NO se serializa el grafo de objetos vivos (jugador decorado,
 * objetos del inventario, lugar). Se guardan **datos planos + ids**; al cargar,
 * las fábricas (`ObjetoFactory`, `LugarFactory`) y `rebuildDecoratedPlayer()`
 * reconstruyen el comportamiento. Así la serialización sobrevive al patrón
 * Decorator y a las (futuras) estrategias sin pérdida.
 *
 * `schemaVersion` viaja en cada documento desde el día 1 para permitir
 * migraciones futuras; la deserialización es **tolerante** (campos nuevos
 * ausentes en docs viejos caen a defaults sensatos).
 */

/**
 * Versión de esquema vigente de cada agregado. Bump al cambiar la forma.
 * v2 (3i): el `JugadorDTO` añade `xp`/`nivel`. Deserialización tolerante: docs
 * v1 sin esos campos caen a `xp:0`/`nivel:1` sin romper.
 */
export const SCHEMA_VERSION = 2;

/** Jugador de una run, en forma plana y serializable. */
export interface JugadorDTO {
    nombre: string;
    vidaMaxima: number;
    vidaActual: number;
    destreza: number;
    oro: number;
    /**
     * XP acumulada hacia el siguiente nivel (run; 3i). Tolerante: ausente en docs
     * v1 ⇒ 0. **Efímero**: vive en la run, NO en el perfil.
     */
    xp: number;
    /**
     * Nivel dentro de la run (3i). Tolerante: ausente en docs v1 ⇒ 1.
     * **Efímero**: vive en la run, NO en el perfil.
     */
    nivel: number;
    /** Ids (nombres) de los objetos del inventario. */
    inventario: string[];
    /** Ids (nombres) de los objetos equipados, en orden de equipamiento. */
    equipados: string[];
}

/** Escenario de una run, en forma plana y serializable. */
export interface EscenarioDTO {
    lugarId: string;
    salasVisitadas: string[];
}

/** DTO completo de una run activa (colección `runs`). */
export interface RunDTO {
    runId: string;
    sessionId: string;
    schemaVersion: number;
    semilla: number;
    /**
     * Plata acumulada en la run, pendiente de bancar al perfil al cerrarla. Su
     * generación por combate/botín es 3c; campo tolerante (default 0 si falta).
     */
    plataAcumulada: number;
    jugador: JugadorDTO;
    escenario: EscenarioDTO;
}

/** DTO del perfil durable (colección `profiles`). Nunca se borra. */
export interface ProfileDTO {
    sessionId: string;
    schemaVersion: number;
    /** Moneda persistente del perfil (su USO es Fase 3). */
    plata: number;
    /** Mejoras/desbloqueos permanentes comprados en el hub (su USO es Fase 3). */
    mejoras: string[];
    /** Id de la run activa, si hay una en curso. */
    runActivaId?: string;
}

/** Resumen inmutable de una run terminada, para el listado del histórico. */
export interface ResumenRun {
    runId: string;
    sessionId: string;
    nombre: string;
    salasVisitadas: number;
    oro: number;
    /** Nivel alcanzado en la run al cerrarla (3i). Efímero del resumen, opcional. */
    nivel?: number;
    /** Vida del jugador al cerrar la run (0 si murió). */
    vidaActual?: number;
    /** Plata bankeada al perfil al cerrar la run. */
    plataBankeada?: number;
    /** Causa de cierre: muerte | abandono (lo dispara Fase 3). */
    causa?: string;
    terminadaEn: string;
}

/** DTO del histórico de una run archivada (colección `runHistory`). */
export interface RunHistoryDTO {
    runId: string;
    sessionId: string;
    schemaVersion: number;
    resumen: ResumenRun;
    /** Snapshot completo de la run en el momento de archivarse. */
    detalle: RunDTO;
}
