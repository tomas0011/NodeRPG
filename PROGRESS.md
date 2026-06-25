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

- **Fecha de última actualización**: 2026-06-24
- **Foco actual**: **F4** — backend-deploy (Render) ✅ + **config Vercel** ✅ (`RequestManager` por `REACT_APP_API_URL`, `vercel.json`, `.env.example`). Despliega la **consola actual**; la **UI nueva** (hub web + TUI) sigue pendiente.
- **Rama de trabajo**: `feat/new-tui-rpg` (el usuario partió de aquí; al terminar se mergea a `develop`).
- **Bloqueos abiertos**: ninguno (la credencial de Atlas quedó resuelta por el usuario; conexión OK).
- **Próximo paso global**: **F4 (despliegue)** — front en Vercel + backend persistente (Render/Railway/Fly). Necesita: elegir host del backend y proyecto Vercel.
- **Nota Atlas**: la env var se llama **`MONGO_CONNECTION_STRING`** (no `MONGODB_URI`). El código usa ese nombre + `dotenv`.
- **Commits**: F0–F3e commiteados por el usuario en `feat/new-tui-rpg`. El usuario maneja sus commits.
- **Verificación cruzada (post-F0)**: `back/` build/test/lint/servidor ✅; `app/` `npm run build` ✅ exit 0
  (warning preexistente de `useEffect` en `consoleOutput.tsx`, no bloqueante). F0 fue solo `back/` (app va en F4).
- **Nota de entorno**: el Implementador/Testeador no pueden ejecutar `npm` (denegado en su sandbox);
  el Orquestador (sesión principal) **sí** puede → la verificación empírica la corre el Orquestador.
- **Decisiones del usuario pendientes para fases futuras**: cadena `MONGODB_URI` de Atlas (Fase 2);
  host del backend Render/Railway/Fly (Fase 4); proyecto Vercel (Fase 4).

---

## Fases

| ID | Fase | Estado | Depende de | Próximo paso |
|----|------|--------|-----------|--------------|
| F0 | Base de tooling (TS5, jest, eslint, prettier, fix bugs latentes) | HECHO ✅ | — | — |
| F1 | Desacoplar Singletons y HTTP (GameState, GameEngine, equipo por ids, CommandResult) | HECHO ✅ | F0 | — |
| F2 | Sesiones + persistencia MongoDB Atlas (perfil/run/histórico, repos, mapper) | HECHO ✅ | F1 | — |
| F3 | Jugabilidad roguelike (3a–3j, ver detalle) | HECHO ✅ (10/10) | F1/F2 | — |
| F4 | Despliegue (Vercel + backend persistente) | EN PROGRESO | F2 | Backend-deploy (Render) ✅; falta UI (hub+TUI) + Vercel |

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
- **Estado**: HECHO ✅ (Implementador 2026-06-20; verificado por el Orquestador)
- **Hecho** (nuevos): `Game/GameState.ts` (instancia, equipo por ids `equipados[]` + `rebuildDecoratedPlayer()`
  determinista por orden de inserción), `Game/GameEngine.ts` (`ejecutar(input, state)`, sin estado de juego),
  `Game/CommandResult.ts`, `Game/crearGameState.ts` (factory), `tests/gameEngine.test.ts` (13 casos).
  Borrados: `Comando/ComandosManager.ts` y su test.
- **Hecho** (modif): `IComando.ejecutar(agente, state)`; comandos `GetStatus/GetEscenario/TomarObjeto/EquiparObjeto/GetHelp`
  leen del `state`; `Escenario`/`Bar`/`PersonajeJugable` **des-singletonizados**; `index.ts` con un `GameState`
  único a nivel de módulo (no singleton), respuesta con `content` + `ok`/`data`/`completions`.
- **Diseño**: `jugadorBase` (dueño del inventario) + `jugador` derivado decorado. `equipar(id)` idempotente
  (valida inventario+equipable, añade id, rebuild); `desequipar(id)` quita+rebuild. `GetHelp` recibe las claves
  por inyección (closure del engine), sin acceso global. Equipo = función pura de (base + ids) → serializable para F2.
