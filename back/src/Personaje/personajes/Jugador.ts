import { Inventario } from "../../Contenedor/Inventario";
import { Personaje } from "../Personaje";

export class PersonajeJugable implements Personaje {
    private static personaje: PersonajeJugable
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario

    public static getInstance(): PersonajeJugable {
        if (!PersonajeJugable.personaje) {
            PersonajeJugable.personaje = new PersonajeJugable(10);
        }
        return PersonajeJugable.personaje
    }

    private constructor(vidaMaxima: number){
        this.vidaMaxima = vidaMaxima
        this.vidaActual = vidaMaxima
        this.inventario = new Inventario()
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
