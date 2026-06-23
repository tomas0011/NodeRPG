---
name: typescript
description: Escribir TypeScript idiomático y con tipado seguro — interfaces vs types, genéricos, narrowing, configuración de tsconfig y resolución de errores del compilador. Úsala al crear o tocar cualquier .ts/.tsx, al diseñar contratos de tipos o al depurar fallos de compilación. Ojo: el backend usa TS 3.3 (target es6) y la app usa TS 4.7.
---

# TypeScript

Meta: que el tipo describa la intención y el compilador atrape errores antes de runtime. Evita `any` salvo frontera real con datos sin tipar (y entonces validá/estrechá de inmediato).

## Versiones en este repo (importante)

- `back/` → TypeScript **3.3**, `target: es6`, **no strict**. Evita sintaxis posterior
  (optional chaining `?.`, nullish `??`, template literal types). Compila con `cd back && npm run build`.
- `app/` → TypeScript **4.7** (CRA). Sintaxis moderna OK.

## Principios

- `interface` para formas de objetos/contratos públicos (extensible, mejores mensajes);
  `type` para uniones, intersecciones, tuplas y alias.
- Prefiere **uniones discriminadas** + narrowing a jerarquías o flags booleanos sueltos.
- Hacé **ilegales los estados ilegales**: modela con tipos, no con comentarios.
- `unknown` en vez de `any` en fronteras; estrechá con type guards antes de usar.
- `readonly` y `as const` para inmutabilidad cuando aplique.
- Genéricos para reusar lógica preservando el tipo; nombrá los parámetros (`TItem`, no sólo `T`) cuando ayude.

## Patrones útiles

- Type guard: `function esX(v: unknown): v is X { ... }`.
- Utilitarios: `Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`.
- `satisfies` (TS 4.9+) NO disponible aquí; usá anotación explícita.

## Checklist

- [ ] Sin `any` implícitos en código nuevo (aunque el back no sea strict, tipá igual).
- [ ] Sintaxis compatible con la versión de TS del proyecto que tocás.
- [ ] Funciones públicas con tipos de retorno explícitos.
- [ ] `npm run build` pasa limpio en `back/`.

## Errores comunes

- Usar `?.`/`??` en `back/` (TS 3.3) → no compila.
- `any` que se propaga y apaga todo el chequeo de tipos.
- Castear con `as` para silenciar al compilador en vez de modelar bien el tipo.
