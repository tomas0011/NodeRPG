import PersonajeDecorador from "../PersonajeDecorador";
import IPersonaje from "../IPersonaje";

export default class ConArmaduraDePlacas extends PersonajeDecorador {
    constructor(portadorDeArmadura: IPersonaje){
        super(portadorDeArmadura);
    }

    claseDeArmadura(): number { 
        return 18;
    }
}
