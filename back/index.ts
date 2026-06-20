import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import GameEngine from './src/Game/GameEngine';
import SessionManager from './src/Persistence/SessionManager';
import MongoProfileRepository from './src/Persistence/MongoProfileRepository';
import MongoRunRepository from './src/Persistence/MongoRunRepository';
import { conectarMongo } from './src/Persistence/mongo';

const app = express();
const port = 3001;

// Motor sin estado de juego y manager de sesiones con repos Mongo (Atlas).
// La caché write-through del SessionManager aprovecha el backend persistente:
// lee de caché y, si falta, de Mongo; al escribir, actualiza caché Y Mongo.
const engine = new GameEngine();
const sessionManager = new SessionManager(
  new MongoProfileRepository(),
  new MongoRunRepository()
);

app.use(cors())

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('URL: ', req.url)
  next()
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

    // Ciclo: resolver sessionId → cargar perfil (crear si no existe) → cargar
    // run activa (crear si no hay) → ejecutar → guardar perfil/run → responder.
    const sessionIdEntrante = resolverSessionIdEntrante(req)
    const sesion = await sessionManager.resolver(sessionIdEntrante)
    const resultado = engine.ejecutar(command, sesion.state)
    await sessionManager.guardar(sesion)

    // Devolvemos el sessionId resuelto (header y body) para que el cliente lo
    // persista si el servidor lo generó.
    res.setHeader('x-session-id', sesion.sessionId)
    return res.status(200).send({
      command,
      sessionId: sesion.sessionId,
      content: resultado.message,
      ok: resultado.ok,
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
      console.log(`[server]: Server is running at https://localhost:${port}`);
    });
  })
  .catch((error: unknown) => {
    const motivo = error instanceof Error ? error.message : String(error);
    console.error('[server]: no se pudo iniciar por fallo de conexión a Mongo:', motivo);
    process.exit(1);
  });
