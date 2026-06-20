import { Inventario } from "../../Contenedor/Inventario";
import { Recompensa } from "../IPersonaje";
import { Personaje } from "../Personaje";

/**
 * Enemigo débil de relleno. Poca vida, golpe flojo, armadura baja; botín
 * pequeño. Determinista, sin azar.
 */
export class Rata extends Personaje {
    constructor() {
        super(4);
    }

    getVidaMaxima(): number {
        return this.vidaMaxima;
    }

    getVidaActual(): number {
        return this.vidaActual;
    }

    getInventario(): Inventario {
        return this.inventario;
    }

    getNombre(): string {
        return 'Rata';
    }

    dadoDeGolpe(): number {
        return 2;
    }

    claseDeArmadura(): number {
        return 8;
    }

    getRecompensa(): Recompensa {
        return { oro: 3, plata: 1 };
    }

    /** XP que otorga al morir (3i). Pequeña, acorde a su dificultad. */
    getXp(): number {
        return 5;
    }
}
