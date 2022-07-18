import { IPortadorArmadura } from "./Armadura";
import { ArmaduraDecorador } from "./ArmaduraDecorador";

export class ArmaduraDeCuero extends ArmaduraDecorador{
    constructor(portadorDeArmadura: IPortadorArmadura = null){
        super("armadura_de_cuero", "armadura", portadorDeArmadura);
    }

    claseDeArmadura(destreza: number): number { 
        return 13 + destreza;
    }
}
