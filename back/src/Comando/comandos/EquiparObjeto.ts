import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { resolverValorCanonico } from '../../Input/normalizarEntrada';
import { Objeto } from '../../Objeto/Objeto';
import IComando from '../IComando';

class EquiparObjeto implements IComando {
    getKey() {
        return 'equipar'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar(nombreDeObjeto: string, state: GameState): CommandResult {
        const objetoEncontrado = resolverValorCanonico(
            nombreDeObjeto,
            state.jugadorBase.getInventario().getObjetos(),
            (objeto: Objeto) => objeto.getNombre()
        )
        if (!objetoEncontrado) {
            return { ok: false, message: 'No se encuentra el objeto' };
        }
        if (!objetoEncontrado.getModificacion()) {
            return { ok: false, message: 'El objeto no se puede equipar' };
        }
        const equipado = state.equipar(objetoEncontrado.getNombre());
        if (!equipado) {
            return { ok: false, message: 'No se pudo equipar el objeto' };
        }
        return {
            ok: true,
            message: `Te Equipaste un/a "${objetoEncontrado.getNombre()}"`,
            data: { equipados: state.equipados }
        };
    }
}

export default EquiparObjeto;
