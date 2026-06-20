# PROGRESS.md — Estado de la implementación

Log vivo para **retomar el trabajo** entre sesiones. El Orquestador lo actualiza tras
cada cambio de estado de una tarea; los Implementadores anotan su avance y los
Testeadores su veredicto.

> **Documentos del harness:** `PLAN.md` = visión/arquitectura objetivo (qué construir y por qué) ·
> `WORKFLOW.md` = proceso de agentes (orquestador→implementador→testeador) · `CLAUDE.md` = arquitectura actual.
>
> **Regla de oro:** si algo cambió en el código y no está acá, no pasó. Actualiza este
> archivo *antes* de cerrar la sesión para poder retomar sin releer todo.

---

## Cómo retomar (leer esto primero al volver)

1. Mira **Estado actual** y la tabla de **Fases** para ver qué quedó en progreso/bloqueado.
2. Para la fase activa, baja a **Detalle por fase** y lee su **Próximo paso**.
3. Consulta el **Log de decisiones** para no rehacer discusiones ya cerradas.
4. Verifica el repo antes de seguir: `cd back && npm run build` (y `npm test` desde la Fase 0).

## Estados posibles

`PENDIENTE` · `EN PROGRESO` · `EN TEST` · `BLOQUEADO` · `HECHO` ✅ · `DESCARTADO`

---

## Estado actual

- **Fecha de última actualización**: 2026-06-20
- **Foco actual**: **Fase 0 HECHA ✅** (build/lint/test/servidor verificados). Lista para arrancar F1.
- **Bloqueos abiertos**: ninguno.
- **Próximo paso global**: arrancar **Fase 1** (desacoplar Singletons/HTTP) — la fase más grande; pendiente de luz verde.
- **Nota de entorno**: el Implementador/Testeador no pueden ejecutar `npm` (denegado en su sandbox);
  el Orquestador (sesión principal) **sí** puede → la verificación empírica la corre el Orquestador.
- **Decisiones del usuario pendientes para fases futuras**: cadena `MONGODB_URI` de Atlas (Fase 2);
  host del backend Render/Railway/Fly (Fase 4); proyecto Vercel (Fase 4).

---

## Fases

| ID | Fase | Estado | Depende de | Próximo paso |
|----|------|--------|-----------|--------------|
| F0 | Base de tooling (TS5, jest, eslint, prettier, fix bugs latentes) | HECHO ✅ | — | — |
| F1 | Desacoplar Singletons y HTTP (GameState, GameEngine, equipo por ids, CommandResult) | PENDIENTE | F0 | — |
| F2 | Sesiones + persistencia MongoDB Atlas (perfil/run/histórico, repos, mapper) | PENDIENTE | F1 | — |
| F3 | Jugabilidad roguelike (3a–3j, ver detalle) | PENDIENTE | F1/F2 | — |
| F4 | Despliegue (Vercel + backend persistente) | PENDIENTE | F2 | — |

> El harness (WORKFLOW.md, PROGRESS.md, PLAN.md, skills) ya está creado — fuera de esta tabla de fases.

---

## Detalle por fase

### F0 — Base de tooling
- **Estado**: HECHO ✅ (Implementador 2026-06-20; verificado por el Orquestador)
- **Alcance**: subir TS 3.3.3→5.x; jest/ts-jest, eslint, prettier; scripts test/lint/format;
  `engines.node 20.x`; `tsconfig` strict + target es2020; `jest.config.js`, `.eslintrc.cjs`, `.prettierrc`.
- **Hecho**: `back/package.json` (TS 5.4, devDeps, scripts, engines), `tsconfig` (es2020, `strict:true`,
  `skipLibCheck`), `jest.config.js`, `.eslintrc.cjs`, `.prettierrc`, `tests/comandoManager.test.ts` (4 casos).
  `index.ts` ahora usa los tipos reales de Express (los DOM `Request`/`Response` ya no compilan bajo strict).
- **Bugs corregidos**: `getComando` (retorno `undefined` en rama else); `EquiparObjeto.ejecutar` (catch sin
  return); **`TomarObjeto` duplicación** (el objeto no se quitaba del lugar → ahora `splice`); defaults `null`
  en decoradores y props sin init (compat `strictNullChecks`).
- **Veredicto (Orquestador, empírico)**: PASA. `npm install` ok; `npm run build` exit 0 (TS5 strict limpio);
  `npm test` 4/4 verde; `npm run lint` exit 0 (solo warnings, sin errores); servidor: `?command=status` → 200
  `{command,content}`, `?command=noexiste` → 400. (Testeador subagente quedó bloqueado: `npm` denegado en su sandbox.)
- **Nota menor (no bloqueante)**: comando inválido devuelve `{"error":{}}` (Error serializa vacío en JSON) —
  preexistente; lo resolverá el `CommandResult` tipado de F1.

### F1 — Desacoplar Singletons y HTTP
- **Estado**: PENDIENTE
- **Alcance**: `GameState` (instancia), `GameEngine.ejecutar(input, state)`, des-singletonizar
  `Escenario`/`Bar`/`PersonajeJugable`, nuevo `IComando.ejecutar(agente, state)`, equipo como
  **ids equipados + `rebuildDecoratedPlayer()`**, `CommandResult { ok, message, data?, completions? }`.
