import mongoose, { Schema, Model } from "mongoose";
import { ProfileDTO, RunDTO, RunHistoryDTO, ResumenRun, JugadorDTO, EscenarioDTO } from "./dtos";

/**
 * Bootstrap de la conexión a MongoDB Atlas y definición de los esquemas
 * Mongoose explícitos (claridad educativa). La conexión se abre **una vez** al
 * arrancar (antes de `app.listen`) y se reutiliza; nunca por request.
 *
 * La cadena de conexión se lee de `process.env.MONGO_CONNECTION_STRING` (cargada
 * por `dotenv` en `index.ts`). NUNCA se imprime ni se hardcodea.
 */

let conectado = false;

/**
 * Conecta a Atlas usando `MONGO_CONNECTION_STRING`. Idempotente: si ya hay
 * conexión, no reconecta. Lanza si falta la variable o si la conexión falla,
 * logueando claro (sin filtrar la cadena).
 */
export async function conectarMongo(): Promise<void> {
    if (conectado) {
        return;
    }
    const cadena = process.env.MONGO_CONNECTION_STRING;
    if (!cadena) {
        throw new Error(
            'Falta la variable de entorno MONGO_CONNECTION_STRING (¿definida en back/.env?).'
        );
    }
    try {
        await mongoose.connect(cadena);
        conectado = true;
        console.log('[mongo]: conexión a Atlas establecida.');
    } catch (error) {
        // No se imprime la cadena; sólo el motivo del fallo.
        const motivo = error instanceof Error ? error.message : String(error);
        console.error('[mongo]: fallo al conectar a Atlas:', motivo);
        throw error;
    }
}

/** Cierra la conexión (útil para tests de integración / apagado limpio). */
export async function desconectarMongo(): Promise<void> {
    if (!conectado) {
        return;
    }
    await mongoose.disconnect();
    conectado = false;
}

// --- Esquemas explícitos --------------------------------------------------

const JugadorSchema = new Schema<JugadorDTO>(
    {
        nombre: { type: String, required: true },
        vidaMaxima: { type: Number, required: true },
        vidaActual: { type: Number, required: true },
        destreza: { type: Number, required: true, default: 1 },
        oro: { type: Number, required: true, default: 0 },
        inventario: { type: [String], required: true, default: [] },
        equipados: { type: [String], required: true, default: [] }
    },
    { _id: false }
);

const EscenarioSchema = new Schema<EscenarioDTO>(
    {
        lugarId: { type: String, required: true, default: 'bar' },
        salasVisitadas: { type: [String], required: true, default: [] }
    },
    { _id: false }
);

const ProfileSchema = new Schema<ProfileDTO>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        schemaVersion: { type: Number, required: true },
        plata: { type: Number, required: true, default: 0 },
        mejoras: { type: [String], required: true, default: [] },
        runActivaId: { type: String, required: false }
    },
    { collection: 'profiles' }
);

const RunSchema = new Schema<RunDTO>(
    {
        runId: { type: String, required: true, unique: true, index: true },
        sessionId: { type: String, required: true, index: true },
        schemaVersion: { type: Number, required: true },
        semilla: { type: Number, required: true, default: 0 },
        jugador: { type: JugadorSchema, required: true },
        escenario: { type: EscenarioSchema, required: true }
    },
    { collection: 'runs' }
);

// Esquema embebido para el snapshot del histórico: misma forma que `RunDTO`
// pero SIN índices `unique` (evita índices conflictivos al embeberlo y permite
// múltiples snapshots con datos repetidos en `runHistory`).
const RunSnapshotSchema = new Schema<RunDTO>(
    {
        runId: { type: String, required: true },
        sessionId: { type: String, required: true },
        schemaVersion: { type: Number, required: true },
        semilla: { type: Number, required: true, default: 0 },
        jugador: { type: JugadorSchema, required: true },
        escenario: { type: EscenarioSchema, required: true }
    },
    { _id: false }
);

const ResumenRunSchema = new Schema<ResumenRun>(
    {
        runId: { type: String, required: true },
        sessionId: { type: String, required: true },
        nombre: { type: String, required: true },
        salasVisitadas: { type: Number, required: true, default: 0 },
        oro: { type: Number, required: true, default: 0 },
        causa: { type: String, required: false },
        terminadaEn: { type: String, required: true }
    },
    { _id: false }
);

const RunHistorySchema = new Schema<RunHistoryDTO>(
    {
        runId: { type: String, required: true, unique: true, index: true },
        sessionId: { type: String, required: true, index: true },
        schemaVersion: { type: Number, required: true },
        resumen: { type: ResumenRunSchema, required: true },
        detalle: { type: RunSnapshotSchema, required: true }
    },
    { collection: 'runHistory' }
);

/**
 * Registra (o reutiliza) un modelo Mongoose. Reutilizar evita el error
 * `OverwriteModelError` si el módulo se evalúa más de una vez (p. ej. en tests).
 */
function modelo<TDoc>(nombre: string, schema: Schema<TDoc>): Model<TDoc> {
    return (mongoose.models[nombre] as Model<TDoc>) || mongoose.model<TDoc>(nombre, schema);
}

export const ProfileModel: Model<ProfileDTO> = modelo<ProfileDTO>('Profile', ProfileSchema);
export const RunModel: Model<RunDTO> = modelo<RunDTO>('Run', RunSchema);
export const RunHistoryModel: Model<RunHistoryDTO> = modelo<RunHistoryDTO>(
    'RunHistory',
    RunHistorySchema
);
