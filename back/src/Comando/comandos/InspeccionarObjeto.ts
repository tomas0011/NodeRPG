import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { resolverValorCanonico } from '../../Input/normalizarEntrada';
import { Objeto } from '../../Objeto/Objeto';
import IComando from '../IComando';

class InspeccionarObjeto implements IComando {
    getKey() {
        return 'inspeccionar';
    }

    esComando(comando: string) {
        return comando === this.getKey();
    }

    ejecutar(nombreDeObjeto: string, state: GameState): CommandResult {
        const inventario = state.jugadorBase.getInventario().getObjetos();
        const objetoEncontrado = resolverValorCanonico(
            nombreDeObjeto,
            inventario,
            (objeto: Objeto) => objeto.getNombre()
        );
        const completions = { inspeccionar: inventario.map((objeto: Objeto) => objeto.getNombre()) };

        if (!objetoEncontrado) {
            return {
                ok: false,
                message: `No tienes ningún "${nombreDeObjeto}" en tu inventario.`,
                completions
            };
        }

        const capacidades = this.getCapacidades(objetoEncontrado);
        const message = [
            `Objeto: ${objetoEncontrado.getNombre()}`,
            `Clase: ${objetoEncontrado.getClase()}`,
            `Descripción: ${objetoEncontrado.getDescripcion()}`,
            `Propiedades: ${capacidades.join(', ')}`
        ].join('\n');

        return {
            ok: true,
            message,
            data: {
                nombre: objetoEncontrado.getNombre(),
                clase: objetoEncontrado.getClase(),
                descripcion: objetoEncontrado.getDescripcion(),
                propiedades: capacidades
            },
            completions
        };
    }

    private getCapacidades(objeto: Objeto): string[] {
        const capacidades: string[] = [];
        if (objeto.getModificacion()) {
            capacidades.push('equipable');
        }
        if (objeto.getEstrategiaDeAtaque()) {
            capacidades.push('arma');
        }
        if (objeto.getEfecto()) {
            capacidades.push('consumible');
        }
        if (!capacidades.length) {
            capacidades.push('sin propiedades especiales');
        }
        return capacidades;
    }
}

export default InspeccionarObjeto;
