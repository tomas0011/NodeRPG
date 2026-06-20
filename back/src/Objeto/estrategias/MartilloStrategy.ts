import type IPersonaje from "../../Personaje/IPersonaje";
import type IEstrategiaDeAtaque from "./IEstrategiaDeAtaque";
import type { ResultadoAtaque } from "./IEstrategiaDeAtaque";

/**
 * Estrategia del martillo: daño alto que **rompe armadura**.
 *
 * Daño = `dadoDeGolpe + destreza + BONUS`, **ignorando por completo** la clase
 * de armadura del objetivo (a diferencia de espada y arco, que la mitigan). Por
 * eso contra objetivos de armadura alta el martillo supera a la espada: no paga
 * el peaje de mitigación.
 */
export default class MartilloStrategy implements IEstrategiaDeAtaque {
    private static readonly BONUS_IMPACTO = 5;

    resolver(atacante: IPersonaje, objetivo: IPersonaje): ResultadoAtaque {
        const daño = Math.max(
            1,
            atacante.dadoDeGolpe() + atacante.getDestreza() + MartilloStrategy.BONUS_IMPACTO
        );
        objetivo.recibirDaño(daño);
        return {
            daño,
            descripcion: `Descargas el martillo rompiendo la armadura por ${daño} de daño.`
        };
    }
}
