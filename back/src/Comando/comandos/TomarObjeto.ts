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

    getUso(): string {
        return 'tomar:<objeto>';
    }

    getDescripcion(): string {
        return 'Recoge un objeto del lugar actual y lo guarda en tu inventario.';
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
        // Sugerencias desde el inventario visible (lo equipado no se re-equipa).
        const inventario = state.objetosDisponibles().map((objeto) => objeto.getNombre());
        return {
            ok: true,
            message: `Tomaste un/a "${objetoEncontrado.getNombre()}"`,
            completions: { equipar: inventario }
        };
    }
}

export default TomarObjeto;
