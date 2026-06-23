---
name: react-next
description: Construir UIs con React y Next.js — componentes, hooks, manejo de estado, data fetching, y routing/SSR/Server Components de Next. Úsala al crear o modificar componentes, hooks o páginas. El frontend de este repo es React (Create React App, no Next todavía); aplica los principios de React y trae los de Next sólo si se migra.
---

# React + Next.js

Meta: componentes pequeños y predecibles, estado mínimo, y data fetching en el lugar correcto.

## React — principios

- **Componentes chicos y de una responsabilidad**; nombres claros; props tipadas con TS.
- **Estado mínimo y derivado**: no guardes lo que puedas calcular en render. Sube el estado
  sólo lo necesario (lift state up); evita duplicarlo.
- **Hooks**: respeta las reglas (top-level, sólo en componentes/hooks). `useEffect` sólo para
  sincronizar con sistemas externos; declara TODAS sus dependencias. Si un efecto sólo
  transforma datos para render, probablemente no necesitas efecto.
- **Listas** con `key` estable (no el índice si la lista se reordena).
- Memoiza (`useMemo`/`useCallback`/`React.memo`) sólo ante un costo medido, no por defecto.
- Efectos secundarios fuera del render; el render debe ser puro.

## Next.js — cuándo y qué (si se migra desde CRA)

- **App Router**: Server Components por defecto (data fetching en el server, menos JS al cliente);
  marca `"use client"` sólo en componentes con estado/efectos/eventos.
- Elige render por necesidad: estático (SSG) para contenido estable, SSR para datos por request,
  cliente para interacción pura.
- Fetch en Server Components o route handlers; no expongas secretos al cliente.
- Routing por carpetas (`app/.../page.tsx`); usa `loading.tsx`/`error.tsx` para estados.

## Este repo (React/CRA)

- Frontend en `app/`; consola que llama al backend vía `RequestManager` (singleton, axios → `:3001`).
- Componentes en `app/src/components/`. Mantén el patrón de pasar callbacks de respuesta.
- TS 4.7: sintaxis moderna OK.

## Checklist

- [ ] Props y estado tipados; sin `any`.
- [ ] `useEffect` con deps completas y sólo para sincronización externa.
- [ ] Estado en el nivel correcto, sin duplicar.
- [ ] `key` estable en listas.
- [ ] (Next) `"use client"` sólo donde hace falta.

## Errores comunes

- `useEffect` con deps incompletas → bugs de stale state o loops.
- Estado derivado guardado en lugar de calculado → desincronización.
- Poner todo en el cliente en Next y perder los beneficios de Server Components.
- `key={index}` en listas dinámicas → re-render y estado cruzado.