- **Veredicto (Orquestador, empírico)**: PASA. `build` exit 0 (TS5 strict); `npm test` **13/13** (incluye multi-sesión,
  idempotencia, desequipar, rebuild determinista espada+cuero); `lint` exit 0; servidor: `status`→200 con `content`+`data`,
  `escenario`→200 con `completions:{tomar:[...]}`, inválido→400; `grep` confirma **cero** globales de estado de juego residuales.
- **Notas (no bloqueantes)**: comando inválido sigue devolviendo `{"error":{}}` (Error vacío preexistente; CommandResult
  ya existe → fácil de pulir en F2/F4); `Objeto.getModificacion(): any` preexistente; warnings de params `_` en `GetHelp`.

### F2 — Sesiones + persistencia (MongoDB Atlas)
- **Estado**: HECHO ✅ (Implementador 2026-06-20; verificado por el Orquestador, incl. smoke Atlas real)
- **Hecho** (nuevos en `Persistence/`): `dtos.ts` (+`SCHEMA_VERSION=1`), `GameStateMapper.ts`,
  `ProfileRepository`/`RunRepository`/`RunHistoryRepository` (interfaz + InMemory), `Mongo*Repository.ts` (mongoose),
  `mongo.ts` (bootstrap `conectarMongo`/esquemas), `SessionManager.ts` (resolución sesión + caché write-through);
  `Objeto/ObjetoFactory.ts`, `Escenario/LugarFactory.ts`; `tests/persistence.test.ts`.
- **Hecho** (modif): `index.ts` (ciclo sesión + dotenv + bootstrap), `Game/{GameState,crearGameState}` (+runId/semilla/lugarId/salasVisitadas),
  `Personaje/*` (+`oro`/`getOro()` default 0), `package.json` (+mongoose ^8.5.1, +dotenv ^16.4.5),
  `app/src/utils/RequestManager.ts` (sessionId en localStorage vía `crypto.randomUUID()`, enviado como `?sessionId=`).
- **Sesión**: header `x-session-id` o query `?sessionId=`; si falta, genera UUID y lo devuelve. Perfil siempre; run se crea si no hay.
- **Veredicto (Orquestador, empírico)**: PASA. `build` ✅, `npm test` **23/23** ✅ (round-trip sin pérdida, perfil sobrevive
  a borrar run, multi-sesión — repos InMemory), `lint` ✅. **Smoke Atlas real ✅** (tras corregir la credencial): guardar run con
  espada equipada → desconectar (simula reinicio) → reconectar caché fría → cargar → `dadoDeGolpe=6` y `equipados=["espada"]`
  reconstruidos sin pérdida; inventario recuperado; run borrada pero **perfil sobrevive**. Datos de prueba limpiados de Atlas.
- **Nota**: el smoke se hizo con un script temporal a nivel de repos (`conectar/save/desconectar/reconectar/load`), ya eliminado.

### F3 — Jugabilidad roguelike (envío incremental por sub-fase)
- **Estado**: PENDIENTE

| Sub | Qué | Depende | Estado |
|-----|-----|---------| ------ |
| 3a | `atacar` + Strategy de armas (Espada/Arco/Martillo, puños por defecto) | F1 | **HECHO ✅** |
| 3b | Ciclo run: `crear`/morir/`abandonar` (bankeo + archivado + delete) | F2 | **HECHO ✅** |
| 3c | Monedas: oro (run) + plata (perfil) | 3b | **HECHO ✅** |
| 3d | Tiendas hub (plata) + en-run (oro), comando `comprar` | 3c | **HECHO ✅** |
| 3e | Consumibles + Strategy de efectos (`usar`, `IEfecto`) | 3a | **HECHO ✅** |
| 3f | Más salas/enemigos/NPCs + `mover`, catálogos/pools | F2 (`LugarFactory`) | **HECHO ✅** |
| 3g | Loot encontrable (tablas de botín) | 3f | **HECHO ✅** |
| 3h | Generación procedural por semilla (`RunGenerator` determinista) | 3f/3g | **HECHO ✅** |
| 3i | XP / niveles (dentro de la run) | 3a | **HECHO ✅** |
| 3j | Histórico (lectura): `list` + `getDetalle` para el hub | 3b + F2 | **HECHO ✅** |

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

