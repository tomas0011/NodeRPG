# NodeRPG — Definición conjunta para los cambios grandes

> Documento de **visión y arquitectura objetivo** (acordado 2026-06-20). No es un primer
> paso pequeño: es el acuerdo base sobre cómo evolucionar el proyecto antes de empezar a
> implementar. Cada fase es ejecutable de forma incremental.
>
> El **avance** se trackea en `PROGRESS.md`; el **proceso** de implementación (orquestador →
> implementador → testeador) está en `WORKFLOW.md`; la **arquitectura actual** en `CLAUDE.md`.

## Contexto (por qué hacemos esto)

NodeRPG es un RPG de consola educativo (su propósito es practicar patrones de
diseño) con frontend React (`app/`) y backend Express en TypeScript (`back/`).
Funciona en local pero hoy tiene cuatro límites que impiden crecer:

1. **No hay jugabilidad real más allá de mirar/tomar/equipar.** Existen métodos
   de combate (`recibirDaño`, `dadoDeGolpe`, `claseDeArmadura`) pero ningún
   comando los usa; hay una sola sala (`Bar`) y un solo NPC.
2. **Calidad de código:** todo el estado vive en **Singletons globales**
   (`ComandoManager` → `Escenario` → `Bar`, y `PersonajeJugable.getInstance/setInstance`),
   acoplados al HTTP, sin tests, con TypeScript 3.3.3 y respuestas en strings
   sueltos. Hay bugs latentes (ítems se duplican al tomarlos, retornos `undefined`).
3. **Sin persistencia:** al reiniciar el servidor se pierde todo. Además el
   estado es **global y compartido** por todos los clientes (no hay sesiones).
4. **No es desplegable:** la URL del backend está hardcodeada en
   `app/src/utils/RequestManager.ts` (`http://localhost:3001`), el puerto está
   fijo y no hay configuración de deploy.

**Resultado buscado:** un **roguelike** con meta-progresión —creas un personaje,
juegas una partida (run) hasta morir o abandonar, pierdes los objetos pero la
plata persiste para comprar mejoras—, con código testeable y desacoplado, estado
persistente en **MongoDB Atlas**, y despliegue rápido con **frontend en Vercel +
backend Express en host persistente**.

## Decisiones acordadas

| Tema | Decisión |
|------|----------|
| Frontend | React (CRA) como **sitio estático en Vercel** |
| Backend | **Express persistente** (no serverless) en Render/Railway/Fly |
| Persistencia | **MongoDB Atlas** |
| Identidad | `sessionId` (UUID) por jugador, **sin auth** (limitación conocida y aceptada) |
| Patrones | Se **conservan** Command y Decorator; se **añade Strategy** para acciones/efectos de objetos (arco ≠ espada ≠ martillo) |
| Formato | **Roguelike** con meta-progresión: runs efímeras + perfil persistente |
| Monedas | **Oro** (efímero, dentro de la run) + **Plata** (persistente, perfil) |
| Tiendas | En el **hub** entre runs (mejoras permanentes con plata) **y** dentro de la run (consumibles/equipo temporal con oro) |
| UI hub | **Web de gestión** (paneles/botones/listas): perfil, plata, tienda de mejoras, histórico de personajes, botón "empezar run" |
| UI run | **TUI** (consola en navegador) con **autocompletado contextual** (comando + argumentos según el estado) |
| Mapa | Salas **randomizadas** por run (generación procedural con semilla), más salas/enemigos/NPCs y objetos encontrables |
| Histórico | Las runs terminadas se **archivan** (no se borran): lista de personajes pasados + detalle de cada run |

Como el backend es persistente (no serverless), los objetos en memoria pueden
sobrevivir entre peticiones: usaremos una **caché en memoria + escritura
write-through a Atlas**, siendo Mongo la fuente de verdad durable que sobrevive
a reinicios del host.

## Modelo roguelike (perfil vs run)

Hay **tres ámbitos de estado con ciclos de vida distintos**, y esto es lo que
estructura la persistencia:

