# WORKFLOW.md — Harness de agentes (Orquestador → Implementadores → Testeadores)

Este documento define cómo Claude Code debe trabajar en este repo usando un flujo de
tres roles. La meta es separar **decisión** (qué construir), **implementación** (cómo)
y **validación** (funciona o no), cada una con su propio contexto.

> Lee también `CLAUDE.md` para la arquitectura del proyecto y las convenciones (dominio
> en español, patrones GoF, dos proyectos npm `back/` y `app/`), y `PROGRESS.md` para el
> estado vivo de la(s) implementación(es) y poder retomar el trabajo.

---

## Roles

### 1. Orquestador (agente principal)
Es la sesión principal. **No escribe código de features directamente.** Su trabajo:

1. **Entender el requerimiento**: aclarar ambigüedades con el usuario antes de delegar.
   Si falta una decisión que es del usuario (alcance, stack, contrato de API), pregúntala.
2. **Descomponer** el requerimiento en tareas independientes y verificables.
3. **Escribir un contrato por tarea** (ver plantilla abajo) y delegar a un Implementador.
4. **Integrar**: revisar el reporte del Implementador, resolver conflictos entre tareas,
   y decidir si el conjunto está listo.
5. **Nunca** marca algo como "hecho" sin un veredicto verde de un Testeador.
6. **Mantiene `PROGRESS.md`**: registra cada tarea, su estado y el próximo paso. Actualízalo
   en cada cambio de estado y antes de cerrar la sesión, para poder retomar sin contexto previo.

Delega con la tool `Agent`. Tareas independientes → lánzalas en paralelo (varios `Agent`
en un mismo mensaje). Tareas con dependencias → secuéncialas.

### 2. Implementador
Agente con contexto enfocado en **una** tarea. Su trabajo:

1. Leer el contrato y los archivos relevantes.
2. **Cargar las skills necesarias** con la tool `Skill` antes de codificar
   (ver "Skills disponibles"). Ej: una API nueva → `node-express` + `typescript`
   (+ `mongodb` si persiste, + `design-patterns` si aplica un patrón).
3. Implementar respetando las convenciones del repo (dominio en español, patrones existentes).
4. **Spawnear un Testeador con contexto limpio** (`Agent`, sin arrastrar su propio razonamiento)
   pasándole sólo: qué se implementó, qué archivos tocó y los criterios de aceptación.
5. Si el Testeador reporta fallos → **corregir** y volver al paso 4. Iterar hasta verde
   o hasta agotar el presupuesto de intentos (default: 3), entonces escalar al Orquestador.
6. Devolver al Orquestador un reporte: archivos cambiados, decisiones, veredicto final.

### 3. Testeador
Agente con **contexto limpio** (no vio cómo se escribió el código → evita sesgo de confirmación).
Su trabajo:

1. Recibir: descripción de lo implementado, archivos y criterios de aceptación.
2. Validar de forma **objetiva**: compilar (`cd back && npm run build`), ejecutar la app,
   probar el endpoint/UI, revisar casos borde y los criterios.
3. Emitir un **veredicto estructurado** (ver plantilla). No corrige código; reporta.
4. Si falla: indicar **exactamente** qué falló, cómo reproducirlo y qué se esperaba,
   para que el Implementador pueda actuar sin adivinar.

---

## Flujo

```
Usuario
  │  requerimiento
  ▼
ORQUESTADOR ──── descompone en tareas + contratos
  │
  ├─► IMPLEMENTADOR (tarea A) ──► escribe código (usa Skills)
  │        │
  │        └─► TESTEADOR (contexto limpio) ──► veredicto
  │                 │ falla → vuelve al Implementador (máx 3 ciclos)
  │                 │ pasa  → reporte verde
  │        ◄────────┘
  │
  ├─► IMPLEMENTADOR (tarea B) ... (en paralelo si es independiente)
  │
  ▼
ORQUESTADOR ──── integra, resuelve conflictos, reporta al usuario
```

---

## Contrato de tarea (Orquestador → Implementador)

```
TAREA: <título corto>
OBJETIVO: <qué debe lograr, en términos de comportamiento observable>
ARCHIVOS PROBABLES: <pistas de dónde tocar; el implementador confirma>
CONVENCIONES: dominio en español; respetar patrones existentes (ver CLAUDE.md)
SKILLS SUGERIDAS: <ej: node-express, typescript, mongodb>
CRITERIOS DE ACEPTACIÓN:
  - <condición 1 verificable>
  - <condición 2 verificable>
FUERA DE ALCANCE: <lo que NO debe tocar>
```

## Briefing de test (Implementador → Testeador)

```
IMPLEMENTADO: <resumen de qué se construyó>
ARCHIVOS: <lista>
CÓMO EJECUTAR: <comandos, ej. cd back && npm run build && npm run serve>
CRITERIOS DE ACEPTACIÓN: <copiados del contrato>
NO ASUMAS que funciona: reprodúcelo.
```

## Veredicto (Testeador → Implementador)

```
VEREDICTO: PASA | FALLA
EVIDENCIA: <salida de build/ejecución/pruebas>
FALLOS (si aplica):
  - QUÉ: <síntoma> | REPRO: <pasos> | ESPERADO: <vs> OBTENIDO: <...>
```

---

## Reglas

- **Contexto limpio para testear**: el Testeador siempre se spawnea fresco. No reusar el
  agente Implementador como su propio Testeador.
- **Veredicto antes de "hecho"**: ninguna tarea se reporta completa sin PASA de un Testeador.
- **Límite de iteraciones**: máx 3 ciclos implementar↔testear por tarea; luego escala.
- **Skills primero**: el Implementador carga las skills relevantes antes de escribir código.
- **Paralelismo sólo si es independiente**: tareas que tocan los mismos archivos se secuencian.
- **El Orquestador no programa features**; coordina, integra y decide.
- **`PROGRESS.md` es la fuente de verdad del avance**: si cambió el código y no está ahí, no pasó.

---

## Skills disponibles (`.claude/skills/`)

| Skill | Úsala cuando… |
|-------|---------------|
| `design-patterns`  | aplicar/refactorizar a un patrón GoF (Singleton, Command, Decorator, Composite, Strategy, Factory…) |
| `typescript`       | tipado, genéricos, configuración de `tsconfig`, errores de compilación |
| `node-express`     | endpoints, middleware, estructura de API, manejo de errores en backend |
| `mongodb`          | esquemas, queries, índices, modelado de datos, integración con Mongoose |
| `react-next`       | componentes React, hooks, routing/SSR de Next.js, manejo de estado |
| `frontend-design`  | layout, accesibilidad, jerarquía visual, UX de la consola/UI |