- **2026-06-24** — **Frontend: la consola recupera el foco tras enviar con Enter ✅**: en `app/` se ajustó `app/src/components/run/Consola.tsx` para conservar la intención de foco al enviar un comando y re-enfocar automáticamente el input cuando deja de estar `ocupado`, evitando que el usuario tenga que volver a hacer click para seguir escribiendo. Se agregó cobertura en `app/src/components/run/Consola.test.tsx` para el caso de `Enter` + deshabilitado temporal + re-habilitación con foco restaurado, además de conservar los casos del autocompletado reciente. Veredicto del Testeador fresco: **PASA**. Evidencia: `cd app && cmd /c npm test -- --watchAll=false --runInBand Consola.test.tsx` ✅ (**1 suite, 5 tests**); `cd app && cmd /c npm run build` ✅; `cd app && cmd /c npm test -- --watchAll=false` ✅ (**2 suites, 8 tests**). En sandbox aparecieron `spawn EPERM` para `build` y la suite completa; reejecutados fuera del sandbox pasaron. Queda un warning no bloqueante de `ReactDOMTestUtils.act`.
- **2026-06-24** — **Frontend: autocompletado sólo con texto y matching sin tildes/mayúsculas ✅**: en `app/` se ajustó el autocompletado de la consola para que **no** muestre sugerencias al hacer focus con el input vacío y sólo liste coincidencias cuando el usuario ya escribió al menos 1 carácter. Además, el matching de comandos y argumentos ahora ignora mayúsculas/minúsculas y tildes, manteniendo visibles los textos canónicos. Se agregó `app/src/utils/normalizarEntrada.ts`, se cableó en `app/src/hooks/useAutocomplete.ts` y `app/src/data/comandos.ts`, y se sumó cobertura en `app/src/components/run/Consola.test.tsx` para focus vacío, limpieza de prefijo, comandos (`MO` → `mover`) y argumentos (`usar:po` / `USAR:Pó` → `poción de curación`). Veredicto del Testeador fresco: **PASA**. Evidencia: `cd app && cmd /c npm test -- --watchAll=false --runInBand Consola.test.tsx` ✅ (**1 suite, 4 tests**); `cd app && cmd /c npm run build` ✅; `cd app && cmd /c npm test -- --watchAll=false` ✅ (**2 suites, 7 tests**). Hubo un warning no bloqueante de `ReactDOMTestUtils.act` y una primera falla de entorno `spawn EPERM` en sandbox, reejecutada con permisos elevados y sin impacto funcional.
- **2026-06-24** — **Backend: comandos y argumentos sin case sensitivity ni dependencia de tildes ✅**: se agregó `back/src/Input/normalizarEntrada.ts` para resolver input de usuario ignorando mayúsculas/minúsculas, tildes y espacios repetidos, y se cableó en el enrutado de `GameEngine`, búsquedas de `GameState`, `ObjetoFactory`, catálogos de tienda y comandos que reciben nombres de objetos, NPCs, salidas o ids comprables (`tomar`, `equipar`, `inspeccionar`, `usar`, `mover`, `atacar`, `comprar`). Los nombres/ids **canónicos** que el sistema guarda y devuelve no cambiaron; solo cambia la resolución del input. Veredicto del Testeador fresco: **PASA**. Evidencia: `cd back && cmd /c npm run build` ✅; `cd back && cmd /c npm test -- gameEngine.test.ts usar.test.ts tiendas.test.ts mover.test.ts atacar.test.ts --runInBand` ✅ (**5 suites, 87 tests**); `cd back && cmd /c npm test -- --runInBand` ✅ (**13 suites, 182 tests**). Cobertura nueva: `ToMaR:EsPaDa`, `MoVeR:EsTe`, `UsAr:PoCiOn De CuRaCiOn`, `CoMpRaR:PoCiOn De CuRaCiOn` y `AtAcAr:cAnTiNeRo pEpE`.
- **2026-06-24** — **Backend: estado mutable por sala ✅**: se implementó una base persistente por `lugarId` (`estadoMutablePorSala`) para mutaciones de escenario y se cablearon tres comportamientos sobre ella: `objetosTomados` (ya no reaparecen al salir/volver), `objetosAgregadosAlSuelo` (el loot no tomado persiste al reconstruir la sala y tras `toDTO/fromDTO`) y `ocupantesEliminados` (enemigos/NPCs derrotados no reaparecen). También se alineó `xpNiveles.test.ts` al `SCHEMA_VERSION=3`. Verificación final del Orquestador: `cd back && cmd /c npm run build` ✅, `cd back && cmd /c npm test -- loot.test.ts mover.test.ts enemigos.test.ts persistence.test.ts gameEngine.test.ts --runInBand` ✅ (**5 suites, 74 tests**), `cd back && cmd /c npm test -- --runInBand` ✅ (**13 suites, 176 tests**).
- **2026-06-24** - **Tester: subtarea `ocupantesEliminados` validada ✅**: build de `back/` verde con `cmd /c npm run build`. Suite focalizada verde con `cmd /c npm test -- --runInBand mover.test.ts enemigos.test.ts persistence.test.ts` (**3 suites, 39 tests**). Evidencia funcional: `Atacar` registra el id lógico eliminado en `estadoMutablePorSala[lugarId].ocupantesEliminados`; `mover.test.ts` cubre que el ocupante derrotado no reaparece al salir/volver y que el round-trip `toDTO/fromDTO` mantiene su ausencia; `enemigos.test.ts` cubre la resolución de ids lógicos en `CatalogoOcupantes`/`CatalogoEnemigos`. Sin fallos en esta validación. 
- **2026-06-24** — **Implementador: revalidación del fix de contexto en frontend ✅**: en `app/` el flujo de error quedó ajustado para que una respuesta sintética sin `enHub` preserve el contexto actual en `GameContext` y no refresque el hub por un comando inválido. Se agregó `app/src/context/GameContext.test.tsx` con cobertura de `run + error`, `hub + error` y `transición válida a hub`. Validación ejecutada por este Implementador: `cd app && npm test -- --watchAll=false --runInBand GameContext.test.tsx` ✅ y `cd app && npx tsc --noEmit` ✅. `cd app && npm run build` quedó sin reconfirmar porque el entorno devolvió `spawn EPERM` y la reejecución fuera del sandbox fue rechazada.
- **2026-06-24** — **Frontend: errores de comando ya no fuerzan vuelta al hub ✅**: en `app/` se corrigió el flujo de errores para que un comando inválido o un fallo de request siga mostrando su mensaje, pero **mantenga el contexto actual** (run u hub) en vez de inventar `enHub:true`. `RequestManager` ya no fuerza ese flag en errores; `GameContext` sólo conmuta/refresca hub-run cuando la respuesta válida del backend lo indica. Verificado: `app/` `npm run build` ✅; test puntual de `GameContext` **3/3** sobre error en run, error en hub y transición válida a hub.
- **2026-06-24** — **Comando `inspeccionar` backend ✅**: nuevo comando de juego para consultar información de objetos del inventario. La descripción vive en el modelo `Objeto` y en sus concretos (sin `if` centralizado por nombre); `help` lo lista; se agregaron tests de éxito, error y registro del comando en `back/tests/gameEngine.test.ts`.
- **2026-06-24** — **Mejora puntual `help` backend ✅**: `GetHelp` ahora devuelve un listado legible con descripción breve por comando, incluye comandos de juego y de sesión del `GameEngine`, y quedó accesible también desde el hub. Se agregaron tests en `back/tests/gameEngine.test.ts` para formato, cobertura de comandos y uso vía `ejecutarSesion('help', ...)`.
- **2026-06-21** — **F4 UI ajuste TUI ✅**: en `app/` la pantalla de `Run` ahora arranca con el TUI auxiliar oculto por defecto y deja la consola como superficie principal. Se agregó un botón en cabecera para **Desplegar TUI** / **Minimizar TUI**; al desplegar, reaparecen paneles de estado/ubicación/inventario y ayuda contextual. Sin cambios en `back/` ni en el contrato con `/command`. Verificado por el Orquestador: `app/` `npm run build` ✅.
- **2026-06-20** — **F4 UI nueva ✅ (build verde)**: frontend rehecho — theming medieval claro/oscuro (`ThemeContext` + `styles/temas.css`,
  default oscuro), `GameContext` (fuente de verdad, conmuta hub/run por `enHub`, refresca paneles tras cada acción), `api/tipos.ts`,
  `RequestManager.enviar()` tipado. **Hub completo** (`hub/`: histórico+detalle, crear, perfil/plata, tienda de mejoras). **Partida**
  (`run/`: paneles ubicación/inventario/estado + consola con autocomplete desde `completions` + ayuda contextual). Consola vieja
  eliminada. Verificado por el Orquestador: `CI=true npm run build` compila **sin warnings** (criterio de Vercel) — exit 0.
  Pendiente: verificación visual del usuario + merge a `main` (rama que despliega Vercel).
