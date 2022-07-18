import { Inventario } from "../Contenedor/Inventario";
import { IPortadorArmadura } from "../Objeto/objetos/Armadura/Armadura";

export class Personaje implements IPortadorArmadura{
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario

    constructor(vidaMaxima: number = 10){
        this.vidaMaxima = vidaMaxima
        this.vidaActual = vidaMaxima
        this.inventario = new Inventario()
    }

    claseDeArmadura(destreza: number): number {
        return 10 + destreza;
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

    getNombre(){
        return '';
    }
} 
