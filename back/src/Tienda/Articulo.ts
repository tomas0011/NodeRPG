/**
 * Moneda con la que se paga un artículo de tienda. **oro** es efímero (vive y
 * muere con la run); **plata** es persistente (perfil, meta-progresión).
 */
export type Moneda = 'oro' | 'plata';

/**
 * Artículo de un catálogo de tienda (abstracción común a hub y en-run). Es la
 * **única fuente de precios/efectos**: ni `comprar` ni `crear` hardcodean
 * números o ids — todo viene del catálogo.
 *
 * - `id`: identificador estable (también lo que se guarda en `profile.mejoras`
 *   para las mejoras de hub, o el id que `ObjetoFactory` entiende para el equipo
 *   en-run).
 * - `costo`/`moneda`: precio. Hub → plata; en-run → oro.
 */
export interface Articulo {
    id: string;
    nombre: string;
    descripcion: string;
    costo: number;
    moneda: Moneda;
}
