import type IPersonaje from "../../Personaje/IPersonaje";
import type IEfecto from "./IEfecto";
import type { ResultadoEfecto } from "./IEfecto";

/**
 * Efecto de veneno: resta `cantidad` puntos de vida al objetivo (consumible
 * trampa). Ejemplo de que el Strategy de efecto admite efectos negativos sin
 * tocar el comando `usar`.
 *
 * Determinista. Aplica el daño vía `recibirDaño`, que delega a través de la
 * cadena de decoradores. No cura ni clampa por abajo: la muerte por veneno la
 * gobierna quien lea la vida resultante (fuera de alcance aquí).
 */
export default class EfectoVeneno implements IEfecto {
    private readonly cantidad: number;

    constructor(cantidad: number) {
        this.cantidad = cantidad;
    }

    aplicar(objetivo: IPersonaje): ResultadoEfecto {
        const dañoAplicado = Math.max(0, this.cantidad);
        if (dañoAplicado > 0) {
            objetivo.recibirDaño(dañoAplicado);
        }
        return {
            descripcion: `El veneno te resta ${dañoAplicado} de vida (${objetivo.getVidaActual()}/${objetivo.getVidaMaxima()}).`,
            vidaDelta: -dañoAplicado,
            destrezaDelta: 0
        };
    }
}
