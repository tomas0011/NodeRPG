import { Inventario } from "../../Contenedor/Inventario";
import { ArmaduraDecorador } from "../../Objeto/objetos/Armadura/ArmaduraDecorador";
import { Personaje } from "../Personaje";

export class PersonajeJugable extends Personaje {
    private static personaje: PersonajeJugable
    
    public static getInstance(): PersonajeJugable {
        if (!PersonajeJugable.personaje) {
            PersonajeJugable.personaje = new PersonajeJugable(10);
        }
        return PersonajeJugable.personaje
    }

    getNombre(): string {
        return 'Tomas'
    }

    equiparArmadura(armadura: any): void {
        PersonajeJugable.personaje = new armadura(PersonajeJugable.personaje)
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
