import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { resolverValorCanonico } from '../../Input/normalizarEntrada';
import { Objeto } from '../../Objeto/Objeto';
import IComando from '../IComando';

class TomarObjeto implements IComando {
    getKey() {
        return 'tomar'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar(nombreDeObjeto: string, state: GameState): CommandResult {
        const objetosDelLugar = state.escenario.getLugar().getObjetos()
        const objetoEncontrado = resolverValorCanonico(
            nombreDeObjeto,
            objetosDelLugar,
            (objeto: Objeto) => objeto.getNombre()
        )
        if (!objetoEncontrado) {
            return { ok: false, message: 'No se encuentra el objeto' };
        }
        state.jugadorBase.getInventario().agregarObjeto(objetoEncontrado)
        const posicion = objetosDelLugar.indexOf(objetoEncontrado)
        if (posicion !== -1) {
            objetosDelLugar.splice(posicion, 1)
        }
        state.registrarObjetoTomadoDelLugarActual(objetoEncontrado.getNombre())
        const inventario = state.jugadorBase.getInventario().getObjetos().map((objeto) => objeto.getNombre());
        return {
            ok: true,
            message: `Tomaste un/a "${objetoEncontrado.getNombre()}"`,
            completions: { equipar: inventario }
        };
    }
}

export default TomarObjeto;
