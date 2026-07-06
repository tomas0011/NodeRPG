import ILugar from "./Lugar/ILugar";
import Bar from "./Lugar/lugares/Bar";
import Pasillo from "./Lugar/lugares/Pasillo";
import Sala from "./Lugar/lugares/Sala";
import SalaDeCombate from "./Lugar/lugares/SalaDeCombate";
import SalaDeDescanso from "./Lugar/lugares/SalaDeDescanso";
import SalaDelJefe from "./Lugar/lugares/SalaDelJefe";
import SalaDeTienda from "./Lugar/lugares/SalaDeTienda";
import {
    EstadoMutableDeSala,
    EstadoMutablePorSala,
    obtenerEstadoMutableDeSala
} from "../Game/EstadoMutableDeSala";
import MapaDeRun from "./MapaDeRun";
import MapaDeRunRegistry from "./MapaDeRunRegistry";
import { TipoDeSala } from "./MapaLayout";

/** Constructor de una `Sala` concreta a partir de su `lugarId` y su mapa. */
type ConstructorDeSala = new (lugarId: string, mapa: MapaDeRun, estadoMutable?: EstadoMutableDeSala) => Sala;

/**
 * Fábrica de lugares (patrón Factory). Reconstruye el `ILugar` de una run a
 * partir de su `lugarId` **y la `semilla` de la run**: resuelve el `MapaDeRun`
 * (vía `MapaDeRunRegistry`, cacheado por semilla) y selecciona la clase concreta
 * según el **tipo** de sala que el mapa declara para ese id.
 *
 * El mapa NO se serializa: con `semilla` + `lugarId` se reconstruye la sala con
 * sus ocupantes, objetos y salidas de forma **determinista** (misma semilla ⇒
 * mismo mapa ⇒ misma sala). La semilla centinela (`SEMILLA_LAYOUT_FIJO`, default)
 * resuelve al **layout fijo** de 3f, por lo que `crear(lugarId)` sin semilla
 * mantiene el comportamiento previo (caso particular para tests/bar).
 *
 * Añadir un tipo de sala = registrar su clase aquí + añadirlo a `POOL_DE_SALAS`.
 */
export default class LugarFactory {
    /** Id por defecto del lugar inicial de una run (layout fijo). */
    public static readonly LUGAR_INICIAL: string = MapaDeRunRegistry
        .obtener(MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO)
        .lugarInicial();

    /**
     * tipo de sala → constructor concreto. `bar` no está aquí porque su
     * constructor recibe sólo el mapa (envuelve el `lugarId` 'bar' él mismo); se
     * resuelve aparte en `crear`.
     */
    private static readonly porTipo: Record<Exclude<TipoDeSala, 'bar'>, ConstructorDeSala> = {
        pasillo: Pasillo,
        combate: SalaDeCombate,
        descanso: SalaDeDescanso,
        tienda: SalaDeTienda,
        jefe: SalaDelJefe
    };

    /**
     * Crea un `ILugar` a partir de su id y la `semilla` de la run. Si el id no
     * está en el mapa de esa semilla, cae al lugar inicial (`bar`) para no romper
     * la carga de un doc tolerante.
     *
     * @param lugarId id de la sala dentro del mapa.
     * @param semilla semilla de la run; default = centinela (layout fijo).
     */
    public static crear(
        lugarId: string,
        semilla: number = MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO,
        estadoMutablePorSala?: EstadoMutablePorSala
    ): ILugar {
        const mapa = MapaDeRunRegistry.obtener(semilla);
        const definicion = mapa.obtener(lugarId);
        const lugarResueltoId = definicion ? definicion.id : LugarFactory.lugarInicial(semilla);
        const estadoMutable = obtenerEstadoMutableDeSala(estadoMutablePorSala, lugarResueltoId);
        if (!definicion || definicion.tipo === 'bar') {
            return new Bar(mapa, estadoMutable);
        }
        const constructor = LugarFactory.porTipo[definicion.tipo];
        return new constructor(lugarId, mapa, estadoMutable);
    }

    /** Id de la sala inicial del mapa de la `semilla` dada. */
    public static lugarInicial(semilla: number = MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO): string {
        return MapaDeRunRegistry.obtener(semilla).lugarInicial();
    }
}
