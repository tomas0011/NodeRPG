import { Personaje } from "../Personaje";
import { Cantinero } from "../personajes/Cantinero";
import CatalogoEnemigos from "./CatalogoEnemigos";

/** Constructor sin argumentos de un `Personaje` ocupante (NPC no enemigo). */
type ConstructorDeNpc = new () => Personaje;

/**
 * Pool de **ocupantes** de las salas: unifica los enemigos (`CatalogoEnemigos`)
 * con los NPC no combatientes (p. ej. `Cantinero`). El `MapaLayout` referencia
 * a los ocupantes por id; esta clase resuelve cada id a una instancia nueva de
 * `Personaje`.
 *
 * Separación: `CatalogoEnemigos` es el pool que 3h muestreará para poblar salas
 * de combate; los NPC fijos (cantinero) viven aquí. Buscar primero en enemigos
 * y caer a NPC mantiene un único punto de resolución para `LugarFactory`.
 */
export default class CatalogoOcupantes {
    /** id de NPC no enemigo → constructor. */
    private static readonly npcs: Record<string, ConstructorDeNpc> = {
        cantinero: Cantinero
    };

    /**
     * Crea una instancia nueva del ocupante `id` (enemigo o NPC), o `undefined`
     * si el id no está registrado en ningún pool.
     */
    public static crear(id: string): Personaje | undefined {
        const enemigo = CatalogoEnemigos.crear(id);
        if (enemigo) {
            return enemigo;
        }
        const constructor = CatalogoOcupantes.npcs[id];
        return constructor ? new constructor() : undefined;
    }

    /**
     * Resuelve el id lógico del ocupante ya instanciado (enemigo o NPC).
     */
    public static resolverId(ocupante: Personaje): string | undefined {
        const enemigoId = CatalogoEnemigos.resolverId(ocupante);
        if (enemigoId) {
            return enemigoId;
        }

        for (const id of Object.keys(CatalogoOcupantes.npcs)) {
            const constructor = CatalogoOcupantes.npcs[id];
            if (ocupante instanceof constructor) {
                return id;
            }
        }

        return undefined;
    }
}
