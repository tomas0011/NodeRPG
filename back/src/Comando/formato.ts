/**
 * Formato compartido de los mensajes de consola. El frontend renderiza con
 * `white-space: pre-wrap`, así que los `\n` se respetan; las listas van un
 * ítem por línea para que sigan legibles con inventarios/salas grandes.
 */

/** Sección de lista: título + un ítem por línea, o `Título: <vacío>` inline. */
export function seccion(titulo: string, items: string[], vacio: string): string[] {
    if (!items.length) {
        return [`${titulo}: ${vacio}`];
    }
    return [`${titulo}:`, ...items.map((item) => `- ${item}`)];
}
