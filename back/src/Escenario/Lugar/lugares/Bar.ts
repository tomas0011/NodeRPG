import { Objeto } from "../../../Objeto/Objeto";
import { ArmaduraDeCuero } from "../../../Objeto/objetos/ArmaduraDeCuero";
import { Espada } from "../../../Objeto/objetos/Espada";
import { Taza } from "../../../Objeto/objetos/Taza";
import { Personaje } from "../../../Personaje/Personaje";
import { Cantinero } from "../../../Personaje/personajes/Cantinero";
import ILugar from "../ILugar";

class Bar implements ILugar {
    static bar: Bar

    personajes: Personaje[] = [
        new Cantinero()
    ];

    objetos: Objeto[] = [
        new Taza(),
        new Espada(),
        new ArmaduraDeCuero()
    ];

    public static getInstance() {
        if (!Bar.bar) {
            Bar.bar = new Bar()
        }
        return Bar.bar
    }

    getNombre(): string {
        return 'Bar Puerco Verde'
    }

    getPersonajes(): Personaje[] {
        return this.personajes
    }

    getObjetos(): Objeto[] {
        return this.objetos
    }
}

export default Bar;
