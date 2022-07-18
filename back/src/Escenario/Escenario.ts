import { Personaje } from "../Personaje/Personaje";
import { PersonajeJugable } from "../Personaje/personajes/Jugador";
import ILugar from "./Lugar/ILugar";
import Bar from "./Lugar/lugares/Bar";

export class Escenario {
    private static escenario: Escenario | null = null

    private constructor () {}

    personaje: Personaje = new PersonajeJugable();
    lugar: ILugar = new Bar();

    public static getInstance(): Escenario {
        if (!Escenario.escenario) {
            Escenario.escenario = new Escenario();
        }
        return Escenario.escenario
    }

    private getPersonaje(): Personaje {
        return this.personaje
    }

    private getLugar(): ILugar {
        return this.lugar
    }

    public getEscenario(): string {
        return `
            Personaje: ${this.getPersonaje().getNombre()}
            Lugar: ${this.getLugar().getNombre()}
            Personas: ${this.getLugar().getPersonajes().map((personaje) => personaje.getNombre())}
        `;
    }
}
