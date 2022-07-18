import { Objeto } from "../../Objeto";
import { IPortadorArmadura } from "./Armadura";

export class ArmaduraDecorador extends Objeto implements IPortadorArmadura {
    portadorDeArmadura: IPortadorArmadura ;

    constructor(nombre: string, clase: string,portadorDeArmadura: IPortadorArmadura){
        super(nombre,clase);
        this.portadorDeArmadura = portadorDeArmadura;
    }

    claseDeArmadura(destreza: number): number { 
        return this.portadorDeArmadura.claseDeArmadura(destreza)
    }
}
