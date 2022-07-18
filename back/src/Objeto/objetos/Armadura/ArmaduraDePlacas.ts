import { IPortadorArmadura } from "./Armadura";
import { ArmaduraDecorador } from "./ArmaduraDecorador";

export class ArmaduraDePlacas extends ArmaduraDecorador{
    constructor(portadorDeArmadura: IPortadorArmadura = null){
        super("armadura de cuero", "armadura", portadorDeArmadura);
    }

    claseDeArmadura(destreza: number): number { 
        return 18 + destreza;
    }
}
