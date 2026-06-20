import PersonajeDecorador from "../PersonajeDecorador";
import IPersonaje from "../IPersonaje";

export default class ConArmaduraDeCuero extends PersonajeDecorador {
    constructor(portadorDeArmadura: IPersonaje){
        super(portadorDeArmadura);
    }

    claseDeArmadura(): number { 
        return 13 + this.portadorDeArmadura.getDestreza();
    }
}
