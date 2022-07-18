import { Contenedor } from "./Contenedor";

export class Inventario extends Contenedor {
    override puedeContener(contenedor: Contenedor): Boolean {
        return true
    };
} 
