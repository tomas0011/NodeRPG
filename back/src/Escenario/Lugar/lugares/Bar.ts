import { EstadoMutableDeSala } from "../../../Game/EstadoMutableDeSala";
import MapaDeRun from "../../MapaDeRun";
import Sala from "./Sala";

/**
 * Sala inicial de la run (el hub de entrada del mapa). Su nombre, ocupantes,
 * objetos y salidas salen del `MapaDeRun` de la run (layout fijo o generado por
 * semilla) como cualquier otra sala — hay una única fuente del mapa.
 *
 * `LugarFactory` lo instancia con `new Bar(mapa)` para el `lugarId` inicial
 * `'bar'`; la base `Sala` resuelve el contenido por ese id en el mapa dado.
 */
export default class Bar extends Sala {
    constructor(mapa?: MapaDeRun, estadoMutable?: EstadoMutableDeSala) {
        super('bar', mapa, estadoMutable);
    }
}
