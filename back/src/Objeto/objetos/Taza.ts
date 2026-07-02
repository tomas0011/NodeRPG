import { Objeto } from "../Objeto";

export class Taza extends Objeto {
    constructor() {
        super('taza', 'objeto')
    }

    getModificacion() {}

    getDescripcion(): string {
        return 'Una taza común sin propiedades especiales. Puedes guardarla como curiosidad, pero no ofrece efectos ni equipo.';
    }
} 
