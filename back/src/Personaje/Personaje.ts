import { Inventario } from "../Contenedor/Inventario";

export abstract class Personaje{
    vidaMaxima: number;
    vidaActual: Number;
    inventario: Inventario = new Inventario();
    constructor(vidaMaxima: number){
        this.vidaMaxima   = vidaMaxima;
        this.vidaActual = vidaMaxima;
    }

    getVidaMaxima(){
        return this.vidaMaxima
    }
    getVidaActual(){
        return this.vidaActual
    }
    getInventario(){
        return this.inventario
    }

}