- **Perfil (durable, nunca se borra):** identidad de la cuenta, **plata**
  acumulada y **mejoras/desbloqueos permanentes** comprados en el hub. Una run
  termina, el perfil queda. Es lo que da continuidad entre partidas.
- **Run activa (efímera mientras se juega):** el personaje creado, su vida,
  inventario de objetos (incluidos los **encontrables**), **oro** de la partida,
  la **semilla** del mapa y la sala actual.
- **Histórico de runs (durable, solo lectura):** al terminar, la run **no se
  borra** — se **archiva** como registro inmutable (resumen + detalle) para el
  "histórico de personajes". Se elimina solo de las runs activas.

**Ciclo del juego (loop roguelike):**
1. El jugador está en el **hub** (sin run activa). Ahí ve su plata, su
   **histórico de personajes** (con detalle de cada run) y la **tienda de
   mejoras** permanentes (plata).
2. **`crear`** un personaje → se genera una **run** nueva con **mapa
   randomizado** (salas/enemigos/loot a partir de una semilla).
3. Juega: explora salas, combate enemigos/NPCs, **encuentra objetos**, gana
   **oro**, gasta oro en **tiendas dentro de la run**, acumula **plata** (botín a
   bancar).
4. **Muere** o **`abandonar`** → se **banca la plata** al perfil, la run se
   **archiva al histórico** y se quita de las activas (se pierden objetos y oro),
   vuelve al hub.

**Dos monedas:**
- **Oro** — vive y muere con la run; moneda de las tiendas de sala.
- **Plata** — se transfiere de la run al perfil al terminar; moneda del hub.

Esto encaja directo con el `GameState` del plan: **`GameState` = la run**; se
añaden un **`PlayerProfile`** (durable) y un **histórico de runs** como agregados
persistentes. La sesión (`sessionId`) siempre tiene un perfil; puede o no tener
una run activa, y siempre tiene su historial.

---

## Hoja de ruta por fases

### Fase 0 — Base de tooling (sin cambio de comportamiento)
Primero, para que el resto caiga sobre terreno testeable y tipado.
- `back/package.json`: subir `typescript` 3.3.3 → 5.x; añadir `jest`, `ts-jest`,
  `@types/*`, `eslint`, `prettier`; scripts `test`/`lint`/`format`; fijar
  `"engines": { "node": "20.x" }`.
- `back/tsconfig.json`: activar `strict` (escalonado si hace falta), `target` es2020.
- Nuevos: `back/jest.config.js`, `back/.eslintrc.cjs`, `back/.prettierrc`.
- **Esperado:** `strict` destapa bugs reales (`getComando` y `EquiparObjeto`
  pueden retornar `undefined`, duplicación en `TomarObjeto`). Se corrigen aquí —
  es alcance incluido, no sorpresa.
- **Verificar:** build limpio en TS5, lint corre, test vacío en verde, el
  `GET /command` actual sigue funcionando igual.

### Fase 1 — Desacoplar lógica de los Singletons y del HTTP (calidad)
El cambio central: el estado deja de ser global y pasa a inyectarse.
- **Nuevo `back/src/Game/GameState.ts`** (instancia, NO singleton): posee
  `jugador`, `escenario` y metadatos de sesión. Es la unidad que luego se persiste.
- **Nuevo `back/src/Game/GameEngine.ts`**: reemplaza a `ComandoManager` como
  orquestador. Método `ejecutar(input, state): CommandResult`. Hace el parseo
  `comando:agente` (hoy en `ComandosManager.ejecutarComando`) y delega en el
  comando pasándole el `state`. El motor es sin estado de juego: **el estado
  entra como parámetro** en lugar de tomarse de `getInstance()`.
- **Des-singletonizar:**
  - `back/src/Escenario/Escenario.ts`: quitar `getInstance`; `lugar` pasa a
    parámetro de constructor.
  - `back/src/Escenario/Lugar/lugares/Bar.ts`: quitar `getInstance`/estático.
  - `back/src/Personaje/personajes/Jugador.ts`: **eliminar `getInstance`/`setInstance`**;
    `PersonajeJugable` pasa a subclase normal; el nombre (`'Tomas'`) a constructor.
