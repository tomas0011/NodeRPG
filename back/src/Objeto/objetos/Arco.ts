import ConArco from "../../Personaje/decoradores/ConArco";
import { Objeto } from "../Objeto";
import type { IEstrategiaDeAtaque } from "../estrategias/IEstrategiaDeAtaque";
import ArcoStrategy from "../estrategias/ArcoStrategy";

export class Arco extends Objeto {
    constructor() {
        super('arco', 'arma')
    }

    getModificacion() {
        return ConArco;
    }

    getEstrategiaDeAtaque(): IEstrategiaDeAtaque {
        return new ArcoStrategy();
    }
}
