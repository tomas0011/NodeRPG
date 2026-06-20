# Imagen del backend NodeRPG para Render (host persistente, no serverless).
# Multi-stage: un builder compila TS -> dist/, y un runtime liviano sólo con
# dependencias de producción + el JS compilado.
#
# El contexto de build es `back/` (ver render.yaml: dockerContext: back).
# NO se copia `back/.env`: las variables las inyecta Render en runtime.

# --- Etapa 1: builder ---------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Instala TODAS las deps (incluidas dev: typescript, @types) para poder compilar.
COPY package.json package-lock.json ./
RUN npm ci

# Copia el código y compila a dist/.
COPY tsconfig.json ./
COPY index.ts ./
COPY src ./src
RUN npm run build

# --- Etapa 2: runtime ---------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Sólo dependencias de producción (sin typescript/eslint/etc).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# El JS ya compilado desde el builder.
COPY --from=builder /app/dist ./dist

# Render inyecta PORT; lo exponemos de forma informativa (default 3001).
EXPOSE 3001

# Arranque de producción simple: sin build, sin watch, sin concurrently.
CMD ["node", "dist/index.js"]