- **Nuevo contrato `back/src/Comando/IComando.ts`**:
  `ejecutar(agente, state): CommandResult`. Cada comando en
  `back/src/Comando/comandos/` lee de `state` en vez de globales (`GetStatus`,
  `GetEscenario`, `TomarObjeto` —corrigiendo la duplicación con `quitarObjeto`—,
  `EquiparObjeto`).
- **Equipo bajo modelo por sesión (el punto delicado).** Hoy equipar es
  `PersonajeJugable.setInstance(modificacion)` → `new Decorator(player)` sobre un
  global. Se mueve a `GameState`, pero **modelando el equipo como un conjunto de
  ids de ítems equipados** + un método `rebuildDecoratedPlayer()` que construye
  el `Personaje` base y aplica los decoradores en orden determinista. Así
  equipar es idempotente, desequipar es trivial, y la cadena de decoradores
  queda como **función pura de (stats base + ids equipados)** — justo lo que la
  Fase 2 necesita para serializar. El patrón Decorator queda **más** claro.
- **Nuevo `back/src/Game/CommandResult.ts`**: respuesta tipada
  `{ ok, message, data?, completions? }`. `index.ts` mantiene `content` (string
  humano) para no romper el frontend y añade campos estructurados al lado. El
  campo `completions` lleva las **opciones válidas contextuales** para la TUI
  (p. ej. `{ equipar: [...inventario], tomar: [...sala], comprar: [...catálogo],
  mover: [...salidas] }`), de modo que el autocompletado del front no adivina:
  refleja el estado real devuelto por el backend.
- **Verificar:** tests Jest del `GameEngine` sin HTTP ni globales (secuencia
  tomar→equipar→status cambia `claseDeArmadura`/`dadoDeGolpe`); dos `GameState`
  independientes no se interfieren (prueba de multi-sesión). `index.ts` puede
  correr con un `GameState` único temporal para que la app siga andando.

### Fase 2 — Sesiones + persistencia en MongoDB Atlas (perfil + run)
Depende de la Fase 1 (necesita `GameState` serializable y el modelo de ids equipados).
- **Sesión:** `sessionId` (UUID) que el cliente manda por header/query.
  `RequestManager.ts` lo guarda en `localStorage`. El servidor resuelve siempre
  un **perfil**; la run es opcional.
- **Tres agregados persistentes, tres colecciones:**
  - `profiles` (**durable**): `{ sessionId, schemaVersion, plata, mejoras: [...],
    runActivaId? }`. Nunca se borra.
  - `runs` (**activa**): el DTO del `GameState`/run. Se **quita** de aquí al
    morir/abandonar (pasa al histórico).
  - `runHistory` (**durable, solo lectura**): snapshot inmutable de cada run
    terminada (resumen para la lista + detalle completo) para el "histórico de
    personajes".
- **Patrón Repository (interfaz + dos implementaciones cada uno):**
  - **Nuevo `back/src/Persistence/ProfileRepository.ts`** (`load/save/create` por
    `sessionId`).
  - **Nuevo `back/src/Persistence/RunRepository.ts`** (`load/save/create/delete`
    por `runId`).
  - **Nuevo `back/src/Persistence/RunHistoryRepository.ts`**
    (`archive(run)`, `list(sessionId)`, `getDetalle(runId)`).
  - Implementaciones `InMemory*` (tests/dev) y `Mongo*` (Atlas). El motor/HTTP
    dependen de las **interfaces** → los tests nunca tocan la red.
