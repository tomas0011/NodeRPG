import { Objeto } from "../../Objeto";


export class Armadura extends Objeto {
    defensa: number;
    constructor(nombre: String, clase: String = null, defensa: number){
        super(nombre, clase);
        this.defensa = defensa;
    }


    getDefensa(){
        return this.defensa;
    }
    recibirDaño(daño: number){
        return (Math.random() * 20 < this.defensa) ? ( 0 ) : (daño);
    }
}