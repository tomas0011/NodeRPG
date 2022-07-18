import { Inventario } from "../Contenedor/Inventario";
import { IPortadorArmadura } from "../Objeto/objetos/Armadura/IPortadorDeArmadura";

export class Personaje implements IPortadorArmadura{
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario
    destreza: number =  1;

    constructor(vidaMaxima: number = 10){
        this.vidaMaxima = vidaMaxima
        this.vidaActual = vidaMaxima
        this.inventario = new Inventario()
    }

    getDestreza(): number {
        return this.destreza;
    }
    
    claseDeArmadura(): number {
        return 10 + this.getDestreza();
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
