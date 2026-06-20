import { Inventario } from "../../Contenedor/Inventario";
import { Personaje } from "../Personaje";

export class PersonajeJugable extends Personaje {
    private nombre: string;

    constructor(nombre: string = 'Tomas', vidaMaxima: number = 10) {
        super(vidaMaxima);
        this.nombre = nombre;
    }

    getNombre(): string {
        return this.nombre;
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
