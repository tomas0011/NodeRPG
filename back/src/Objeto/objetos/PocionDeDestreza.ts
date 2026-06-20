import { Objeto } from "../Objeto";
import type { IEfecto } from "../efectos/IEfecto";
import EfectoBuffDestreza from "../efectos/EfectoBuffDestreza";

/**
 * Poción de destreza: consumible que mejora la destreza del jugador dentro de la
 * run al usarse. No es equipable ni arma; sólo expone su `IEfecto`.
 */
export class PocionDeDestreza extends Objeto {
    constructor() {
        super('poción de destreza', 'consumible');
    }

    getModificacion() {}

    getEfecto(): IEfecto {
        return new EfectoBuffDestreza(1);
    }
}
