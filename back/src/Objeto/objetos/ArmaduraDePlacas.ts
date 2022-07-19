import { Objeto } from "../Objeto";
import ConArmaduraDePlacas from "../../Personaje/decoradores/ConArmaduraDePlacas";

export class ArmaduraDePlacas extends Objeto {
    constructor() {
        super('armadura de placas', 'armadura')
    }

    getModificacion() {
        return ConArmaduraDePlacas;
    }
}
