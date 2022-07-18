import { Inventario } from "../../Contenedor/Inventario";
import { Personaje } from "../Personaje";

export class PersonajeJugable implements Personaje {
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario

    constructor(vidaMaxima = 10){
        this.vidaMaxima = vidaMaxima
        this.vidaActual = vidaMaxima
    }

    getNombre(): string {
        return 'Tomas'
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
} 