- **Driver: mongoose** (esquemas explícitos, claridad educativa).
- **Serialización que sobrevive al patrón Decorator:** NO se serializa el grafo
  de objetos vivos. DTO plano de la run:
  ```
  { runId, sessionId, schemaVersion, semilla,
    jugador: { nombre, vidaMaxima, vidaActual, destreza, oro,
               inventario: ["espada", ...], equipados: ["espada"] },
    escenario: { lugarId: "sala-3", salasVisitadas: [...] } }
  ```
  El mapa **no se serializa entero**: con `semilla` + `lugarId` el `RunGenerator`
  (Fase 3) reconstruye salas/enemigos/loot de forma determinista. El histórico
  guarda además un resumen final (nombre, nivel, salas, oro/plata, causa de
  muerte, duración).
  - Nuevo `back/src/Persistence/GameStateMapper.ts` (`toDTO`/`fromDTO`).
  - Nuevo `back/src/Objeto/ObjetoFactory.ts` (id → `new Espada()`…). Las
    **estrategias son comportamiento, no estado**: se reconstruyen con el objeto
    desde su id, así que no añaden nada al DTO.
  - Nuevo `back/src/Escenario/LugarFactory.ts` (`lugarId` → `new Bar()`…).
  - Al cargar: `rebuildDecoratedPlayer()` reconstruye base + decoradores desde
    `equipados[]` (serialización sin pérdida).
- **Ciclo en `index.ts`:** `resolver sessionId → cargar perfil (+ run si hay) →
  engine.ejecutar → guardar perfil/run → responder`, con caché en memoria
  write-through. El cierre de la run (Fase 3) **archiva** vía
  `RunHistoryRepository.archive` y luego `RunRepository.delete`.
- **`schemaVersion` desde el día 1** en ambos documentos + deserialización
  tolerante (futuras fases añaden campos).
- **Verificar:** round-trip `toDTO/fromDTO` de la run con repo in-memory (mismo
  `claseDeArmadura`/inventario tras reconstruir); smoke test contra Atlas:
  tomar/equipar, reiniciar proceso, recargar sesión, confirmar que persistió;
  el perfil sobrevive aunque se borre la run.

### Fase 3 — Jugabilidad roguelike (reutilizando clases existentes)
Cada sub-fase es enviable por separado. El orden construye el loop roguelike.
- **3a `atacar` + Strategy de armas** (solo necesita Fase 1) —
  `back/src/Comando/comandos/Atacar.ts` resuelve daño contra un NPC
  (`Cantinero` ya existe) **delegando en la estrategia del arma equipada**, no en
  un cálculo fijo:
  - **Nuevo `back/src/Objeto/estrategias/IEstrategiaDeAtaque.ts`** + implementaciones
    `EspadaStrategy`, `ArcoStrategy`, `MartilloStrategy` (p. ej. espada =
    melee equilibrado; arco = a distancia, escala con `destreza`, puede no requerir
    estar en la misma sala; martillo = daño alto y lento / rompe armadura). Cada
    arma (`Objeto`) expone su estrategia; `Atacar` llama
    `arma.getEstrategiaDeAtaque().resolver(atacante, objetivo)`, que usa
    `dadoDeGolpe()`/`claseDeArmadura()`/`recibirDaño()` internamente.
  - Sin arma equipada → estrategia "puños" por defecto. Reutiliza los métodos de
    combate existentes; el Strategy solo decide **cómo** se combinan.
- **3b ciclo de la run: crear / morir / abandonar** (necesita Fase 2) — el
  corazón del roguelike:
  - `back/src/Comando/comandos/CrearPersonaje.ts` (`crear`): crea una run nueva
    vía `RunRepository.create`, enlaza `runActivaId` en el perfil. Solo válido en
    el hub (sin run activa).
  - **Muerte:** cuando `getVidaActual() <= 0` (detectado tras `atacar`/recibir
    daño), el motor marca la run como terminada → **banca la plata** al perfil
    (`ProfileRepository`) → **archiva la run** (`RunHistoryRepository.archive`) →
    la quita de activas (`RunRepository.delete`) → devuelve al hub. Se pierden
    objetos, equipo y oro; queda el registro en el histórico.
  - `back/src/Comando/comandos/Abandonar.ts` (`abandonar`): mismo cierre que la
    muerte, voluntario.
