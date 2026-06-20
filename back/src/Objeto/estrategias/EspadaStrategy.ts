import type IPersonaje from "../../Personaje/IPersonaje";
import type IEstrategiaDeAtaque from "./IEstrategiaDeAtaque";
import type { ResultadoAtaque } from "./IEstrategiaDeAtaque";

/**
 * Estrategia de la espada: melee equilibrado.
 *
 * Daño = `dadoDeGolpe + destreza`, mitigado por una fracción de la clase de
 * armadura del objetivo (`floor(CA / 3)`). Daño mínimo 1. Sensible a la
 * armadura (a diferencia del martillo, que la ignora) pero más constante que el
 * arco (que escala fuerte con destreza).
 */
export default class EspadaStrategy implements IEstrategiaDeAtaque {
    resolver(atacante: IPersonaje, objetivo: IPersonaje): ResultadoAtaque {
        const ataque = atacante.dadoDeGolpe() + atacante.getDestreza();
        const mitigacion = Math.floor(objetivo.claseDeArmadura() / 3);
        const daño = Math.max(1, ataque - mitigacion);
        objetivo.recibirDaño(daño);
        return {
            daño,
            descripcion: `Asestas un tajo de espada por ${daño} de daño.`
        };
    }
}
