export function normalizarEntrada(entrada: string | null | undefined): string {
    return (entrada || '')
        .trim()
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

export function sonEntradasEquivalentes(
    izquierda: string | null | undefined,
    derecha: string | null | undefined
): boolean {
    return normalizarEntrada(izquierda) === normalizarEntrada(derecha);
}

export function resolverValorCanonico<T>(
    entrada: string | null | undefined,
    opciones: readonly T[],
    obtenerTexto: (opcion: T) => string
): T | undefined {
    const entradaNormalizada = normalizarEntrada(entrada);
    return opciones.find((opcion) => normalizarEntrada(obtenerTexto(opcion)) === entradaNormalizada);
}

export function resolverClaveCanonica<T>(
    entrada: string | null | undefined,
    registro: Record<string, T>
): string | undefined {
    return resolverValorCanonico(entrada, Object.keys(registro), (clave) => clave);
}
