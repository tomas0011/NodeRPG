import ConEspada from "../../Personaje/decoradores/ConEspada";
import { Objeto } from "../Objeto";

export class Espada extends Objeto {
    constructor() {
        super('espada', 'arma')
    }

    getModificacion() {
        return ConEspada;
    }
} 
