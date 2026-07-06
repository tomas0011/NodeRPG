import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { seccion } from '../formato';
import IComando from '../IComando';

class GetEscenario implements IComando {
    getKey() {
        return 'escenario'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    getUso(): string {
        return 'escenario';
    }

    getDescripcion(): string {
        return 'Muestra el lugar actual, sus personajes, objetos y salidas.';
    }

    ejecutar(_agente: string, state: GameState): CommandResult {
        const lugar = state.escenario.getLugar();
        const personajes = lugar.getPersonajes().map((personaje) => personaje.getNombre());
        const objetos = lugar.getObjetos().map((objeto) => objeto.getNombre());
        const salidas = lugar.getSalidas();
        const direcciones = Object.keys(salidas);
        const message = [
            `Lugar: ${lugar.getNombre()}`,
            ...seccion('Personas', personajes, 'nadie'),
            ...seccion('Objetos', objetos, 'ninguno'),
            ...seccion('Salidas', direcciones, 'ninguna')
        ].join('\n');
        return {
            ok: true,
            message,
            data: { lugar: lugar.getNombre(), lugarId: state.lugarId, personajes, objetos, salidas },
            completions: { tomar: objetos, mover: direcciones }
        };
    }
}

export default GetEscenario;
