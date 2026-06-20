import ConMartillo from "../../Personaje/decoradores/ConMartillo";
import { Objeto } from "../Objeto";
import type { IEstrategiaDeAtaque } from "../estrategias/IEstrategiaDeAtaque";
import MartilloStrategy from "../estrategias/MartilloStrategy";

export class Martillo extends Objeto {
    constructor() {
        super('martillo', 'arma')
    }

    getModificacion() {
        return ConMartillo;
    }

    getEstrategiaDeAtaque(): IEstrategiaDeAtaque {
        return new MartilloStrategy();
    }
}
