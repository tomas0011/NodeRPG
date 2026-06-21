import { useMemo } from 'react';
import { comandosDeContexto, definicionDe } from '../data/comandos';

interface UseAutocompleteArgs {
  /** Texto actual del input. */
  valor: string;
  /** true = hub, false = run (para filtrar comandos válidos). */
  enHub: boolean;
  /** Completions del momento (argumentos por comando). */
  completions: Record<string, string[]>;
}

interface UseAutocompleteResult {
  /** Sugerencias que matchean el input actual. */
  sugerencias: string[];
  /**
   * Reemplaza la última "palabra" del input por la sugerencia elegida,
   * devolviendo el texto completo a poner en el input.
   */
  aplicar: (sugerencia: string) => string;
}

/**
 * Autocompletado contextual.
 *  - Sin `:` en el input → sugiere nombres de comando del contexto que matchean
 *    el prefijo.
 *  - Con `comando:` → sugiere argumentos desde `completions[clave]` del comando,
 *    matcheando el texto tras los dos puntos.
 */
export function useAutocomplete({
  valor,
  enHub,
  completions
}: UseAutocompleteArgs): UseAutocompleteResult {
  const sugerencias = useMemo<string[]>(() => {
    const texto = valor.trimStart();
    const indiceDosPuntos = texto.indexOf(':');

    if (indiceDosPuntos === -1) {
      // Sugerir nombres de comando del contexto que empiecen por el prefijo.
      const prefijo = texto.toLowerCase();
      const comandos = comandosDeContexto(enHub).map((c) => c.nombre);
      if (!prefijo) {
        return comandos;
      }
      return comandos.filter((nombre) => nombre.startsWith(prefijo));
    }

    // Sugerir argumentos del comando tras los dos puntos.
    const nombreComando = texto.slice(0, indiceDosPuntos).trim().toLowerCase();
    const argParcial = texto.slice(indiceDosPuntos + 1).toLowerCase();
    const def = definicionDe(nombreComando);
    const clave = def?.claveCompletions;
    if (!clave) {
      return [];
    }
    const opciones = completions[clave] || [];
    if (!argParcial) {
      return opciones;
    }
    return opciones.filter((opcion) => opcion.toLowerCase().startsWith(argParcial));
  }, [valor, enHub, completions]);

  const aplicar = useMemo(() => {
    return (sugerencia: string): string => {
      const texto = valor;
      const indiceDosPuntos = texto.indexOf(':');
      if (indiceDosPuntos === -1) {
        // Reemplaza el nombre del comando entero.
        return sugerencia;
      }
      const nombreComando = texto.slice(0, indiceDosPuntos).trim();
      return `${nombreComando}:${sugerencia}`;
    };
  }, [valor]);

  return { sugerencias, aplicar };
}
