import { Objeto } from "./Objeto";
import { Espada } from "./objetos/Espada";
import { Arco } from "./objetos/Arco";
import { Martillo } from "./objetos/Martillo";
import { Taza } from "./objetos/Taza";
import { ArmaduraDeCuero } from "./objetos/ArmaduraDeCuero";
import { ArmaduraDePlacas } from "./objetos/ArmaduraDePlacas";

/**
 * Constructor sin argumentos de un `Objeto` concreto.
 */
type ConstructorDeObjeto = new () => Objeto;

/**
 * Fábrica de objetos (patrón Factory). Reconstruye una instancia viva de
 * `Objeto` a partir de su **id** (su nombre), de modo que la persistencia sólo
 * necesite guardar ids: el comportamiento (estrategias, decoradores de equipo)
 * es código, no estado, y se reconstruye junto con el objeto.
 *
 * Mapea los objetos existentes del dominio: `espada`, `taza`, `armadura de
 * cuero` y `armadura de placas`.
 */
export default class ObjetoFactory {
    /** id (nombre del objeto) → constructor concreto. */
    private static readonly registro: Record<string, ConstructorDeObjeto> = {
        'espada': Espada,
        'arco': Arco,
        'martillo': Martillo,
        'taza': Taza,
        'armadura de cuero': ArmaduraDeCuero,
        'armadura de placas': ArmaduraDePlacas
    };

    /**
     * Crea un `Objeto` a partir de su id. Devuelve `undefined` si el id no está
     * registrado (deserialización tolerante: un id desconocido de un doc viejo
     * o de otra versión no debe tumbar la carga).
     */
    public static crear(id: string): Objeto | undefined {
        const constructor = ObjetoFactory.registro[id];
        if (!constructor) {
            return undefined;
        }
        return new constructor();
    }
}
