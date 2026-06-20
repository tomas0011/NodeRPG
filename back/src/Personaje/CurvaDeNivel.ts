/**
 * Curva de progresión de nivel de la run (3i). Punto **único** y reutilizable de
 * la fórmula: ni `Personaje` ni los tests dispersan números mágicos.
 *
 * Concepto: el jugador acumula **XP** dentro de la run; al cruzar el umbral del
 * nivel actual **sube de nivel**, lo que aumenta `vidaMaxima` y `destreza`. XP y
 * nivel **viven en la run** (se pierden al morir/abandonar; NO van al perfil).
 *
 * Fórmula (determinista, sin azar):
 *  - XP necesaria para pasar **del** nivel `n` al `n+1`:  `n * XP_BASE`
 *    (nivel 1→2 cuesta 100, 2→3 cuesta 200, 3→4 cuesta 300, …). La XP se
 *    consume al subir (modelo "XP hacia el siguiente nivel", no acumulada).
 *  - Al subir cada nivel: `vidaMaxima += VIDA_POR_NIVEL`, `destreza += DESTREZA_POR_NIVEL`.
 *
 * La acumulación puede subir **varios** niveles de golpe si la XP alcanza
 * (`ganarXp` itera consumiendo umbrales).
 */
export default class CurvaDeNivel {
    /** XP base por nivel; el coste escala linealmente con el nivel actual. */
    public static readonly XP_BASE = 100;

    /** Vida máxima añadida por cada nivel ganado. */
    public static readonly VIDA_POR_NIVEL = 5;

    /** Destreza añadida por cada nivel ganado. */
    public static readonly DESTREZA_POR_NIVEL = 1;

    /**
     * XP necesaria para pasar **del** nivel `nivel` al siguiente (`nivel + 1`).
     * Determinista: `nivel * XP_BASE`. Para niveles inválidos (< 1) usa 1.
     */
    public static xpParaSiguiente(nivel: number): number {
        const n = nivel >= 1 ? Math.floor(nivel) : 1;
        return n * CurvaDeNivel.XP_BASE;
    }
}
