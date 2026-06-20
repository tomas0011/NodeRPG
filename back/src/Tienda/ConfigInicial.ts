/**
 * Configuración inicial del personaje de una run, **antes** de instanciarlo.
 * Es el objeto sobre el que actúan los aplicadores de las mejoras del perfil
 * (meta-progresión): cada mejora suma vida/destreza base o añade objetos
 * iniciales al inventario. Mantenerlo como datos planos (no el `Personaje` vivo)
 * hace los aplicadores deterministas y testeables, y desacopla el catálogo de
 * cómo se construye finalmente el jugador.
 */
export interface ConfigInicial {
    /** Vida máxima base con la que arranca el personaje. */
    vidaMaxima: number;
    /** Destreza base con la que arranca el personaje. */
    destreza: number;
    /** Ids de objetos con los que arranca el inventario (para `ObjetoFactory`). */
    objetosIniciales: string[];
}

/** Configuración inicial por defecto (sin ninguna mejora aplicada). */
export function configInicialBase(): ConfigInicial {
    return {
        vidaMaxima: 10,
        destreza: 1,
        objetosIniciales: []
    };
}
