import type IPersonaje from "../../Personaje/IPersonaje";
import type IEfecto from "./IEfecto";
import type { ResultadoEfecto } from "./IEfecto";

/**
 * Efecto de mejora de destreza (buff): sube la destreza del objetivo en
 * `cantidad` dentro de la run.
 *
 * Determinista. Usa `modificarDestreza`, que delega a través de la cadena de
 * decoradores hasta el jugador base (la destreza es un stat mutable de la run,
 * separado del Decorator de equipo). El buff persiste mientras dure la run.
 */
export default class EfectoBuffDestreza implements IEfecto {
    private readonly cantidad: number;

    constructor(cantidad: number) {
        this.cantidad = cantidad;
    }

    aplicar(objetivo: IPersonaje): ResultadoEfecto {
        const antes = objetivo.getDestreza();
        const despues = objetivo.modificarDestreza(this.cantidad);
        const destrezaDelta = despues - antes;
        return {
            descripcion: `Tu destreza sube en ${destrezaDelta} (ahora ${despues}).`,
            vidaDelta: 0,
            destrezaDelta
        };
    }
}
