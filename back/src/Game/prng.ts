/**
 * PRNG **determinista sembrado** (3h). El mapa de cada run se genera a partir de
 * la `semilla` con este generador, de modo que la **misma semilla produce
 * SIEMPRE la misma secuencia** de números (y por tanto el mismo mapa). **No usa
 * `Math.random()`** (no es reproducible): el azar del mapa depende sólo de la
 * semilla.
 *
 * Algoritmo: **mulberry32** — un generador de 32 bits rápido, sin estado global,
 * de calidad suficiente para generación procedural. Su estado es un único entero
 * de 32 bits que avanza de forma puramente aritmética; partiendo del mismo
 * estado inicial (la semilla) la secuencia es idéntica en cualquier máquina/Node.
 *
 * Es una abstracción limpia y testeable: cada `Prng` es una instancia con su
 * propio estado (no comparte nada con otras), así combate u otros usos de azar
 * pueden tener su PRNG aparte sin contaminar la generación del mapa.
 */
export default class Prng {
    /** Estado interno de 32 bits (>>> 0 lo mantiene como uint32). */
    private estado: number;

    /**
     * @param semilla semilla entera. Se normaliza a uint32 para un estado
     *   inicial determinista; semillas iguales ⇒ secuencias iguales.
     */
    constructor(semilla: number) {
        // Normaliza a un entero uint32 estable (tolera flotantes/negativos).
        this.estado = (Math.floor(semilla) >>> 0) || 1;
    }

    /**
     * Siguiente número pseudoaleatorio en `[0, 1)` (mulberry32). Avanza el
     * estado de forma determinista.
     */
    public siguiente(): number {
        // mulberry32
        this.estado = (this.estado + 0x6d2b79f5) >>> 0;
        let t = this.estado;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Entero pseudoaleatorio en el rango **inclusivo** `[min, max]`. Si
     * `max < min` devuelve `min`. Determinista por el estado actual.
     */
    public entero(min: number, max: number): number {
        if (max < min) {
            return min;
        }
        const rango = max - min + 1;
        return min + Math.floor(this.siguiente() * rango);
    }

    /**
     * Elige un elemento de `array` de forma determinista. Devuelve `undefined`
     * si el array está vacío (no muta el array).
     */
    public elegir<T>(array: readonly T[]): T | undefined {
        if (array.length === 0) {
            return undefined;
        }
        return array[this.entero(0, array.length - 1)];
    }

    /**
     * Devuelve una **copia barajada** de `array` (Fisher–Yates determinista). No
     * muta el original; el orden depende sólo del estado del PRNG.
     */
    public barajar<T>(array: readonly T[]): T[] {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = this.entero(0, i);
            const tmp = copia[i];
            copia[i] = copia[j];
            copia[j] = tmp;
        }
        return copia;
    }
}
