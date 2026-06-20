import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import mongoose from 'mongoose';
import GameEngine from './src/Game/GameEngine';
import SessionManager from './src/Persistence/SessionManager';
import MongoProfileRepository from './src/Persistence/MongoProfileRepository';
import MongoRunRepository from './src/Persistence/MongoRunRepository';
import MongoRunHistoryRepository from './src/Persistence/MongoRunHistoryRepository';
import { conectarMongo } from './src/Persistence/mongo';

const app = express();

// Puerto por entorno (12-factor): Render (u otro host) inyecta `PORT`. En dev
// local, sin la variable, cae al 3001 de siempre.
const port = Number(process.env.PORT) || 3001;

// Motor sin estado de juego y manager de sesiones con repos Mongo (Atlas).
// La caché write-through del SessionManager aprovecha el backend persistente:
// lee de caché y, si falta, de Mongo; al escribir, actualiza caché Y Mongo.
const engine = new GameEngine();
const sessionManager = new SessionManager(
  new MongoProfileRepository(),
  new MongoRunRepository(),
  new MongoRunHistoryRepository()
);

// CORS configurable por entorno. Si `CORS_ORIGIN` está definido (prod), se
// restringe a ese/esos origen(es) — acepta una lista separada por comas, p. ej.
// "https://mi-front.vercel.app,https://otro.com". Si NO está definido (dev
// local), se permite cualquier origen, conservando el comportamiento actual y
// sin romper el flujo de desarrollo.
const corsOrigenCrudo = process.env.CORS_ORIGIN;
const corsOptions: CorsOptions = corsOrigenCrudo
  ? {
      origin: corsOrigenCrudo
        .split(',')
        .map((origen) => origen.trim())
        .filter((origen) => origen.length > 0)
    }
  : {};

app.use(cors(corsOptions))

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('URL: ', req.url)
  next()
})

// Healthcheck para Render (y cualquier orquestador). Es deliberadamente liviano
// e independiente del juego/persistencia: nunca consulta la red ni depende de
// que Mongo esté arriba — sólo refleja el `readyState` de la conexión mongoose.
// Un fallo de Mongo NO debe tumbar este endpoint: reporta 'desconectado'.
app.get('/health', (_req: Request, res: Response) => {
  let mongoEstado: string;
  try {
    // mongoose.connection.readyState: 0=desconectado,1=conectado,2=conectando,3=desconectando
    mongoEstado = mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado';
  } catch {
    mongoEstado = 'desconectado';
  }
  return res.status(200).send({ status: 'ok', mongo: mongoEstado });
})

/**
 * Resuelve el sessionId entrante desde el header `x-session-id` o el query
 * `?sessionId=`. Devuelve `undefined` si no llega (el SessionManager generará uno).
 */
function resolverSessionIdEntrante(req: Request): string | undefined {
  const header = req.header('x-session-id');
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim();
  }
  const query = req.query.sessionId;
  if (typeof query === 'string' && query.trim().length > 0) {
    return query.trim();
  }
  return undefined;
}

app.get('/command', async (req, res) => {
  try {
    const command = req.query.command
    if (typeof command !== 'string') {
      throw new Error('Comando inválido')
    }

    // Ciclo roguelike: resolver sessionId → cargar perfil (crear si no existe) →
    // cargar run activa SÓLO si el perfil apunta a una (sin auto-crear; si no,
    // queda en el hub) → ejecutar el comando sobre el contexto → si la run
    // terminó (muerte/abandono) ejecutar el cierre (bankear/archivar/borrar/
    // limpiar runActivaId) → guardar perfil/run → responder.
    const sessionIdEntrante = resolverSessionIdEntrante(req)
    const sesion = await sessionManager.resolver(sessionIdEntrante)
    const resultado = engine.ejecutarSesion(command, sesion.contexto)
    await sessionManager.cerrarSiTermino(sesion.contexto)
    await sessionManager.guardar(sesion)

    // Indica si el jugador está en el hub (sin run activa) o en una run, además
    // del `content` humano (compat frontend).
    const enHub = sesion.contexto.state === null

    // Devolvemos el sessionId resuelto (header y body) para que el cliente lo
    // persista si el servidor lo generó.
    res.setHeader('x-session-id', sesion.sessionId)
    return res.status(200).send({
      command,
      sessionId: sesion.sessionId,
      content: resultado.message,
      ok: resultado.ok,
      enHub,
      data: resultado.data,
      completions: resultado.completions
    });
  } catch (error) {
    return res.status(400).send({
      error: error instanceof Error ? error.message : 'Error inesperado'
    });
  }
});

// Conexión a Atlas una sola vez antes de levantar el servidor.
conectarMongo()
  .then(() => {
    app.listen(port, () => {
      console.log(`[server]: Server is running on port ${port}`);
    });
  })
  .catch((error: unknown) => {
    const motivo = error instanceof Error ? error.message : String(error);
    console.error('[server]: no se pudo iniciar por fallo de conexión a Mongo:', motivo);
    process.exit(1);
  });
