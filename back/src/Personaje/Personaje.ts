import { Inventario } from "../Contenedor/Inventario";

export class Personaje {
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario

    constructor(vidaMaxima: number){
        this.vidaMaxima = vidaMaxima
        this.vidaActual = vidaMaxima
        this.inventario = new Inventario()
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

    recibirDaño(daño: number): number {
        this.vidaActual -= daño;
        return daño
    }
} 
