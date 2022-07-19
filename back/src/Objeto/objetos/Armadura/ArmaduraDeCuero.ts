import { IPortadorArmadura } from "./IPortadorDeArmadura";
import { ArmaduraDecorador } from "./ArmaduraDecorador";

export class ArmaduraDeCuero extends ArmaduraDecorador{
    constructor(portadorDeArmadura: IPortadorArmadura = null){
        super("armadura de cuero", "armadura", portadorDeArmadura);
    }

    claseDeArmadura(): number { 
        return 13 + this.portadorDeArmadura.getDestreza();
    }
}