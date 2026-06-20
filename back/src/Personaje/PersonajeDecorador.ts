import { Inventario } from "../Contenedor/Inventario";
import IPersonaje, { Recompensa, ResultadoXp } from "./IPersonaje";

export default class PersonajeDecorador implements IPersonaje {
    portadorDeArmadura: IPersonaje ;
    destreza!: number;
    vidaMaxima!: number;
    vidaActual!: number;
    inventario!: Inventario;
    oro!: number;
    xp!: number;
    nivel!: number;

    constructor(portadorDeArmadura: IPersonaje){
        this.portadorDeArmadura = portadorDeArmadura;
    }

    getDestreza(){
        return this.portadorDeArmadura.getDestreza();
    }

    modificarDestreza(delta: number): number {
        return this.portadorDeArmadura.modificarDestreza(delta);
    }

    getOro(): number {
        return this.portadorDeArmadura.getOro();
    }

    ganarOro(cantidad: number): number {
        return this.portadorDeArmadura.ganarOro(cantidad);
    }

    gastarOro(cantidad: number): boolean {
        return this.portadorDeArmadura.gastarOro(cantidad);
    }

    getRecompensa(): Recompensa {
        return this.portadorDeArmadura.getRecompensa();
    }

    getBotin(): string[] {
        return this.portadorDeArmadura.getBotin();
    }

    getXp(): number {
        return this.portadorDeArmadura.getXp();
    }

    ganarXp(cantidad: number): ResultadoXp {
        return this.portadorDeArmadura.ganarXp(cantidad);
    }

    getNivel(): number {
        return this.portadorDeArmadura.getNivel();
    }

    getXpActual(): number {
        return this.portadorDeArmadura.getXpActual();
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
