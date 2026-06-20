import { Contenedor } from "./Contenedor";

export class Inventario extends Contenedor {
    puedeContener(contenedor: Contenedor): boolean {
        return true
    }
}
