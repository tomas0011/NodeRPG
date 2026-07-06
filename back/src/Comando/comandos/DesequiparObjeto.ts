import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { resolverValorCanonico } from '../../Input/normalizarEntrada';
import { Objeto } from '../../Objeto/Objeto';
import IComando from '../IComando';

class DesequiparObjeto implements IComando {
    getKey() {
        return 'desequipar';
    }

    esComando(comando: string) {
        return comando === this.getKey();
    }

    getUso(): string {
        return 'desequipar:<objeto>';
    }

    getDescripcion(): string {
        return 'Desequipa un objeto y lo devuelve a tu inventario.';
    }

    ejecutar(nombreDeObjeto: string, state: GameState): CommandResult {
        const idCanonico = resolverValorCanonico(
            nombreDeObjeto,
            state.equipados,
            (equipado: string) => equipado
        );
        if (!idCanonico) {
            return {
                ok: false,
                message: `"${nombreDeObjeto}" no está equipado.`,
                completions: { desequipar: state.equipados.slice() }
            };
        }

        state.desequipar(idCanonico);
        const inventario = state.objetosDisponibles().map((objeto: Objeto) => objeto.getNombre());
        return {
            ok: true,
            message: `Te desequipaste "${idCanonico}": vuelve a tu inventario.`,
            data: {
                equipados: state.equipados,
                inventario
            },
            completions: { desequipar: state.equipados.slice() }
        };
    }
}

export default DesequiparObjeto;
