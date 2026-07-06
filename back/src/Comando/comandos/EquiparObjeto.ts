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

    getUso(): string {
        return 'equipar:<objeto>';
    }

    getDescripcion(): string {
        return 'Equipa un objeto de tu inventario si se puede usar como equipo.';
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
        if (state.equipados.includes(objetoEncontrado.getNombre())) {
            return {
                ok: false,
                message: `"${objetoEncontrado.getNombre()}" ya está equipado.`,
                data: { equipados: state.equipados }
            };
        }
        const equipado = state.equipar(objetoEncontrado.getNombre());
        if (!equipado) {
            return { ok: false, message: 'No se pudo equipar el objeto' };
        }
        return {
            ok: true,
            message: `Te Equipaste un/a "${objetoEncontrado.getNombre()}"`,
            data: { equipados: state.equipados },
            // Alimenta el autocompletado de `desequipar` desde el primer equipar.
            completions: {
                desequipar: state.equipados.slice(),
                equipar: state.objetosDisponibles().map((objeto: Objeto) => objeto.getNombre())
            }
        };
    }
}

export default EquiparObjeto;
