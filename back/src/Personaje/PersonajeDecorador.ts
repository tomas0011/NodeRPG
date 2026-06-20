import { Inventario } from "../Contenedor/Inventario";
import IPersonaje from "./IPersonaje";

export default class PersonajeDecorador implements IPersonaje {
    portadorDeArmadura: IPersonaje ;
    destreza!: number;
    vidaMaxima!: number;
    vidaActual!: number;
    inventario!: Inventario;
    oro!: number;

    constructor(portadorDeArmadura: IPersonaje){
        this.portadorDeArmadura = portadorDeArmadura;
    }

    getDestreza(){
        return this.portadorDeArmadura.getDestreza();
    }

    getOro(): number {
        return this.portadorDeArmadura.getOro();
    }

    claseDeArmadura(): number { 
        return this.portadorDeArmadura.claseDeArmadura()
    }

    getVidaMaxima(): number {
        return this.portadorDeArmadura.getVidaMaxima()
    }

    getVidaActual(): number {
        return this.portadorDeArmadura.getVidaActual()
    }

    getInventario(): Inventario {
        return this.portadorDeArmadura.getInventario()
    }

    recibirDaño(daño: number): number {
        return this.portadorDeArmadura.recibirDaño(daño)
    }
    
    getNombre(): string {
        return this.portadorDeArmadura.getNombre()
    }

    dadoDeGolpe(): number {
        return this.portadorDeArmadura.dadoDeGolpe()
    }
}
