import { Articulo } from './Articulo';
import { ConfigInicial } from './ConfigInicial';
import { resolverClaveCanonica } from '../Input/normalizarEntrada';

/**
 * Una **mejora** del hub: un `Articulo` (siempre en **plata**) más un
 * **aplicador** (patrón Strategy: un comportamiento por mejora) que modifica la
 * `ConfigInicial` del personaje al crear una run nueva. El aplicador es la pieza
 * que hace **efectiva la meta-progresión**: comprar la mejora sólo guarda su id
 * en `profile.mejoras`; el efecto sobre los stats se materializa aquí, en
 * `crear`.
 *
 * - `acumulable`: si `true`, comprarla varias veces apila su efecto (p. ej.
 *   +N vida por cada compra) y se guarda repetida en `profile.mejoras`. Si
 *   `false`, es un desbloqueo único (comprarla de nuevo se rechaza).
 */
export interface Mejora {
    articulo: Articulo;
    acumulable: boolean;
    /** Aplica el efecto de la mejora sobre la config inicial (mutándola). */
    aplicador: (config: ConfigInicial) => void;
}

/** +5 de vida máxima base por compra. Acumulable. */
const VIDA_EXTRA: Mejora = {
    articulo: {
        id: 'vida_extra',
        nombre: 'Vida extra',
        descripcion: '+5 de vida máxima base en futuras runs.',
        costo: 20,
        moneda: 'plata'
    },
    acumulable: true,
    aplicador: (config) => {
        config.vidaMaxima += 5;
    }
};

/** +1 de destreza base por compra. Acumulable. */
const DESTREZA_EXTRA: Mejora = {
    articulo: {
        id: 'destreza_extra',
        nombre: 'Destreza extra',
        descripcion: '+1 de destreza base en futuras runs.',
        costo: 25,
        moneda: 'plata'
    },
    acumulable: true,
    aplicador: (config) => {
        config.destreza += 1;
    }
};

/** Arranca cada run con una espada en el inventario. Desbloqueo único. */
const EMPEZAR_CON_ESPADA: Mejora = {
    articulo: {
        id: 'empezar_con_espada',
        nombre: 'Empezar con espada',
        descripcion: 'Comienzas cada run con una espada en el inventario.',
        costo: 40,
        moneda: 'plata'
    },
    acumulable: false,
    aplicador: (config) => {
        config.objetosIniciales.push('espada');
    }
};

/** Arranca cada run con una armadura de cuero en el inventario. Desbloqueo único. */
const EMPEZAR_CON_ARMADURA: Mejora = {
    articulo: {
        id: 'empezar_con_armadura',
        nombre: 'Empezar con armadura',
        descripcion: 'Comienzas cada run con una armadura de cuero en el inventario.',
        costo: 50,
        moneda: 'plata'
    },
    acumulable: false,
    aplicador: (config) => {
        config.objetosIniciales.push('armadura de cuero');
    }
};

/**
 * Catálogo de mejoras permanentes del **hub** (moneda: **plata**). Única fuente
 * de precios y efectos: ni `comprar` ni `crear` definen números o ids aparte.
 */
export default class CatalogoMejoras {
    /** id de mejora → definición. */
    private static readonly registro: Record<string, Mejora> = {
        [VIDA_EXTRA.articulo.id]: VIDA_EXTRA,
        [DESTREZA_EXTRA.articulo.id]: DESTREZA_EXTRA,
        [EMPEZAR_CON_ESPADA.articulo.id]: EMPEZAR_CON_ESPADA,
        [EMPEZAR_CON_ARMADURA.articulo.id]: EMPEZAR_CON_ARMADURA
    };

    /** Devuelve la mejora por su id, o `undefined` si no existe en el catálogo. */
    public static obtener(id: string): Mejora | undefined {
        const idCanonico = resolverClaveCanonica(id, CatalogoMejoras.registro);
        return idCanonico ? CatalogoMejoras.registro[idCanonico] : undefined;
    }

    /** Todas las mejoras del catálogo, en orden de declaración. */
    public static listar(): Mejora[] {
        return Object.values(CatalogoMejoras.registro);
    }

    /** Sólo los artículos (id/nombre/costo/moneda) de las mejoras. */
    public static articulos(): Articulo[] {
        return CatalogoMejoras.listar().map((mejora) => mejora.articulo);
    }
}
