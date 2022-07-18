import { IPortadorArmadura } from "./Armadura";
import { ArmaduraDecorador } from "./ArmaduraDecorador";

export class ArmaduraDePlacas extends ArmaduraDecorador{
    constructor(portadorDeArmadura: IPortadorArmadura = null){
        super("armadura_de_placas", "armadura", portadorDeArmadura);
    }

    claseDeArmadura(destreza: number): number { 
        return 18 + destreza;
    }
}
