# AGENTS.md

This file provides guidance to Codex  (Codex.ai/code) when working with code in this repository.

## Mandatory Workflow

Before performing any task, read and follow the workflow defined in `WORKFLOW.md`.

`WORKFLOW.md` is the authoritative source for agent behavior, delegation rules, orchestration, implementation, testing, iteration limits, and `PROGRESS.md` maintenance.

If there is any conflict between implementation decisions and the workflow process, the workflow process takes precedence.

Key requirements defined in `WORKFLOW.md` include:

* The Orchestrator must not implement features directly.
* Feature work must be delegated to an Implementer.
* Every implementation must be validated by a fresh Tester agent with clean context.
* Implementer ↔ Tester iterations are limited to 3 cycles.
* No task is considered complete without a PASS verdict from a Tester.
* `PROGRESS.md` must be updated as part of the workflow.

Always read `WORKFLOW.md` before starting work.

## Project

NodeRPG is a learning project: a text/console RPG built to demonstrate classic GoF design patterns. The domain language is **Spanish** — class names, methods, and variables are in Spanish (`Personaje`, `Escenario`, `ejecutarComando`, `recibirDaño`). Match this convention when adding code; do not introduce English identifiers.

## Layout

Two **independent** npm projects, each with its own `package.json`, `tsconfig.json`, and `node_modules`. There is no root package.json — run commands inside each directory.

- `back/` — Express + TypeScript API (the game engine). Game state lives here.
- `app/` — React (Create React App) frontend; a console UI that sends commands to the backend.

## Commands

Backend (`cd back`):
- `npm start` — builds, then runs `tsc -w` and `nodemon` concurrently (dev loop). Serves on port **3001**.
- `npm run build` — `tsc` → emits to `back/dist/`. `npm run serve` runs `node dist/index.js`.

Frontend (`cd app`):
- `npm start` — CRA dev server (port 3000).
- `npm run build` — production build.
- `npm test` — react-scripts (Jest) watch runner. `npm test -- <pattern>` or `npm test -- --watchAll=false` for a single/non-watch run. **No tests exist yet.**

To run the full app, start the backend first, then the frontend (see `readme.md`).

## Architecture

The backend exposes a **single endpoint**: `GET /command?command=<string>` (`back/index.ts`). The query string is passed to `ComandoManager.getInstance().ejecutarComando(...)`, which returns the text shown in the console. The frontend's `RequestManager` (also a singleton) hits this endpoint and feeds the response to a callback.

**Command string format:** `"comando: agente"`. `ejecutarComando` splits on `:` into `[comando, agente]`; `comando` selects the handler, `agente` is its argument (e.g. an object name to equip).

Design patterns in play — recognize them before editing:

- **Singleton** — pervasive. `ComandoManager`, `Escenario`, `PersonajeJugable`, `RequestManager` all use a private static instance + `getInstance()`. Game state is global/in-memory; there is no database and no per-session isolation.
- **Command** — `back/src/Comando/`. Each command is a class implementing `IComando` (`getKey`, `esComando`, `ejecutar`). `ComandoManager` finds the matching handler by `esComando`.
- **Decorator** — `back/src/Personaje/`. Equipping wraps the player in a decorator that overrides stats. `PersonajeDecorador` delegates every method to the wrapped `portadorDeArmadura`; concrete decorators (`ConEspada`, `ConArmaduraDePlacas`, …) override only what changes. The wrapping happens via `PersonajeJugable.setInstance(modificacion)`, where `modificacion` is the decorator **class** returned by `Objeto.getModificacion()` — it replaces the singleton instance with `new Decorator(previousInstance)`.
- **Composite** — `back/src/Contenedor/` (`Contenedor` → `Inventario`, `Mochila`) holds `Objeto`s.

### Adding a new command

1. Create a class in `back/src/Comando/comandos/` implementing `IComando`.
2. Re-export it from `back/src/Comando/index.ts`.
3. Add an instance to the `comandos` array in `back/src/Comando/ComandosManager.ts`.

### Adding an equippable object

Create an `Objeto` subclass in `back/src/Objeto/objetos/` whose `getModificacion()` returns a `PersonajeDecorador` subclass (the modifier applied when equipped). Objects that can't be equipped return a falsy `getModificacion()`.

## Gotchas

- Backend TypeScript targets `es6` with TS **3.3** and is not in strict mode; the React app uses TS 4.7. Keep syntax compatible with each.
- `back/index.ts` types the middleware `req`/`res` as DOM `Request`/`Response` (lib types), not Express's — pre-existing, not a mistake to "fix" casually.
- Errors are largely surfaced as plain strings returned to the console or thrown `Error`s caught in the route handler (→ HTTP 400).
