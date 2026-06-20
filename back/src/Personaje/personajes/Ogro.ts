import { Inventario } from "../../Contenedor/Inventario";
import { Recompensa } from "../IPersonaje";
import { Personaje } from "../Personaje";

/**
 * Jefe de la run. Mucha vida, golpe fuerte y armadura alta; botín grande. Vive
 * en la `SalaDelJefe`. Determinista, sin azar.
 */
export class Ogro extends Personaje {
    constructor() {
        super(30);
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
        return 'Ogro';
    }

    dadoDeGolpe(): number {
        return 9;
    }

    claseDeArmadura(): number {
        return 15;
    }

    getRecompensa(): Recompensa {
        return { oro: 50, plata: 25 };
    }

    /** XP que otorga al morir (3i). Alta (es el jefe), acorde a su dificultad. */
    getXp(): number {
        return 100;
    }

    /**
     * Botín encontrable del jefe: equipo bueno —armadura de placas y martillo—.
     * Determinista (mismo loot siempre). Son objetos, distintos del oro/plata de
     * `getRecompensa()` y de los catálogos de tienda.
     */
    getBotin(): string[] {
        return ['armadura de placas', 'martillo'];
    }
}
