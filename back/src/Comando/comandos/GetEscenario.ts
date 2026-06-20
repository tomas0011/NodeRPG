import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import IComando from '../IComando';

class GetEscenario implements IComando {
    getKey() {
        return 'escenario'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar(_agente: string, state: GameState): CommandResult {
        const lugar = state.escenario.getLugar();
        const personajes = lugar.getPersonajes().map((personaje) => personaje.getNombre());
        const objetos = lugar.getObjetos().map((objeto) => objeto.getNombre());
        const salidas = lugar.getSalidas();
        const direcciones = Object.keys(salidas);
        const message = `
            Lugar: ${lugar.getNombre()}
            Personas: ${personajes}
            Objetos: ${objetos}
            Salidas: ${direcciones}
        `;
        return {
            ok: true,
            message,
            data: { lugar: lugar.getNombre(), lugarId: state.lugarId, personajes, objetos, salidas },
            completions: { tomar: objetos, mover: direcciones }
        };
    }
}

export default GetEscenario;