- **2026-06-20** — Backend ya operativo en Render + Vercel config (consola previa). CORS resuelto (era la barra final en `CORS_ORIGIN`).

- **2026-06-20** — **F4 backend-deploy ✅** (Render): `index.ts` con `PORT`/`CORS_ORIGIN` por env (fallback dev) + `/health`
  (refleja estado mongoose, no tumba si Mongo cae); `Dockerfile` multi-stage Node 20-alpine, `.dockerignore`, `render.yaml`
  (runtime Docker, healthcheck `/health`, env vars `sync:false`), `Procfile`, `.env.example` extendido, script `start:prod`.
  Verificado: build+lint, server en PORT custom, `/health` 200, CORS permite Vercel y bloquea ajeno, sin secretos versionados.
  **Pendiente F4**: UI nueva (hub web + TUI con autocompletado, `GameContext`).
- **2026-06-20** — **F4 config Vercel ✅**: `app/src/utils/RequestManager.ts` usa `process.env.REACT_APP_API_URL` (fallback localhost),
  `app/vercel.json` (CRA, SPA rewrite), `app/.env.example` (REACT_APP_API_URL). Build de `app` ✅. Despliega la **consola actual**
  (funcional vía comandos: `crear`/`mover`/`atacar`/…), NO la UI hub/TUI (que aún no existe). Deploy Vercel: Root Directory `app`,
  env `REACT_APP_API_URL`=URL de Render; luego setear `CORS_ORIGIN` del backend = URL de Vercel y redeploy del backend.

