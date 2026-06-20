import PersonajeDecorador from "../PersonajeDecorador";
import IPersonaje from "../IPersonaje";

/**
 * Decorador de equipo del arco. Al equiparlo sube el `dadoDeGolpe` base del
 * portador a 5 (entre los puños/4 y la espada/6). Es la parte Decorator del
 * arco; el **cómo** ataca a distancia (escalado con destreza) lo decide
 * `ArcoStrategy`, no este decorador.
 */
export default class ConArco extends PersonajeDecorador {
    constructor(portadorDeArmadura: IPersonaje) {
        super(portadorDeArmadura);
    }

    dadoDeGolpe(): number {
        return 5;
    }
}
