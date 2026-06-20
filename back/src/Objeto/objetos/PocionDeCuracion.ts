import { Objeto } from "../Objeto";
import type { IEfecto } from "../efectos/IEfecto";
import EfectoCurar from "../efectos/EfectoCurar";

/**
 * Poción de curación: consumible que restaura vida (hasta la vida máxima) al
 * usarse. No es equipable (`getModificacion` → undefined) ni arma; su única
 * responsabilidad es exponer su `IEfecto`.
 */
export class PocionDeCuracion extends Objeto {
    constructor() {
        super('poción de curación', 'consumible');
    }

    getModificacion() {}

    getEfecto(): IEfecto {
        return new EfectoCurar(5);
    }
}