- **3c monedas (oro + plata)** (tras 3b) — `oro` en el `Personaje`/run (DTO ya lo
  contempla), `plata` en el perfil. Los enemigos/botín otorgan oro durante la run
  y plata "a bancar"; al cerrar la run la plata se suma al perfil.
- **3d tiendas (hub + en-run)** (tras 3c) — `back/src/Comando/comandos/Comprar.ts`
  (`comprar`) y una abstracción `Tienda`/catálogo:
  - **Tienda de hub:** disponible sin run activa; gasta **plata** en mejoras
    permanentes (`profile.mejoras`) que afectan a futuras runs (p. ej. más vida
    base, empezar con un objeto).
  - **Tienda en-run:** salas de tipo tienda (vía `LugarFactory`); gasta **oro**
    en consumibles/equipo temporal de la run.
- **3e consumibles + Strategy de efectos** (tras 3a) — comando `usar`; el efecto
  de cada objeto es una **estrategia intercambiable**: **nuevo
  `back/src/Objeto/estrategias/IEfecto.ts`** + implementaciones (`EfectoCurar`,
  `EfectoVeneno`, `EfectoBuffDestreza`, …). El objeto expone `getEfecto()` que
  devuelve su `IEfecto`; `usar` hace `objeto.getEfecto().aplicar(jugador)` y quita
  el ítem con `quitarObjeto`. No se sobrecarga `getModificacion` (Decorator de
  equipo) — quedan tres responsabilidades limpias: Decorator (stats al equipar),
  Strategy de ataque (armas), Strategy de efecto (consumibles/objetos usables).
  Surten las tiendas en-run.
- **3f más salas, enemigos y NPCs** (necesita `LugarFactory`) — `salidas` en
  `ILugar`; varias `Lugar` nuevas junto a `Bar.ts` (combate, tienda, descanso,
  jefe); más enemigos como subclases de `Personaje` (junto a `Cantinero.ts`) con
  stats/loot propios; comando `mover:<salida>`. **Catálogos/pools** de salas,
  enemigos y objetos para que la generación elija de ahí.
- **3g objetos encontrables (loot)** (tras 3f) — tablas de botín por sala/enemigo:
  al limpiar una sala o matar un enemigo se generan objetos en la sala/inventario.
  Reutiliza `Objeto`/`ObjetoFactory`; añade objetos nuevos (armas, armaduras,
  pociones) al catálogo. Distinguir **encontrables** (en la run) de **comprables**
  (mejoras de perfil en el hub).
- **3h generación procedural de la run** (necesita 3f/3g + `semilla` del DTO) —
  **nuevo `back/src/Game/RunGenerator.ts`**: a partir de la `semilla` arma el mapa
  de la run (salas randomizadas con sus enemigos y loot) de forma **determinista**
  (un PRNG sembrado), para que el mismo `semilla`+`lugarId` reconstruya el mundo
  sin serializar el mapa entero. `CrearPersonaje` genera la semilla; `LugarFactory`
  pasa a apoyarse en el generador.
- **3i XP / niveles** (tras 3a) — `xp`/`nivel` en `Personaje` (solo dentro de la
  run); suben `vidaMaxima`/`destreza`; bump de `schemaVersion`.
- **3j histórico (lectura)** (tras 3b + Fase 2) — comandos/endpoint para
  `RunHistoryRepository.list` (lista de personajes pasados) y `getDetalle(runId)`
  (detalle de una run), que consume la UI del hub.
- **Aplicar mejoras del perfil al crear la run:** `CrearPersonaje` lee
  `profile.mejoras` y configura los stats iniciales del personaje (la
  meta-progresión se hace efectiva aquí).
- **Verificar:** tests Jest deterministas del loop completo sin HTTP —
  crear→combatir→ganar oro/plata→morir: asserts de que el oro y los objetos se
  pierden, la plata se sumó al perfil y la run fue **archivada al histórico**;
  comprar en hub baja plata y persiste la mejora en la siguiente run; misma
  `semilla` genera el mismo mapa (determinismo del `RunGenerator`); **cada Strategy
  de arma produce su patrón de daño esperado** (espada vs arco vs martillo) y cada
  `IEfecto` su efecto. Si se añade azar a `dadoDeGolpe`, dejar una semilla inyectable.

