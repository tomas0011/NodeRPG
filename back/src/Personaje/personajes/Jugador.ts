import { Inventario } from "../../Contenedor/Inventario";
import IPersonaje from "../IPersonaje";
import { Personaje } from "../Personaje";

type ModificacionDePersonaje = new (portadorDeArmadura: IPersonaje) => Personaje;

export class PersonajeJugable extends Personaje {
    private static personaje: Personaje

    public static getInstance(): Personaje {
        if (!PersonajeJugable.personaje) {
            PersonajeJugable.personaje = new PersonajeJugable(10);
        }
        return PersonajeJugable.personaje
    }

    public static setInstance(newConstructor: ModificacionDePersonaje): Personaje {
        PersonajeJugable.personaje = new newConstructor(PersonajeJugable.getInstance());
        return PersonajeJugable.personaje
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
