import type IPersonaje from "../../Personaje/IPersonaje";
import type IEstrategiaDeAtaque from "./IEstrategiaDeAtaque";
import type { ResultadoAtaque } from "./IEstrategiaDeAtaque";

/**
 * Estrategia por defecto: golpear con los puños cuando no hay arma equipada.
 *
 * Daño mínimo: `max(1, floor(dadoDeGolpe / 2))`, sin escalar con destreza ni
 * considerar la armadura del objetivo. Es el peor ataque posible — equipar
 * cualquier arma mejora el daño.
 */
export default class PunosStrategy implements IEstrategiaDeAtaque {
    resolver(atacante: IPersonaje, objetivo: IPersonaje): ResultadoAtaque {
        const daño = Math.max(1, Math.floor(atacante.dadoDeGolpe() / 2));
        objetivo.recibirDaño(daño);
        return {
            daño,
            descripcion: `Golpeas con los puños por ${daño} de daño.`
        };
    }
}
