import { Escenario } from "../Escenario/Escenario";
import LugarFactory from "../Escenario/LugarFactory";
import GameState from "../Game/GameState";
import ObjetoFactory from "../Objeto/ObjetoFactory";
import { PersonajeJugable } from "../Personaje/personajes/Jugador";
import { RunDTO, JugadorDTO, EscenarioDTO, SCHEMA_VERSION } from "./dtos";

/**
 * Mapper entre el `GameState` (grafo de objetos vivos, con jugador decorado,
 * objetos del inventario y lugar) y su DTO plano serializable (`RunDTO`).
 *
 * Principio: NO se serializa el grafo. Se guardan datos planos + ids; al cargar,
 * `ObjetoFactory`/`LugarFactory` reconstruyen los objetos y
 * `rebuildDecoratedPlayer()` reconstruye la cadena de decoradores desde
 * `equipados[]`. La serialización es **sin pérdida**: el jugador reconstruido
 * tiene el mismo `claseDeArmadura`/`dadoDeGolpe`/inventario que el original.
 */
export default class GameStateMapper {
    /** Serializa un `GameState` a su DTO plano. */
    public static toDTO(state: GameState): RunDTO {
        const inventario = state.jugadorBase
            .getInventario()
            .getObjetos()
            .map((objeto) => objeto.getNombre());

        const jugador: JugadorDTO = {
            nombre: state.jugadorBase.getNombre(),
            vidaMaxima: state.jugadorBase.getVidaMaxima(),
            vidaActual: state.jugadorBase.getVidaActual(),
            destreza: state.jugadorBase.getDestreza(),
            oro: state.jugadorBase.getOro(),
            inventario,
            // Copia defensiva: el DTO no debe compartir el array vivo del state.
            equipados: state.equipados.slice()
        };

        const escenario: EscenarioDTO = {
            lugarId: state.lugarId,
            salasVisitadas: state.salasVisitadas.slice()
        };

        return {
            runId: state.runId,
            sessionId: state.sessionId,
            schemaVersion: SCHEMA_VERSION,
            semilla: state.semilla,
            jugador,
            escenario
        };
    }

    /**
     * Reconstruye un `GameState` vivo a partir de un DTO plano. Deserialización
     * **tolerante**: campos ausentes en docs viejos caen a defaults sensatos.
     */
    public static fromDTO(dto: RunDTO): GameState {
        const jugadorDto: JugadorDTO = dto.jugador;

        const vidaMaxima = typeof jugadorDto.vidaMaxima === 'number' ? jugadorDto.vidaMaxima : 10;
        const jugadorBase = new PersonajeJugable(
            jugadorDto.nombre || 'Tomas',
            vidaMaxima
        );
        // Restaura vida/destreza/oro con defaults tolerantes (el constructor
        // deja vidaActual = vidaMaxima si el doc no trae vidaActual).
        jugadorBase.vidaActual = typeof jugadorDto.vidaActual === 'number' ? jugadorDto.vidaActual : vidaMaxima;
        jugadorBase.destreza = typeof jugadorDto.destreza === 'number' ? jugadorDto.destreza : 1;
        jugadorBase.oro = typeof jugadorDto.oro === 'number' ? jugadorDto.oro : 0;

        // Reconstruye el inventario desde los ids (objetos vivos vía fábrica).
        const inventarioIds = jugadorDto.inventario || [];
        for (const id of inventarioIds) {
            const objeto = ObjetoFactory.crear(id);
            if (objeto) {
                jugadorBase.getInventario().agregarObjeto(objeto);
            }
        }

        const lugarId = (dto.escenario && dto.escenario.lugarId) || LugarFactory.LUGAR_INICIAL;
        const salasVisitadas = (dto.escenario && dto.escenario.salasVisitadas) || [];
        const escenario = new Escenario(LugarFactory.crear(lugarId));

        const state = new GameState(
            jugadorBase,
            escenario,
            dto.sessionId,
            dto.runId,
            typeof dto.semilla === 'number' ? dto.semilla : 0,
            lugarId,
            salasVisitadas.slice()
        );

        // Restaura el equipo y reconstruye la cadena de decoradores. Sólo se
        // conservan los ids cuyo objeto sigue en el inventario (consistencia).
        const equipadosIds = jugadorDto.equipados || [];
        const enInventario = new Set(inventarioIds);
        state.equipados = equipadosIds.filter((id) => enInventario.has(id));
        state.rebuildDecoratedPlayer();

        return state;
    }
}
