import { ArmaduraDecorador } from "./ArmaduraDecorador";

export class Casco extends ArmaduraDecorador{
    constructor(nombre: String, defensa: number, decorador){
        super(nombre, "Casco", defensa, decorador)
    }
}