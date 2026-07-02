import { Escenario } from "../Escenario/Escenario";
import LugarFactory from "../Escenario/LugarFactory";
import { normalizarEstadoMutablePorSala } from "../Game/EstadoMutableDeSala";
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
            // XP/nivel de la run (3i). Efímeros: se persisten dentro de la run,
            // NO en el perfil (se pierden al cerrar la run con ella).
            xp: state.jugadorBase.xp,
            nivel: state.jugadorBase.nivel,
            inventario,
            // Copia defensiva: el DTO no debe compartir el array vivo del state.
            equipados: state.equipados.slice()
        };

        const escenario: EscenarioDTO = {
            lugarId: state.lugarId,
            salasVisitadas: state.salasVisitadas.slice(),
            estadoMutablePorSala: normalizarEstadoMutablePorSala(state.estadoMutablePorSala)
        };

        return {
            runId: state.runId,
            sessionId: state.sessionId,
            schemaVersion: SCHEMA_VERSION,
            semilla: state.semilla,
            plataAcumulada: state.plataAcumulada,
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
        // XP/nivel de la run (3i). Tolerante v1→v2: docs viejos sin estos campos
        // caen a xp:0 / nivel:1 sin romper. vidaMaxima ya viaja en el DTO, así
        // que el bonus de niveles previos no se re-aplica (no se duplica).
        jugadorBase.xp = typeof jugadorDto.xp === 'number' ? jugadorDto.xp : 0;
        jugadorBase.nivel = typeof jugadorDto.nivel === 'number' ? jugadorDto.nivel : 1;

        // Reconstruye el inventario desde los ids (objetos vivos vía fábrica).
        const inventarioIds = jugadorDto.inventario || [];
        for (const id of inventarioIds) {
            const objeto = ObjetoFactory.crear(id);
            if (objeto) {
                jugadorBase.getInventario().agregarObjeto(objeto);
            }
        }

        // Semilla del DTO: con ella se REGENERA el mismo mapa (no se serializa).
        const semilla = typeof dto.semilla === 'number' ? dto.semilla : 0;
        // Sala inicial del mapa de esa semilla, por si el DTO no trae lugarId.
        const lugarId = (dto.escenario && dto.escenario.lugarId) || LugarFactory.lugarInicial(semilla);
        const salasVisitadas = (dto.escenario && dto.escenario.salasVisitadas) || [];
        const estadoMutablePorSala = normalizarEstadoMutablePorSala(
            dto.escenario && dto.escenario.estadoMutablePorSala
        );
        // Reconstruye la sala actual dentro del mapa de la semilla (determinista).
        const escenario = new Escenario(LugarFactory.crear(lugarId, semilla, estadoMutablePorSala));

        const state = new GameState(
            jugadorBase,
            escenario,
            dto.sessionId,
            dto.runId,
            semilla,
            lugarId,
            salasVisitadas.slice(),
            estadoMutablePorSala
        );

        // Plata acumulada (tolerante: docs viejos sin el campo caen a 0).
        state.plataAcumulada = typeof dto.plataAcumulada === 'number' ? dto.plataAcumulada : 0;

        // Restaura el equipo y reconstruye la cadena de decoradores. Sólo se
        // conservan los ids cuyo objeto sigue en el inventario (consistencia).
        const equipadosIds = jugadorDto.equipados || [];
        const enInventario = new Set(inventarioIds);
        state.equipados = equipadosIds.filter((id) => enInventario.has(id));
        state.rebuildDecoratedPlayer();

        return state;
    }
}
