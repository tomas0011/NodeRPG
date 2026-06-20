import type IPersonaje from "../../Personaje/IPersonaje";

/**
 * Resultado de resolver un ataque: el daño ya aplicado al objetivo y una
 * descripción humana de cómo se golpeó (para la consola/TUI).
 */
export interface ResultadoAtaque {
    daño: number;
    descripcion: string;
}

/**
 * Estrategia de ataque de un arma (patrón Strategy). Encapsula **cómo** un arma
 * combina los métodos de combate del personaje (`dadoDeGolpe()`, `destreza`,
 * `claseDeArmadura()`) para producir daño, y lo **aplica** al objetivo vía
 * `recibirDaño()`.
 *
 * Es una responsabilidad distinta del Decorator de equipo: el Decorator decide
 * los *stats* del portador al equiparse; la estrategia decide *cómo golpea* el
 * arma. Añadir un arma nueva = una estrategia nueva, sin tocar `Atacar`.
 *
 * Las estrategias son deterministas: con los mismos stats de atacante y objetivo
 * producen siempre el mismo daño (`dadoDeGolpe()` hoy es fijo). Si en el futuro
 * `dadoDeGolpe()` introduce azar, debe hacerlo con una semilla inyectable para
 * conservar el determinismo de los tests.
 */
export interface IEstrategiaDeAtaque {
    /**
     * Calcula el daño según las reglas del arma y lo aplica al objetivo.
     * @param atacante quien golpea (jugador decorado).
     * @param objetivo quien recibe el golpe (NPC de la sala).
     */
    resolver(atacante: IPersonaje, objetivo: IPersonaje): ResultadoAtaque;
}

export default IEstrategiaDeAtaque;
