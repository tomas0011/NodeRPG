import ILugar from "./Lugar/ILugar";
import Bar from "./Lugar/lugares/Bar";

/**
 * Constructor sin argumentos de un `ILugar` concreto.
 */
type ConstructorDeLugar = new () => ILugar;

/**
 * Fábrica de lugares (patrón Factory). Reconstruye el `ILugar` de una run a
 * partir de su `lugarId`. El mapa NO se serializa entero: con `lugarId` (y, en
 * fases futuras, la `semilla`) se reconstruye el lugar de forma determinista.
 *
 * Por ahora sólo existe `bar`; la generación procedural real es Fase 3.
 */
export default class LugarFactory {
    /** Id por defecto del lugar inicial de una run. */
    public static readonly LUGAR_INICIAL: string = 'bar';

    /** lugarId → constructor concreto. */
    private static readonly registro: Record<string, ConstructorDeLugar> = {
        'bar': Bar
    };

    /**
     * Crea un `ILugar` a partir de su id. Si el id no está registrado, cae al
     * lugar inicial (`bar`) para no romper la carga de un doc tolerante.
     */
    public static crear(lugarId: string): ILugar {
        const constructor = LugarFactory.registro[lugarId];
        if (!constructor) {
            return new Bar();
        }
        return new constructor();
    }
}
