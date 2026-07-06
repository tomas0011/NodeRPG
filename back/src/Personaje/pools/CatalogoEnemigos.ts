import { Personaje } from "../Personaje";
import { Bandido } from "../personajes/Bandido";
import { Ogro } from "../personajes/Ogro";
import { Rata } from "../personajes/Rata";

/** Constructor sin argumentos de un `Personaje` enemigo. */
type ConstructorDeEnemigo = new () => Personaje;

/**
 * Catálogo/pool de enemigos (patrón Factory + pool). Única fuente de los tipos
 * de enemigo del juego: el id de enemigo → su constructor. En 3f las salas
 * eligen de aquí su población de forma **determinista por el id de sala**; en
 * 3h la generación procedural muestreará estos pools por semilla.
 *
 * Añadir un enemigo = crear su subclase de `Personaje` + registrarlo aquí.
 */
export default class CatalogoEnemigos {
    /** id de enemigo → constructor concreto. */
    private static readonly registro: Record<string, ConstructorDeEnemigo> = {
        rata: Rata,
        bandido: Bandido,
        ogro: Ogro
    };

    /** Crea una instancia nueva del enemigo `id`, o `undefined` si no existe. */
    public static crear(id: string): Personaje | undefined {
        const constructor = CatalogoEnemigos.registro[id];
        return constructor ? new constructor() : undefined;
    }

    /**
     * Resuelve el id lógico de un enemigo ya instanciado para persistir su
     * eliminación por `lugarId`.
     */
    public static resolverId(enemigo: Personaje): string | undefined {
        for (const id of Object.keys(CatalogoEnemigos.registro)) {
            const constructor = CatalogoEnemigos.registro[id];
            if (enemigo instanceof constructor) {
                return id;
            }
        }
        return undefined;
    }

    /** Ids de todos los enemigos registrados (para 3h y diagnósticos). */
    public static ids(): string[] {
        return Object.keys(CatalogoEnemigos.registro);
    }
}
