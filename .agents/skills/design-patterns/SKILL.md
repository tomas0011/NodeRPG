---
name: design-patterns
description: Aplicar y refactorizar hacia patrones de diseño GoF (Singleton, Command, Decorator, Composite, Strategy, Factory, Observer, Adapter). Úsala al diseñar la estructura de un módulo, al añadir extensibilidad o al detectar código rígido/duplicado que un patrón resolvería. Relevante para el backend de este repo, que es un showcase de patrones en español.
---

# Patrones de diseño (GoF)

Objetivo: elegir el patrón **mínimo** que resuelve el problema real, no decorar el código con patrones por moda. En este repo el dominio está en **español** y ya se usan Singleton, Command, Decorator y Composite (ver `AGENTS.md`).

## Cómo elegir

1. Nombra el eje de cambio: ¿qué va a variar? (algoritmo, estructura, creación, comportamiento).
2. Aísla esa variación detrás de una interfaz.
3. Aplica el patrón sólo si hay ≥2 variantes reales o una extensión clara prevista. Si no, YAGNI.

## Catálogo rápido

- **Singleton** — una única instancia global compartida. `getInstance()` con campo `static`.
  Riesgo: estado global y dificultad para testear. En este repo es el patrón base
  (`ComandoManager`, `Escenario`, `PersonajeJugable`, `RequestManager`).
- **Command** — encapsular una acción como objeto con interfaz uniforme (`ejecutar`).
  Útil para registrar/extender acciones. Aquí: `IComando` + `ComandosManager`.
- **Decorator** — añadir responsabilidades envolviendo un objeto que comparte su interfaz;
  delega todo al envuelto y sobrescribe sólo lo que cambia. Aquí: `PersonajeDecorador` y `ConEspada`, etc.
- **Composite** — tratar objetos individuales y composiciones por igual (árbol). Aquí: `Contenedor`.
- **Strategy** — intercambiar algoritmos en runtime tras una interfaz común.
- **Factory Method / Abstract Factory** — delegar la creación a subclases/objetos fábrica.
- **Observer** — notificar a N suscriptores ante un cambio de estado.
- **Adapter** — encajar una interfaz incompatible con la que el cliente espera.

## Convenciones en este repo

- Identificadores y métodos en **español** (`ejecutar`, `recibirDaño`, `getInstance`).
- Singleton: instancia en campo `private static`; `getInstance()` la crea perezosamente.
- Para extender un patrón existente, sigue el mismo molde (ej. nuevo comando → ver `AGENTS.md`).

## Checklist

- [ ] El patrón responde a una variación real, no hipotética.
- [ ] La interfaz queda pequeña y estable.
- [ ] No introduces estado global innecesario (cuidado con Singleton).
- [ ] El nombre comunica el rol, en español, coherente con el código vecino.

## Errores comunes

- Singleton usado como "variable global con clase" → acoplamiento y tests imposibles.
- Decorator que reimplementa en vez de delegar al objeto envuelto.
- Sobre-ingeniería: 5 clases para algo que era un `if`.