- **Criterios**: tests del engine sin HTTP ni globales (tomar→equipar→status cambia stats);
  dos `GameState` no se interfieren (multi-sesión); la app sigue andando con un state temporal.
- **Avance / Veredicto / Próximo paso**: —
- **Nota**: fase más grande y delicada; punto sensible = migración de equipo (Decorator) al modelo por ids.

### F2 — Sesiones + persistencia (MongoDB Atlas)
- **Estado**: PENDIENTE
- **Alcance**: `sessionId` (UUID) por header/query + localStorage; colecciones `profiles`/`runs`/`runHistory`;
  `ProfileRepository`/`RunRepository`/`RunHistoryRepository` (interfaz + InMemory + Mongo/mongoose);
  DTO plano + `GameStateMapper` + `ObjetoFactory`/`LugarFactory`; `schemaVersion` día 1; ciclo
  resolver→cargar→ejecutar→guardar con caché write-through.
- **Criterios**: round-trip `toDTO/fromDTO` in-memory; smoke contra Atlas (persiste tras reinicio);
  el perfil sobrevive aunque se borre la run.
- **Bloqueo potencial**: requiere `MONGODB_URI` de Atlas (decisión/credencial del usuario).
- **Avance / Veredicto / Próximo paso**: —

### F3 — Jugabilidad roguelike (envío incremental por sub-fase)
- **Estado**: PENDIENTE

| Sub | Qué | Depende |
|-----|-----|---------|
| 3a | `atacar` + Strategy de armas (Espada/Arco/Martillo, puños por defecto) | F1 |
| 3b | Ciclo run: `crear`/morir/`abandonar` (bankeo + archivado + delete) | F2 |
| 3c | Monedas: oro (run) + plata (perfil) | 3b |
| 3d | Tiendas hub (plata) + en-run (oro), comando `comprar` | 3c |
| 3e | Consumibles + Strategy de efectos (`usar`, `IEfecto`) | 3a |
| 3f | Más salas/enemigos/NPCs + `mover`, catálogos/pools | F2 (`LugarFactory`) |
| 3g | Loot encontrable (tablas de botín) | 3f |
| 3h | Generación procedural por semilla (`RunGenerator` determinista) | 3f/3g |
| 3i | XP / niveles (dentro de la run) | 3a |
| 3j | Histórico (lectura): `list` + `getDetalle` para el hub | 3b + F2 |

- **Transversal**: `CrearPersonaje` aplica `profile.mejoras` a los stats iniciales (meta-progresión).
- **Criterios**: loop determinista sin HTTP (crear→combatir→morir: objetos/oro se pierden, plata
  al perfil, run archivada); comprar en hub persiste mejora a la siguiente run; misma semilla = mismo
  mapa; cada Strategy de arma/efecto da su patrón esperado. Semilla inyectable si se añade azar.
- **Avance / Veredicto / Próximo paso**: —

### F4 — Despliegue (Vercel + backend persistente)
- **Estado**: PENDIENTE
- **Alcance front**: `RequestManager` por `REACT_APP_API_URL` + `sessionId`; `.env.example`, `vercel.json`;
  router hub↔run; **Hub** (web de gestión: perfil/plata, tienda mejoras, histórico+detalle, "empezar run");
  **Run** (TUI con autocompletado desde `completions`, `useAutocomplete.ts`); `GameContext`.
- **Alcance back**: `PORT`/`CORS_ORIGIN`/env, middleware tipado, `/health`, bootstrap Mongo (`mongo.ts`),
  `Dockerfile`/`Procfile`, `.env.example`.
- **Criterios**: `/health` y `/command` por curl; CORS rechaza otros orígenes; sesión sobrevive a redeploy.
- **Bloqueo potencial**: requiere host de backend y proyecto Vercel (decisión del usuario).
- **Avance / Veredicto / Próximo paso**: —

---

## Log de decisiones

| Fecha | Decisión | Motivo |
|-------|----------|--------|
| 2026-06-20 | Harness y skills en este repo (`.claude/skills/`), no globales | Versionado junto al proyecto |
| 2026-06-20 | Skills concisas y accionables | Rápidas de crear y mantener |
| 2026-06-20 | Adoptado `PLAN.md`: roguelike con meta-progresión, Atlas, Vercel + backend persistente | Acuerdo de visión con el usuario |
| 2026-06-20 | Equipo modelado por **ids equipados** (no `setInstance` encadenado) | Serializable, desequipar trivial, Decorator más claro |
| 2026-06-20 | **mongoose** sobre driver nativo; **sessionId UUID sin auth** | Claridad educativa; simplicidad honesta documentada |
| 2026-06-20 | Mapa **procedural por semilla** (no serializado); `RunGenerator` determinista | Runs infinitas + persistencia barata |

---

## Bitácora (lo más reciente arriba)

- **2026-06-20** — **F0 HECHA ✅**: tooling (TS5/jest/eslint/prettier) + 3 bugs corregidos. Verificada
  empíricamente por el Orquestador (build/test/lint/servidor verdes). 486 paquetes instalados en `back/`.
- **2026-06-20** — Acordado `PLAN.md` (cambios grandes) y descompuesto en F0–F4 en este archivo.
- **2026-06-20** — Creado el harness: `WORKFLOW.md`, `PROGRESS.md` y 6 skills.
