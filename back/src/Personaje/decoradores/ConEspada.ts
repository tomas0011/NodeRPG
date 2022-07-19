import PersonajeDecorador from "../PersonajeDecorador";
import IPersonaje from "../IPersonaje";

export default class ConEspada extends PersonajeDecorador {
    constructor(portadorDeArmadura: IPersonaje = null){
        super(portadorDeArmadura);
    }

    dadoDeGolpe(): number {
        return 6   
    }
}
