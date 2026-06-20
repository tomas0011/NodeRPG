import type IPersonaje from "../../Personaje/IPersonaje";
import type IEstrategiaDeAtaque from "./IEstrategiaDeAtaque";
import type { ResultadoAtaque } from "./IEstrategiaDeAtaque";

/**
 * Estrategia del arco: a distancia, **escala con la destreza** del atacante.
 *
 * Daño = `dadoDeGolpe + destreza * 3`, mitigado por una fracción de la clase de
 * armadura del objetivo (`floor(CA / 3)`). Daño mínimo 1. Con destreza alta
 * supera a la espada; con destreza baja rinde parecido o peor.
 */
export default class ArcoStrategy implements IEstrategiaDeAtaque {
    private static readonly FACTOR_DESTREZA = 3;

    resolver(atacante: IPersonaje, objetivo: IPersonaje): ResultadoAtaque {
        const ataque = atacante.dadoDeGolpe() + atacante.getDestreza() * ArcoStrategy.FACTOR_DESTREZA;
        const mitigacion = Math.floor(objetivo.claseDeArmadura() / 3);
        const daño = Math.max(1, ataque - mitigacion);
        objetivo.recibirDaño(daño);
        return {
            daño,
            descripcion: `Disparas una flecha certera por ${daño} de daño.`
        };
    }
}
