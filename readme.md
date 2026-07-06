# NodeRPG
Un juego RPG hecho con nodeJs y React para implementar diferentes patrones de diseño

## Prerequisitos:
* Tener instalado NodeJs - https://nodejs.org/es/

---

## Para poder usar la aplicacion deberas correr los siguientes comandos:

* primero deberas correr el backend
```js
cd back && npm i && npm start
```

* despues deberas correr el frontend
```js
cd app && npm i && npm start
```

Esto puede demorar unos minutos asi que tomatelo con calma.

---

## Desarrollo con Docker

Hay una configuracion de desarrollo separada de la de produccion:

```bash
docker compose up --build
```

Esto levanta:

* `app` en `http://localhost:3000`
* `back` en `http://localhost:3001`

Ademas monta `app/` y `back/` como volumenes, asi que cuando cambias archivos:

* el frontend se recarga solo
* el backend recompila TypeScript y reinicia `nodemon` automaticamente

El Dockerfile de produccion del backend (`back/Dockerfile`) sigue igual para Render; la recarga automatica vive solo en `docker-compose.yml` y los `Dockerfile.dev`.
