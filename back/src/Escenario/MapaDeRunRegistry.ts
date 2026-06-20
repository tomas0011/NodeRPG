import RunGenerator from "../Game/RunGenerator";
import MapaDeRun from "./MapaDeRun";
import MapaLayout, { DefinicionDeSala, TipoDeSala } from "./MapaLayout";

/**
 * Adaptador del **layout fijo** de 3f (`MapaLayout`) como `MapaDeRun`. Es el
 * **caso particular** asociado a la semilla centinela `SEMILLA_LAYOUT_FIJO`: el
 * grafo estático y conocido que usan los tests deterministas y el contenido fijo
 * del bar. El flujo normal (semilla != centinela) usa el mapa generado.
 */
class MapaLayoutAdapter implements MapaDeRun {
    lugarInicial(): string {
        return MapaLayout.LUGAR_INICIAL;
    }

    obtener(lugarId: string): DefinicionDeSala | undefined {
        return MapaLayout.obtener(lugarId);
    }

    ids(): string[] {
        return MapaLayout.ids();
    }

    salidas(lugarId: string): Record<string, string> {
        return MapaLayout.salidas(lugarId);
    }

    lootDeTipo(tipo: TipoDeSala): string[] {
        return MapaLayout.lootDeTipo(tipo);
    }
}

/**
 * **Registro/caché de mapas por semilla (3h).** Único punto que resuelve la
 * `semilla` de una run a su `MapaDeRun`, **cacheando** el mapa generado para no
 * regenerarlo en cada consulta (`LugarFactory`/`Mover`/`Sala` lo piden muchas
 * veces durante un request). Como la generación es determinista por semilla, el
 * caché es seguro: misma semilla ⇒ mismo mapa.
 *
 * **Semilla centinela `SEMILLA_LAYOUT_FIJO` (0):** resuelve al **layout fijo** de
 * 3f (caso particular para tests y para el contenido fijo del bar). Cualquier
 * otra semilla se delega a `RunGenerator.generar` (flujo normal procedural). Así
 * los tests que omiten semilla (caen al centinela) siguen viendo el grafo fijo,
 * mientras las runs de producción —que generan una semilla variable— obtienen
 * mapas procedurales.
 *
 * El mapa **no se serializa**: sólo se guarda la `semilla`; este registro lo
 * reconstruye determinísticamente desde ella.
 */
export default class MapaDeRunRegistry {
    /** Semilla reservada que selecciona el layout fijo de 3f (caso particular). */
    public static readonly SEMILLA_LAYOUT_FIJO = 0;

    private static readonly layoutFijo: MapaDeRun = new MapaLayoutAdapter();

    /** Caché de mapas generados, indexado por semilla. */
    private static readonly cache = new Map<number, MapaDeRun>();

    /**
     * Devuelve el `MapaDeRun` de la `semilla` dada (cacheado). Semilla centinela
     * ⇒ layout fijo; cualquier otra ⇒ mapa generado determinista.
     */
    public static obtener(semilla: number): MapaDeRun {
        if (semilla === MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO) {
            return MapaDeRunRegistry.layoutFijo;
        }
        const cacheado = MapaDeRunRegistry.cache.get(semilla);
        if (cacheado) {
            return cacheado;
        }
        const generado = RunGenerator.generar(semilla);
        MapaDeRunRegistry.cache.set(semilla, generado);
        return generado;
    }

    /** Vacía el caché (útil en tests para aislar la memoria entre casos). */
    public static limpiarCache(): void {
        MapaDeRunRegistry.cache.clear();
    }
}
