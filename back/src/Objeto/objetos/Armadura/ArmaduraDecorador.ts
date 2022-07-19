import { Objeto } from "../../Objeto";
import { IPortadorArmadura } from "./IPortadorDeArmadura";

export class ArmaduraDecorador extends Objeto implements IPortadorArmadura {
    portadorDeArmadura: IPortadorArmadura ;
    destreza: number;
    
    constructor(nombre: string, clase: string, portadorDeArmadura: IPortadorArmadura){
        super(nombre,clase);
        this.portadorDeArmadura = portadorDeArmadura;
    }

    getDestreza(){
        return this.portadorDeArmadura.getDestreza();
    }

    claseDeArmadura(): number { 
        return this.portadorDeArmadura.claseDeArmadura()
    }
}
