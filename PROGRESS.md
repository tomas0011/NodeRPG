# PROGRESS.md — Estado de la implementación

Log vivo para **retomar el trabajo** entre sesiones. El Orquestador lo actualiza tras
cada cambio de estado de una tarea; los Implementadores anotan su avance y los
Testeadores su veredicto. Lee `WORKFLOW.md` para los roles y `CLAUDE.md` para la arquitectura.

> **Regla de oro**: si algo cambió en el código y no está acá, no pasó. Actualiza este
> archivo *antes* de cerrar la sesión para poder retomar sin releer todo.

---

## Cómo retomar (leer esto primero al volver)

1. Mira **Estado actual** y la tabla de **Tareas** para ver qué quedó en progreso/bloqueado.
2. Revisa **Próximo paso** de cada tarea activa.
3. Consulta el **Log de decisiones** para no rehacer discusiones ya cerradas.
4. Verifica el repo: `cd back && npm run build` debe compilar antes de seguir.

## Estados posibles

`PENDIENTE` · `EN PROGRESO` · `EN TEST` · `BLOQUEADO` · `HECHO` ✅ · `DESCARTADO`

---

## Estado actual

- **Fecha de última actualización**: 2026-06-20
- **Foco actual**: harness de agentes listo; sin features en curso.
- **Bloqueos abiertos**: ninguno.
- **Próximo paso global**: definir el primer requerimiento de feature y delegarlo (Orquestador).

---

## Tareas

| ID | Tarea | Estado | Responsable | Ciclos test | Próximo paso |
|----|-------|--------|-------------|-------------|--------------|
| H-0 | Crear harness (WORKFLOW.md + skills) | HECHO ✅ | Orquestador | — | — |
| H-1 | _(siguiente feature)_ | PENDIENTE | — | 0/3 | Definir contrato |

---

## Detalle por tarea

### H-0 — Harness de agentes ✅
- **Hecho**: `WORKFLOW.md` (flujo orquestador→implementador→testeador, plantillas) y 6 skills
  en `.claude/skills/` (`design-patterns`, `typescript`, `node-express`, `mongodb`,
  `react-next`, `frontend-design`).
- **Veredicto**: N/A (documentación/configuración).

### H-1 — _(plantilla de tarea, copiar para cada feature nueva)_
- **Objetivo**: <comportamiento observable>
- **Criterios de aceptación**: <lista verificable>
- **Archivos tocados**: <se completa al implementar>
- **Avance del Implementador**: <qué se hizo, qué falta>
- **Veredicto del Testeador**: <PASA/FALLA + evidencia>
- **Próximo paso**: <acción concreta para retomar>

---

## Log de decisiones

Registra decisiones de alcance/arquitectura con fecha, para no re-litigarlas.

| Fecha | Decisión | Motivo |
|-------|----------|--------|
| 2026-06-20 | Harness y skills viven en este repo (`.claude/skills/`), no globales | Versionado junto al proyecto |
| 2026-06-20 | Skills concisas y accionables (no extensas con snippets) | Rápidas de crear y mantener |

---

## Bitácora (opcional, lo más reciente arriba)

- **2026-06-20** — Creado el harness: `WORKFLOW.md`, `PROGRESS.md` y 6 skills.
