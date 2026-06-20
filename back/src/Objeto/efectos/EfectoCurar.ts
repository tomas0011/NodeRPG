import type IPersonaje from "../../Personaje/IPersonaje";
import type IEfecto from "./IEfecto";
import type { ResultadoEfecto } from "./IEfecto";

/**
 * Efecto de curación: restaura `cantidad` puntos de vida **sin exceder** la vida
 * máxima del objetivo.
 *
 * Fórmula determinista: `nuevaVida = min(vidaMaxima, vidaActual + cantidad)`; lo
 * curado es la diferencia real (puede ser menor que `cantidad` si ya estaba casi
 * lleno, o 0 si estaba al máximo). Se aplica vía `recibirDaño(-curado)`, que
 * delega correctamente a través de la cadena de decoradores hasta el jugador
 * base.
 */
export default class EfectoCurar implements IEfecto {
    private readonly cantidad: number;

    constructor(cantidad: number) {
        this.cantidad = cantidad;
    }

    aplicar(objetivo: IPersonaje): ResultadoEfecto {
        const vidaActual = objetivo.getVidaActual();
        const vidaMaxima = objetivo.getVidaMaxima();
        const nuevaVida = Math.min(vidaMaxima, vidaActual + this.cantidad);
        const curado = nuevaVida - vidaActual;
        if (curado > 0) {
            objetivo.recibirDaño(-curado);
        }
        return {
            descripcion: `Recuperas ${curado} de vida (${nuevaVida}/${vidaMaxima}).`,
            vidaDelta: curado,
            destrezaDelta: 0
        };
    }
}
