import { Personaje } from "../../../Personaje/Personaje";
import { Armadura } from "./Armadura";


export class ArmaduraDecorador extends Armadura {
    decorado: Armadura | Personaje;
    defensa: number;
    constructor(nombre: String, clase: String = null, defensa: number, decorado: Armadura | Personaje){
        super(nombre, clase, defensa)
        this.defensa = defensa;
    }

    setArmadura(nuevoDecorado: Armadura | Personaje){
        this.decorado = nuevoDecorado;
    }

    recibirDaño(daño: number): number {
        return this.decorado.recibirDaño(daño - this.defensa);
    }
    
}