### Fase 4 — Despliegue (Vercel + backend persistente)
Independiente de la Fase 3; depende de Fase 2 por `MONGODB_URI`.
- **Frontend (Vercel) — config:** `app/src/utils/RequestManager.ts` usa
  `process.env.REACT_APP_API_URL` (fallback localhost) y envía el `sessionId`;
  nuevo `app/.env.example`; nuevo `app/vercel.json` (build `react-scripts build`,
  output `build/`, rewrite SPA a `/index.html`); variable `REACT_APP_API_URL` en
  Vercel apuntando al backend.
- **Frontend — dos modos de UI** (router por "¿hay run activa?"):
  - **Hub (web de gestión, sin run activa):** componentes React declarativos
    (paneles/botones/listas), NO consola. Vistas: perfil + plata, **tienda de
    mejoras** (comprar con plata), **histórico de personajes** (lista desde
    `RunHistoryRepository.list` + **detalle** de cada run desde `getDetalle`),
    botón **"empezar run"** (`crear`). Nuevas carpetas en `app/src/components/hub/`.
  - **Run (TUI con autocompletado contextual):** se reutiliza/evoluciona
    `app/src/components/consoleInput` + `consoleOutput`. El autocompletado lee el
    campo `completions` que viene en cada `CommandResult` (comando + argumentos
    válidos del estado actual): dropdown de sugerencias, Tab para completar,
    ↑/↓ historial. Nuevo `app/src/components/run/` (o ampliar consoleInput) y un
    `app/src/hooks/useAutocomplete.ts`.
  - **Estado global del front:** un `app/src/context/GameContext.tsx` (Context)
    que guarda `sessionId`, perfil, run activa y conmuta hub ↔ run según las
    respuestas del backend (en lugar del prop-drilling actual de `view.tsx`).
- **Backend (Render/Railway/Fly):** en `back/index.ts` usar
  `process.env.PORT ?? 3001`, `cors({ origin: process.env.CORS_ORIGIN })`, tipar
  el middleware, endpoint `/health`, bootstrap de conexión Mongo antes de
  `app.listen` (`back/src/Persistence/mongo.ts`); nuevo `back/Dockerfile`/`Procfile`
  (node 20, `tsc`, `node dist/index.js`); nuevo `back/.env.example`
  (`PORT`, `MONGODB_URI`, `CORS_ORIGIN`).
- **Verificar:** `/health` y `/command` por curl; CORS rechaza otros orígenes;
  una sesión sobrevive a un redeploy del backend (durabilidad Atlas).

---

## Secuenciación / dependencias
- **Fase 0** → prerequisito de testing.
- **Fase 1** → prerequisito de 2, 3 y tests limpios. Es la fase más grande y
  delicada.
- **Fase 2** → depende de 1; sostiene todo el loop roguelike (perfil + run) y
  aporta el `MONGODB_URI` de la 4.
- **Fase 3** → 3a/3e/3i solo necesitan Fase 1; el loop (3b→3c→3d), 3f/3g/3h
  (salas/enemigos/loot/generación) y 3j (histórico) necesitan Fase 2. Envío
  incremental.
- **Fase 4** → depende de Fase 2 por Mongo; la UI de hub necesita 3d/3j y la TUI
  contextual necesita el `completions` de Fase 1. Se puede preparar en paralelo con 3.

## Trade-offs registrados
1. **Equipo por ids vs `setInstance` encadenado:** ligera desviación del código
   actual, pero hace tratables el desequipar y la serialización, y muestra mejor
   el patrón Decorator. **Recomendado.**
