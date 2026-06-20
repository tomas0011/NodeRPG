/**
 * Resultado tipado de ejecutar un comando.
 *
 * - `ok`: si el comando se ejecutó con éxito (vs. error de dominio).
 * - `message`: texto humano para la consola/TUI (lo que hoy devolvía cada comando).
 * - `data`: payload estructurado opcional para clientes que no quieran parsear texto.
 * - `completions`: opciones válidas contextuales para el autocompletado de la TUI
 *   (p. ej. `{ equipar: [...inventario], tomar: [...sala] }`). Se puebla lo natural
 *   ahora; el resto de comandos pueden no aportar nada.
 */
interface CommandResult {
    ok: boolean;
    message: string;
    data?: unknown;
    completions?: Record<string, string[]>;
}

export default CommandResult;
