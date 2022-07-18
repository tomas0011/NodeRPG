import { Inventario } from "../../Contenedor/Inventario";
import { Personaje } from "../Personaje";

export class Cantinero extends Personaje {  
    getVidaMaxima(): number {
        return this.vidaMaxima
    }

    getVidaActual(): number {
        return this.vidaActual
    }

    getInventario(): Inventario {
        return this.inventario
    }

    getNombre() {
        return 'Cantinero Pepe'
    }
} 
