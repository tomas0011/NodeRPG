import { Objeto } from "../Objeto";
import ConArmaduraDeCuero from "../../Personaje/decoradores/ConArmaduraDeCuero";

export class ArmaduraDeCuero extends Objeto {
    constructor() {
        super('armadura de cuero', 'armadura')
    }

    getModificacion() {
        return ConArmaduraDeCuero;
    }
}
