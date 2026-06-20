import PersonajeDecorador from "../PersonajeDecorador";
import IPersonaje from "../IPersonaje";

/**
 * Decorador de equipo del martillo. Arma pesada: sube el `dadoDeGolpe` base del
 * portador a 7 (el más alto). Es la parte Decorator del martillo; el **cómo**
 * rompe la armadura del objetivo lo decide `MartilloStrategy`, no este
 * decorador.
 */
export default class ConMartillo extends PersonajeDecorador {
    constructor(portadorDeArmadura: IPersonaje) {
        super(portadorDeArmadura);
    }

    dadoDeGolpe(): number {
        return 7;
    }
}
