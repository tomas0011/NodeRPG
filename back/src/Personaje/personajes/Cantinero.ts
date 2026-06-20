import { Inventario } from "../../Contenedor/Inventario";
import { Recompensa } from "../IPersonaje";
import { Personaje } from "../Personaje";

export class Cantinero extends Personaje {
    getVidaMaxima(): number {
        return this.vidaMaxima
    }

    getVidaActual(): number {
        return this.vidaActual
    }

    getInventario(): Inventario {
        return this.inventario
    }

    getNombre() {
        return 'Cantinero Pepe'
    }

    /**
     * Botín del Cantinero al ser derrotado: 15 de oro (run) y 10 de plata (a
     * bancar al perfil). Valores deterministas, sin azar.
     */
    getRecompensa(): Recompensa {
        return { oro: 15, plata: 10 };
    }
}
