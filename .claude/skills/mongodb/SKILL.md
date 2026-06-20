---
name: mongodb
description: Modelar datos y consultar MongoDB (típicamente vía Mongoose) — diseño de esquemas, queries, índices, agregaciones y patrones embed-vs-reference. Úsala al añadir persistencia, definir modelos o escribir/optimizar consultas. Nota: este repo aún NO usa Mongo (estado en memoria); al introducirlo, aísla el acceso a datos detrás de servicios/repositorios.
---

# MongoDB (+ Mongoose)

Meta: esquemas que reflejan los accesos reales de la app y queries que usan índices.

## Modelado

- **Diseña por las consultas, no por la "forma ideal" de los datos.** Empieza por
  ¿qué lee/escribe la app y con qué frecuencia?
- **Embeber** cuando los datos se leen juntos, pertenecen al padre y son acotados
  (1-a-pocos). **Referenciar** cuando crecen sin límite, se comparten o se consultan aparte (1-a-muchos/N-a-N).
- Evita arrays sin cota que crecen para siempre dentro de un documento (límite de 16 MB).
- Define esquemas Mongoose explícitos con tipos, `required`, `default` y `enum`.

## Queries e índices

- Crea **índices** para los campos por los que filtras/ordenas; sin índice → COLLSCAN.
- Índices compuestos siguen la regla **ESR** (Equality, Sort, Range) en ese orden.
- Proyecta sólo los campos que necesitas (`.select()`); pagina con `limit`/`skip` o rango por `_id`.
- Agregaciones: filtra (`$match`) lo antes posible en el pipeline para reducir documentos.
- Usa `lean()` para lecturas de sólo lectura (devuelve POJOs, más rápido).

## Integración en este repo

- Hoy el estado es **en memoria** (singletons). Si se agrega Mongo:
  - Aísla el acceso tras un **repositorio/servicio**; no metas queries en rutas ni en el dominio.
  - Carga la conexión una vez al arrancar; reutilízala (no conectar por request).
  - Mantén el dominio en **español** coherente con el resto.

## Checklist

- [ ] El esquema soporta las consultas reales (no hay query sin índice en caminos calientes).
- [ ] Embed vs reference justificado por patrón de acceso y crecimiento.
- [ ] Acceso a datos detrás de un repositorio/servicio, no en el handler HTTP.
- [ ] Errores de conexión/validación manejados.

## Errores comunes

- Conectar a Mongo dentro de cada request en vez de reusar la conexión.
- Embeber datos que crecen sin límite → documentos enormes y lentos.
- Filtrar/ordenar por campos sin índice → escaneos completos.
- Mezclar lógica de persistencia con lógica de dominio.
