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
            Oro: ${jugador.getOro()}
            Inventario: ${objetosEncontrados.length ? objetosEncontrados : 'vacio'}
        `;
        return {
            ok: true,
            message,
            data: {
                nombre: jugador.getNombre(),
                claseDeArmadura: jugador.claseDeArmadura(),
                dadoDeGolpe: jugador.dadoDeGolpe(),
                // Oro de la run (efímero; se pierde al cerrar). La plata del
                // perfil se consulta en el hub (comando `perfil`).
                oro: jugador.getOro(),
                inventario: objetosEncontrados,
                equipados: state.equipados
            }
        };
    }
}

export default GetStatus;
