import { IPortadorArmadura } from "./IPortadorDeArmadura";
import { ArmaduraDecorador } from "./ArmaduraDecorador";

export class ArmaduraDePlacas extends ArmaduraDecorador{
    constructor(portadorDeArmadura: IPortadorArmadura = null){
        super("armadura_de_placas", "armadura", portadorDeArmadura);
    }

    claseDeArmadura(): number { 
        return 18 + this.portadorDeArmadura.getDestreza();
    }
}
