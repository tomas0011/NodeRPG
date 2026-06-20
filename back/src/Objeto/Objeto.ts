import type { IEstrategiaDeAtaque } from "./estrategias/IEstrategiaDeAtaque";
import type { IEfecto } from "./efectos/IEfecto";

export abstract class Objeto{
    nombre: string;
    clase: string;

    constructor(nombre: string, clase: string){
        this.nombre = nombre;
        this.clase = clase;
    }

    abstract getModificacion(): any

    /**
     * Estrategia de ataque del objeto cuando se usa como arma (patrón Strategy).
     * Por defecto `undefined`: el objeto no es un arma. Las armas (p. ej.
     * `Espada`, `Arco`, `Martillo`) sobreescriben este método y devuelven su
     * estrategia. Responsabilidad **separada** de `getModificacion()` (Decorator
     * de equipo): un objeto puede modificar stats al equiparse, atacar, ambas o
     * ninguna.
     */
    getEstrategiaDeAtaque(): IEstrategiaDeAtaque | undefined {
        return undefined;
    }

    /**
     * Efecto del objeto cuando se **consume** con `usar` (patrón Strategy de
     * efecto). Por defecto `undefined`: el objeto no es consumible y `usar` lo
     * rechaza. Los consumibles (p. ej. `PocionDeCuracion`, `PocionDeDestreza`)
     * sobreescriben este método y devuelven su `IEfecto`.
     *
     * Tercera responsabilidad **separada** de `getModificacion()` (Decorator de
     * equipo) y `getEstrategiaDeAtaque()` (Strategy de ataque): un objeto puede
     * equiparse, atacar, consumirse, varias de esas, o ninguna.
     */
    getEfecto(): IEfecto | undefined {
        return undefined;
    }

    getNombre(){
        return this.nombre;
    }
    
    getClase(){
        return this.clase;
    }
}
