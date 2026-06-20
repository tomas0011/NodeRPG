import type IPersonaje from "../../Personaje/IPersonaje";

/**
 * Resultado de aplicar un efecto consumible: los deltas ya aplicados al objetivo
 * y una descripción humana para la consola/TUI.
 *
 * - `descripcion`: texto humano de lo que ocurrió.
 * - `vidaDelta` / `destrezaDelta`: cambio neto (puede ser 0) que el efecto
 *   produjo en el objetivo, para que `usar` reporte números exactos.
 */
export interface ResultadoEfecto {
    descripcion: string;
    vidaDelta: number;
    destrezaDelta: number;
}

/**
 * Efecto de un objeto consumible (patrón Strategy). Encapsula **qué le pasa** al
 * objetivo cuando se usa el ítem (curar, envenenar, mejorar un stat) y lo
 * **aplica** sobre él.
 *
 * Es la **tercera responsabilidad** del modelo de objetos, distinta y separada
 * de las otras dos:
 * - Decorator de equipo (`getModificacion`): stats del portador al **equiparse**.
 * - Strategy de ataque (`getEstrategiaDeAtaque`): **cómo golpea** un arma.
 * - Strategy de efecto (`getEfecto`): **qué hace** un consumible al **usarse**.
 *
 * Añadir un consumible nuevo = una clase `IEfecto` nueva, sin tocar `UsarObjeto`
 * (principio abierto-cerrado): el comando `usar` no conoce qué hace cada poción,
 * sólo delega en `aplicar`.
 *
 * Los efectos son **deterministas**: con el mismo objetivo producen siempre el
 * mismo resultado. Si en el futuro alguno introdujera azar, debe hacerlo con una
 * semilla inyectable para conservar el determinismo de los tests.
 */
export interface IEfecto {
    /**
     * Aplica el efecto sobre el objetivo y devuelve los deltas y una descripción.
     * @param objetivo personaje que consume el ítem (el jugador de la run).
     */
    aplicar(objetivo: IPersonaje): ResultadoEfecto;
}

export default IEfecto;
