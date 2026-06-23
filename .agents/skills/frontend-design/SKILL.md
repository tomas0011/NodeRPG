---
name: frontend-design
description: Diseño de interfaces y UX — layout, jerarquía visual, espaciado, tipografía, color, estados (carga/vacío/error) y accesibilidad. Úsala al construir o pulir UI, decidir composición visual o mejorar usabilidad. En este repo aplica a la consola/terminal del frontend en app/.
---

# Diseño Frontend (UI/UX)

Meta: interfaces claras, jerárquicas y accesibles. El usuario entiende qué mirar y qué hacer sin esfuerzo.

## Principios

- **Jerarquía visual**: lo importante primero. Usa tamaño, peso, color y posición para guiar el ojo.
- **Espaciado consistente**: una escala (4/8/12/16/24/32…). El espacio en blanco agrupa y separa;
  la proximidad comunica relación.
- **Tipografía**: pocas familias y tamaños; line-height cómodo (~1.4-1.6 en texto); ancho de
  línea legible. En una consola, usa monoespaciada y respeta el alineado.
- **Color con propósito**: paleta corta + acento. Asegura **contraste** suficiente (WCAG AA:
  4.5:1 texto normal). No comuniques sólo con color (añade ícono/texto).
- **Estados explícitos**: diseña carga, vacío, error y éxito — no sólo el caso feliz.
  En una consola: prompt claro, eco del comando, respuesta, y mensaje de error legible.
- **Feedback inmediato**: toda acción del usuario produce una respuesta visible.
- **Consistencia**: mismos patrones para mismas acciones; no reinventes por pantalla.

## Accesibilidad (mínimos)

- HTML semántico (`button`, `label`, `nav`…); el `div` clickeable no es accesible.
- Navegación por teclado y `:focus` visible. En un input de consola, foco automático y manejo de Enter.
- `alt` en imágenes; `aria-label` cuando el texto visible no basta.
- Contraste suficiente; tamaño de toque/clic adecuado.

## Este repo

- UI tipo terminal en `app/` (`consoleInput`, `consoleOutput`, `commandResponse`, `view`).
- Mantén la metáfora de consola: entrada → eco → salida, scroll al último mensaje,
  errores en línea con el resto del log.

## Checklist

- [ ] Jerarquía clara: se distingue lo primario de lo secundario.
- [ ] Espaciado y tipografía en una escala consistente.
- [ ] Contraste AA y no depende sólo del color.
- [ ] Estados de carga/vacío/error diseñados.
- [ ] Accesible por teclado, foco visible, HTML semántico.

## Errores comunes

- Todo al mismo peso visual → nada destaca.
- Sólo el "happy path"; sin estado de error o vacío.
- Contraste bajo o significado transmitido sólo por color.
- `div`/`span` clickeables sin rol ni soporte de teclado.
