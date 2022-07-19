import { Personaje } from "../Personaje/Personaje";
import { PersonajeJugable } from "../Personaje/personajes/Jugador";
import ILugar from "./Lugar/ILugar";
import Bar from "./Lugar/lugares/Bar";

export class Escenario {
    private static escenario: Escenario;

    lugar: ILugar = new Bar();

    public static getInstance(): Escenario {
        if (!Escenario.escenario) {
            Escenario.escenario = new Escenario();
        }
        return Escenario.escenario
    }

    public getLugar(): ILugar {
        return this.lugar
    }

    public getEscenario(): string {
        return `
            Personaje: ${PersonajeJugable.getInstance().getNombre()}
            Clase de armadura: ${PersonajeJugable.getInstance().claseDeArmadura()}
            Lugar: ${this.getLugar().getNombre()}
            Personas: ${this.getLugar().getPersonajes().map((personaje) => personaje.getNombre())}
            Objetos: ${this.getLugar().getObjetos().map((objeto) => objeto.getNombre())}
        `;
    }
}