2. **mongoose vs driver nativo:** mongoose por esquemas explícitos/claridad.
3. **Sesión por UUID sin auth:** simplicidad honesta; limitación documentada.
4. **Caché en memoria + write-through:** aprovecha el backend persistente.
5. **`strict` destapa bugs reales:** alcance incluido, no sorpresa.
6. **Doble moneda + doble tienda + perfil/run/histórico:** más profundidad de
   roguelike a cambio de más superficie (tres colecciones, ciclos de vida
   distintos, bankeo, archivado y aplicar mejoras). Se mitiga separando los
   agregados y los repositorios desde el día 1, en vez de añadirlos a posteriori.
7. **Mapa procedural por semilla (no serializado):** se guarda la `semilla`, no el
   mapa; el `RunGenerator` debe ser **determinista** (PRNG sembrado) o el estado
   recargado divergiría. A cambio, runs infinitas y persistencia barata.
8. **Autocompletado contextual:** el backend expone `completions` en cada
   respuesta (más payload) para que la TUI no adivine; mantiene front y reglas del
   juego sincronizados en el servidor.
9. **Tres patrones con responsabilidades separadas:** Decorator = stats al
   equipar; Strategy de ataque = cómo golpea cada arma; Strategy de efecto = qué
   hace un consumible/objeto al usarse. Claridad educativa y extensión sin tocar
   `Atacar`/`usar` (añadir un arma/efecto = una clase nueva, principio abierto-cerrado).

## Archivos críticos
- `back/src/Comando/ComandosManager.ts` → se convierte en `back/src/Game/GameEngine.ts`.
- `back/src/Personaje/personajes/Jugador.ts` → quitar `getInstance`/`setInstance`.
- `back/src/Comando/comandos/EquiparObjeto.ts` → ruta de decorador a modelo por sesión.
- `back/index.ts` → ciclo de sesión, repositorio, CORS/PORT/env, bootstrap Mongo.
- `app/src/utils/RequestManager.ts` → URL por env var + `sessionId`.
- **Nuevos (backend):** `back/src/Game/{GameState,PlayerProfile,CommandResult,RunGenerator}.ts`,
  `back/src/Persistence/{ProfileRepository,RunRepository,RunHistoryRepository,GameStateMapper,mongo}.ts`,
  `back/src/Objeto/ObjetoFactory.ts` (+ objetos nuevos y tablas de loot),
  `back/src/Objeto/estrategias/{IEstrategiaDeAtaque,EspadaStrategy,ArcoStrategy,MartilloStrategy,IEfecto,EfectoCurar,…}.ts`,
  `back/src/Escenario/LugarFactory.ts` (+ salas nuevas), enemigos junto a
  `back/src/Personaje/personajes/`, comandos
  `back/src/Comando/comandos/{CrearPersonaje,Abandonar,Comprar,Atacar,UsarObjeto,Mover}.ts`.
- **Nuevos (frontend):** `app/src/context/GameContext.tsx`,
  `app/src/components/hub/` (perfil, tienda de mejoras, histórico+detalle, empezar run),
  `app/src/components/run/` (TUI) + `app/src/hooks/useAutocomplete.ts`.

## Verificación global (end-to-end al terminar)
1. `cd back && npm test && npm run lint && npm run build` en verde.
2. **Loop roguelike contra Atlas dev:** `crear` → mapa randomizado → recorrer
   salas, combatir enemigos, **encontrar objetos**, ganar oro/plata → `comprar`
   en tienda en-run con oro → **morir** → confirmar que objetos y oro se
   perdieron, la run se **archivó al histórico** y la **plata quedó en el
   perfil**; en el hub ver el **histórico con detalle**, `comprar` una mejora con
   plata, `crear` otra run y verificar que la mejora aplica a los stats iniciales.
3. **UI:** el hub se ve como web de gestión y la run como TUI; el autocompletado
   sugiere comandos y argumentos válidos (ítems del inventario, salidas, catálogo).
4. Reiniciar el proceso del backend y confirmar que **perfil e histórico**
   sobreviven aunque no haya run activa.
5. Dos `sessionId` distintos mantienen perfiles, runs e históricos independientes.
6. Frontend en Vercel apuntando al backend por `REACT_APP_API_URL`; CORS limitado
   al origen de Vercel; perfil e histórico sobreviven a un redeploy del backend.
