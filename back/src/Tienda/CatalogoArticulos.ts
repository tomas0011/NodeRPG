import { Articulo } from './Articulo';
import { resolverClaveCanonica } from '../Input/normalizarEntrada';

/**
 * Catálogo de equipo comprable **dentro de la run** (moneda: **oro**). Vende
 * objetos que ya existen en el dominio; el `id` coincide con el que entiende
 * `ObjetoFactory`, de modo que `comprar` reusa la fábrica para instanciar el
 * objeto y añadirlo al inventario de la run.
 *
 * Única fuente de precios: ni `comprar` ni `tienda` definen costos aparte.
 */
const ESPADA: Articulo = {
    id: 'espada',
    nombre: 'Espada',
    descripcion: 'Arma cuerpo a cuerpo equilibrada.',
    costo: 15,
    moneda: 'oro'
};

const ARCO: Articulo = {
    id: 'arco',
    nombre: 'Arco',
    descripcion: 'Arma a distancia que escala con destreza.',
    costo: 18,
    moneda: 'oro'
};

const MARTILLO: Articulo = {
    id: 'martillo',
    nombre: 'Martillo',
    descripcion: 'Arma pesada de daño alto.',
    costo: 25,
    moneda: 'oro'
};

const ARMADURA_DE_CUERO: Articulo = {
    id: 'armadura de cuero',
    nombre: 'Armadura de cuero',
    descripcion: 'Protección ligera.',
    costo: 20,
    moneda: 'oro'
};

const POCION_DE_CURACION: Articulo = {
    id: 'poción de curación',
    nombre: 'Poción de curación',
    descripcion: 'Consumible: restaura vida (hasta el máximo).',
    costo: 10,
    moneda: 'oro'
};

const POCION_DE_DESTREZA: Articulo = {
    id: 'poción de destreza',
    nombre: 'Poción de destreza',
    descripcion: 'Consumible: mejora la destreza durante la run.',
    costo: 12,
    moneda: 'oro'
};

export default class CatalogoArticulos {
    /** id de artículo (id de `ObjetoFactory`) → definición. */
    private static readonly registro: Record<string, Articulo> = {
        [ESPADA.id]: ESPADA,
        [ARCO.id]: ARCO,
        [MARTILLO.id]: MARTILLO,
        [ARMADURA_DE_CUERO.id]: ARMADURA_DE_CUERO,
        [POCION_DE_CURACION.id]: POCION_DE_CURACION,
        [POCION_DE_DESTREZA.id]: POCION_DE_DESTREZA
    };

    /** Devuelve el artículo por su id, o `undefined` si no existe en el catálogo. */
    public static obtener(id: string): Articulo | undefined {
        const idCanonico = resolverClaveCanonica(id, CatalogoArticulos.registro);
        return idCanonico ? CatalogoArticulos.registro[idCanonico] : undefined;
    }

    /** Todos los artículos comprables en-run, en orden de declaración. */
    public static listar(): Articulo[] {
        return Object.values(CatalogoArticulos.registro);
    }
}
