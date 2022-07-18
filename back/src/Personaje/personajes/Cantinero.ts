import { Inventario } from "../../Contenedor/Inventario";
import { Personaje } from "../Personaje";

export class Cantinero implements Personaje {
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario

    constructor(vidaMaxima = 10){
        this.vidaMaxima = vidaMaxima
        this.vidaActual = vidaMaxima
    }

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
