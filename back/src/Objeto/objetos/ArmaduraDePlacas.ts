import { Objeto } from "../Objeto";
import ConArmaduraDePlacas from "../../Personaje/decoradores/ConArmaduraDePlacas";

export class ArmaduraDePlacas extends Objeto {
    constructor() {
        super('armadura de placas', 'armadura')
    }

    getModificacion() {
        return ConArmaduraDePlacas;
    }

    getDescripcion(): string {
        return 'Una armadura pesada de placas pensada para absorber golpes. Ofrece una defensa mayor al equiparla.';
    }
}