- **2026-06-20** — **F2 HECHA ✅**: persistencia (repos InMemory+Mongo, mapper, sesiones, caché write-through). build +
  23/23 tests + lint verdes; **smoke contra Atlas real PASA** (persiste tras reinicio, perfil sobrevive a borrar run).
  La credencial de Atlas la corrigió el usuario.
- **2026-06-20** — **F1 HECHA ✅**: `GameState`/`GameEngine`/`CommandResult`, des-singletonizado, equipo por ids,
  multi-sesión. Verificada por el Orquestador (build + 13/13 tests + lint + servidor + grep sin globales).
- **2026-06-20** — **F3j ✅** y **F3 COMPLETA (10/10)**: comandos `historial` + `detalle:<runId>` (lectura del histórico, inyectado
  vía `SesionContexto` sin acoplar el motor a Mongo, con barrera de pertenencia por sesión). build+lint+163 tests; smoke Atlas verde
  (2 runs→historial lista 2→detalle propio ok→detalle ajeno/inexistente ok:false→durabilidad tras reiniciar).
- **2026-06-20** — **F3i ✅** (XP/niveles): `getXp()` por enemigo, `CurvaDeNivel` (n*100), `ganarXp` con multinivel (+5 vida/+1 destreza),
  status muestra nivel/xp, `SCHEMA_VERSION=2` con tolerancia v1→v2, xp/nivel viven en la run (no en el perfil; sí en el histórico).
  build+lint+154 tests; smoke Atlas verde (subir nivel→stats↑→reiniciar→persiste v2→abandonar→perfil sin xp/nivel). Build venía roto:
  `MongoRunRepository.normalizar` sin xp/nivel (ts-jest no lo detecta, `tsc` sí) → corregido por el Orquestador. Implementador corrigió
  bug de campos crudos en jugador decorado (getters `getNivel`/`getXpActual`).
