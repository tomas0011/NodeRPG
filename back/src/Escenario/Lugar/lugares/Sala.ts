import { Objeto } from "../../../Objeto/Objeto";
import ObjetoFactory from "../../../Objeto/ObjetoFactory";
import { Personaje } from "../../../Personaje/Personaje";
import CatalogoOcupantes from "../../../Personaje/pools/CatalogoOcupantes";
import MapaDeRun from "../../MapaDeRun";
import MapaDeRunRegistry from "../../MapaDeRunRegistry";
import { DefinicionDeSala } from "../../MapaLayout";
import ILugar from "../ILugar";

/**
 * Sala base de la run (3f/3h). Reconstruye su contenido —nombre, ocupantes
 * (enemigos/NPC), objetos y salidas— de forma **determinista a partir de su
 * `lugarId` dentro del `MapaDeRun` de su run** (layout fijo o mapa generado por
 * semilla).
 *
 * El mapa **no se serializa**: con `semilla` + `lugarId`, `LugarFactory.crear`
 * resuelve el `MapaDeRun` (vía `MapaDeRunRegistry`, cacheado por semilla) y la
 * sala se reconstruye idéntica tras una recarga, sin serializar el mapa entero.
 * Los ocupantes/objetos se instancian nuevos.
 *
 * Subclases concretas (combate/descanso/tienda/jefe) existen para tipar la
 * intención y permitir comportamiento por tipo; su contenido sigue saliendo del
 * mapa para mantener una única fuente.
 */
export default abstract class Sala implements ILugar {
    protected readonly definicion: DefinicionDeSala;
    protected readonly personajes: Personaje[];
    protected readonly objetos: Objeto[];

    /**
     * @param lugarId id de la sala en el mapa.
     * @param mapa mapa de la run (layout fijo o generado por semilla). Por
     *   compatibilidad, si no se pasa cae al layout fijo (semilla centinela).
     */
    constructor(lugarId: string, mapa: MapaDeRun = MapaDeRunRegistry.obtener(MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO)) {
        const definicion = mapa.obtener(lugarId);
        if (!definicion) {
            throw new Error(`Sala desconocida: ${lugarId}`);
        }
        this.definicion = definicion;
        this.personajes = this.instanciarOcupantes(definicion);
        this.objetos = this.instanciarObjetos(definicion);
    }

    getNombre(): string {
        return this.definicion.nombre;
    }

    getPersonajes(): Personaje[] {
        return this.personajes;
    }

    getObjetos(): Objeto[] {
        return this.objetos;
    }

    /** Salidas de la sala: dirección → `lugarId` destino (copia, no el array vivo). */
    getSalidas(): Record<string, string> {
        return { ...this.definicion.salidas };
    }

    /** Id de esta sala (lo que se serializa como `lugarId`). */
    getId(): string {
        return this.definicion.id;
    }

    /** Instancia los ocupantes (enemigos/NPC) desde sus ids del mapa. */
    private instanciarOcupantes(definicion: DefinicionDeSala): Personaje[] {
        const personajes: Personaje[] = [];
        for (const id of definicion.ocupantes) {
            const ocupante = CatalogoOcupantes.crear(id);
            if (ocupante) {
                personajes.push(ocupante);
            }
        }
        return personajes;
    }

    /** Instancia los objetos de la sala desde sus ids del mapa. */
    private instanciarObjetos(definicion: DefinicionDeSala): Objeto[] {
        const objetos: Objeto[] = [];
        for (const id of definicion.objetos) {
            const objeto = ObjetoFactory.crear(id);
            if (objeto) {
                objetos.push(objeto);
            }
        }
        return objetos;
    }
}
