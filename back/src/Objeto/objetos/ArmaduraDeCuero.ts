import { Objeto } from "../Objeto";
import ConArmaduraDeCuero from "../../Personaje/decoradores/ConArmaduraDeCuero";

export class ArmaduraDeCuero extends Objeto {
    constructor() {
        super('armadura de cuero', 'armadura')
    }

    getModificacion() {
        return ConArmaduraDeCuero;
    }

    getDescripcion(): string {
        return 'Una protección ligera de cuero. Al equiparla mejora tu clase de armadura sin dejar de ser un equipo flexible.';
    }
}
