const DIACRITICOS = /[\u0300-\u036f]/g;

/**
 * Normaliza entradas de usuario igual que el backend:
 * trim, minúsculas, sin tildes y con espacios compactados.
 */
export function normalizarEntrada(entrada: string | null | undefined): string {
  return (entrada || '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .replace(/\s+/g, ' ');
}

export function coincidePorPrefijo(
  valorCanonico: string,
  entradaParcial: string | null | undefined
): boolean {
  const prefijoNormalizado = normalizarEntrada(entradaParcial);

  if (!prefijoNormalizado) {
    return false;
  }

  return normalizarEntrada(valorCanonico).startsWith(prefijoNormalizado);
}
