import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import IComando from '../IComando';

class GetStatus implements IComando {
    getKey() {
        return 'status'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar(_agente: string, state: GameState): CommandResult {
        const jugador = state.jugador;
        const objetosEncontrados = jugador.getInventario().getObjetos().map((objeto) => objeto.getNombre())
        const message = `
            Nombre: ${jugador.getNombre()}
            Clase de armadura: ${jugador.claseDeArmadura()}
            Dado de golpe: ${jugador.dadoDeGolpe()}
            Inventario: ${objetosEncontrados.length ? objetosEncontrados : 'vacio'}
        `;
        return {
            ok: true,
            message,
            data: {
                nombre: jugador.getNombre(),
                claseDeArmadura: jugador.claseDeArmadura(),
                dadoDeGolpe: jugador.dadoDeGolpe(),
                inventario: objetosEncontrados,
                equipados: state.equipados
            }
        };
    }
}

export default GetStatus;
