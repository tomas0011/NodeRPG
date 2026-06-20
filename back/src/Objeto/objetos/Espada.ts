import ConEspada from "../../Personaje/decoradores/ConEspada";
import { Objeto } from "../Objeto";
import type { IEstrategiaDeAtaque } from "../estrategias/IEstrategiaDeAtaque";
import EspadaStrategy from "../estrategias/EspadaStrategy";

export class Espada extends Objeto {
    constructor() {
        super('espada', 'arma')
    }

    getModificacion() {
        return ConEspada;
    }

    getEstrategiaDeAtaque(): IEstrategiaDeAtaque {
        return new EspadaStrategy();
    }
}
