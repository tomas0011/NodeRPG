import { Inventario } from "../../Contenedor/Inventario";
import { Recompensa } from "../IPersonaje";
import { Personaje } from "../Personaje";

/**
 * Enemigo estándar de las salas de combate. Vida y golpe medios, algo de
 * armadura; botín moderado. Determinista, sin azar.
 */
export class Bandido extends Personaje {
    constructor() {
        super(12);
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
        return 'Bandido';
    }

    dadoDeGolpe(): number {
        return 5;
    }

    claseDeArmadura(): number {
        return 12;
    }

    getRecompensa(): Recompensa {
        return { oro: 12, plata: 5 };
    }

    /** XP que otorga al morir (3i). Media, acorde a su dificultad. */
    getXp(): number {
        return 20;
    }

    /**
     * Botín encontrable del Bandido: una poción de curación. Determinista (mismo
     * loot siempre). Son objetos, distintos del oro/plata de `getRecompensa()`.
     */
    getBotin(): string[] {
        return ['poción de curación'];
    }
}
