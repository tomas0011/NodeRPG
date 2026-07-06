import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import MapaDeRunRegistry from '../../Escenario/MapaDeRunRegistry';
import { proyectarMapa } from '../../Escenario/ProyeccionDeMapa';
import IComando from '../IComando';

/**
 * Comando `mapa`: proyecta el grafo de salas de la run a una grilla con niebla
 * de guerra (visitadas + adyacentes como incógnitas). El render visual es del
 * frontend (PanelMapa); acá solo viaja la estructura en `data`.
 */
class Mapa implements IComando {
    getKey() {
        return 'mapa';
    }

    esComando(comando: string) {
        return comando === this.getKey();
    }

    getUso(): string {
        return 'mapa';
    }

    getDescripcion(): string {
        return 'Muestra el minimapa de las salas descubiertas de la run.';
    }

    ejecutar(_agente: string, state: GameState): CommandResult {
        const mapa = MapaDeRunRegistry.obtener(state.semilla);
        const proyeccion = proyectarMapa(mapa, state.salasVisitadas, state.lugarId);

        const visitadas = proyeccion.salas.filter((sala) => sala.visitada);
        const actual = visitadas.find((sala) => sala.id === proyeccion.lugarActual);
        const nombreActual = (actual && actual.nombre) || proyeccion.lugarActual;

        return {
            ok: true,
            message: `Salas conocidas: ${visitadas.length}. Estás en ${nombreActual}.`,
            data: proyeccion
        };
    }
}

export default Mapa;