- **2026-06-20** — **F3h ✅** (generación procedural): PRNG `mulberry32` (sin `Math.random`), `RunGenerator.generar(semilla)`→`MapaDeRun`
  determinista (grafo conexo, jefe al final), caché por semilla (`MapaDeRunRegistry`), mapa NO serializado (solo semilla+lugarId+salasVisitadas),
  semilla centinela 0 = layout fijo (tests). build+lint+135 tests; smoke Atlas verde (misma semilla=mismo mapa, distintas=distintos, reiniciar→regenera
  misma posición, Atlas sin mapa). Corregidos 2 tests (método inexistente `getId()` + aliasing en smoke); producción intacta.
- **2026-06-20** — **F3g ✅** (loot encontrable): `getBotin()` por enemigo (separado de monedas), botín cae en la sala,
  `tomar` lo recoge y persiste; suelo efímero hasta 3h. `TABLA_DE_LOOT_POR_SALA` lista para sembrar. build+lint+120 tests;
  smoke Atlas verde (Ogro suelta martillo/armadura→tomar→reiniciar→persiste). Build venía roto: faltaba delegar `getBotin`
  en `PersonajeDecorador` → corregido por el Orquestador.
- **2026-06-20** — **F3f ✅** (salas + `mover` + enemigos): `MapaLayout` (grafo fijo + pools), salas (pasillo/combate/descanso/tienda/jefe),
  enemigos (Rata/Bandido/Ogro), comando `mover`, `ILugar.getSalidas()`, `LugarFactory` reconstruye por `lugarId`. build+lint+105 tests;
  smoke Atlas verde (recorrer mapa, atacar Ogro, reiniciar→sigue en sala-jefe). Test del Ogro venía mal calibrado (matar jefe con
  jugador pelado) → corregido por el Orquestador para validar atacable+recompensa sin depender del balance. Pools listos para 3h.
- **2026-06-20** — **F3e ✅** (consumibles + Strategy de efectos): `IEfecto` (3ª responsabilidad), `EfectoCurar`/`EfectoBuffDestreza`/`EfectoVeneno`,
  pociones (`poción de curación`/`poción de destreza`) en `ObjetoFactory` + tienda en-run, comando `usar` (aplica y consume). build+lint+84 tests;
  smoke engine verde (curar sin exceder máximo, buff destreza, no-consumible/inexistente→ok:false sin consumir).
- **2026-06-20** — **F3d ✅** (tiendas + meta-progresión): catálogos (mejoras hub/plata + equipo run/oro), `tienda`/`comprar`,
  `CrearPersonaje` aplica `profile.mejoras`. build+lint+73 tests; smoke Atlas verde (2 runs→plata 20→comprar vida_extra→nueva
  run vida inicial 15). Salas-tienda físicas quedan para 3f; en-run vende equipo (no consumibles, eso es 3e).
- **2026-06-20** — **F3c ✅** (monedas oro/plata): botín del enemigo (`getRecompensa`), oro en la run / plata al perfil.
  build+lint+52 tests; smoke Atlas verde (matar Cantinero→oro 15 en status→abandonar→plata 10 bankeada, oro perdido).
  Nuevo comando `perfil` (hub) muestra la plata. Comando inválido ya devuelve `{"error":"<msg>"}`.
- **2026-06-20** — **F3a ✅** (`atacar` + Strategy de armas) y **F3b ✅** (loop run crear/morir/abandonar). build+lint+45 tests;
  smoke 3a (combate) y smoke 3b contra Atlas (crear→morir→archivar→hub) verdes. Bug encontrado por el smoke y corregido por
  el Orquestador: `MongoProfileRepository.save` no limpiaba `runActivaId` en Atlas (`$set undefined` no borra → ahora `$unset`).
  De paso, el comando inválido ya devuelve `{"error":"<mensaje>"}` (antes `{}`).
- **2026-06-20** — Arranca **F1** (desacoplar Singletons/HTTP). Verificado de paso que `app/` buildea ✅.
- **2026-06-20** — **F0 HECHA ✅**: tooling (TS5/jest/eslint/prettier) + 3 bugs corregidos. Verificada
  empíricamente por el Orquestador (build/test/lint/servidor verdes). 486 paquetes instalados en `back/`.
- **2026-06-20** — Acordado `PLAN.md` (cambios grandes) y descompuesto en F0–F4 en este archivo.
- **2026-06-20** — Creado el harness: `WORKFLOW.md`, `PROGRESS.md` y 6 skills.
