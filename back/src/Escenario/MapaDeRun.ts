import { DefinicionDeSala, TipoDeSala } from "./MapaLayout";

/**
 * **Mapa de una run** (3h). Abstracción del grafo de salas que consume el
 * escenario: `LugarFactory` lo usa para reconstruir una sala por `lugarId`,
 * `Sala` para derivar su contenido, y `Mover` para validar salidas.
 *
 * Hay dos implementaciones que cumplen este contrato:
 * - el **layout fijo** de 3f (`MapaLayoutAdapter`, caso particular / tests), y
 * - el mapa **generado por semilla** (`RunGenerator.generar`, flujo normal).
 *
 * El mapa **NO se serializa**: con `semilla` + `lugarId` se reconstruye idéntico
 * (mismas salas/ocupantes/loot/salidas), porque deriva de la semilla de forma
 * determinista. La interfaz reproduce la API que `MapaLayout` ya exponía, de modo
 * que el resto del código consulta el mapa sin acoplarse a si es fijo o generado.
 */
export default interface MapaDeRun {
    /** Id de la sala inicial de la run (donde aparece el jugador). */
    lugarInicial(): string;

    /** Definición de una sala por su id, o `undefined` si no existe en el mapa. */
    obtener(lugarId: string): DefinicionDeSala | undefined;

    /** Ids de todas las salas del mapa. */
    ids(): string[];

    /**
     * Salidas válidas desde una sala: dirección → lugarId destino (copia
     * defensiva). Vacío si la sala no existe o no tiene salidas.
     */
    salidas(lugarId: string): Record<string, string>;

    /**
     * Loot encontrable declarado para un **tipo** de sala (ids de `ObjetoFactory`,
     * copia defensiva). Lo usa la generación/siembra del suelo de cada sala.
     */
    lootDeTipo(tipo: TipoDeSala): string[];
}
