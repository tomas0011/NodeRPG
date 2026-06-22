---
name: node-express
description: Construir APIs con Node.js y Express — rutas, middleware, validación de entrada, manejo de errores, códigos de estado y estructura del backend. Úsala al añadir o modificar endpoints, middleware o lógica de servidor. El backend de este repo es Express + TS y expone hoy un único endpoint GET /command en el puerto 3001.
---

# Node.js + Express

Meta: endpoints predecibles, validados y con errores manejados de forma consistente.

## Estructura en este repo

- Entrada: `back/index.ts` (crea `app`, `cors`, rutas, `listen(3001)`).
- La lógica de dominio NO vive en la ruta: la ruta delega en managers/servicios
  (ej. `ComandoManager.getInstance().ejecutarComando(...)`).
- Compila a `back/dist/`; se sirve con `node dist/index.js`.

## Principios

- **Ruta delgada**: parsear/validar entrada → llamar a un servicio → mapear resultado a HTTP.
  Sin reglas de negocio dentro del handler.
- **Validá la entrada** antes de usarla (`req.query`, `req.body`, `req.params`). No confíes en el cliente.
- **Códigos correctos**: 200 OK, 201 creado, 400 entrada inválida, 404 no existe,
  500 error inesperado. En este repo, comando inválido → 400 con `{ error }`.
- **Manejo de errores centralizado**: try/catch en handlers async + un middleware de error
  `(err, req, res, next)` al final. Nunca dejes una promesa rechazada sin atrapar.
- **Middleware** para preocupaciones transversales (logging, cors, auth). Orden importa: se ejecutan en secuencia.
- Respuestas con **forma estable**: ej. `{ command, content }` en éxito, `{ error }` en fallo.

## Convenciones del repo

- Dominio en **español**; el endpoint actual es `GET /command?command=<str>`.
- Formato de comando: `"comando: agente"` (ver `AGENTS.md`).
- Nuevos servicios singleton siguen el molde `getInstance()`.

## Checklist

- [ ] La ruta valida la entrada y delega la lógica a un servicio.
- [ ] Todos los caminos async están envueltos (try/catch o wrapper) y devuelven un código apropiado.
- [ ] La forma de la respuesta es consistente con los endpoints existentes.
- [ ] `cd back && npm run build` compila sin errores.

## Errores comunes

- Lógica de negocio en el handler → difícil de testear y reusar.
- `async` sin try/catch → promesa rechazada que tumba la request o cuelga.
- Devolver 200 con un cuerpo de error (mezcla estado HTTP con estado de dominio).
- No setear/usar `cors` cuando el front (puerto 3000) llama al back (3001).
