import PersonajeDecorador from "../PersonajeDecorador";
import IPersonaje from "../IPersonaje";

export default class ConArmaduraDeCuero extends PersonajeDecorador {
    constructor(portadorDeArmadura: IPersonaje = null){
        super(portadorDeArmadura);
    }

    claseDeArmadura(): number { 
        return 13 + this.portadorDeArmadura.getDestreza();
    }
}
