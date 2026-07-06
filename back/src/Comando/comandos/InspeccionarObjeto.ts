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

    getUso(): string {
        return 'inspeccionar:<objeto>';
    }

    getDescripcion(): string {
        return 'Muestra la descripción y las propiedades de un objeto de tu inventario o del suelo.';
    }

    ejecutar(nombreDeObjeto: string, state: GameState): CommandResult {
        const inventario = state.jugadorBase.getInventario().getObjetos();
        const suelo = state.escenario.getLugar().getObjetos();

        // Primero el inventario; si no está, el suelo de la sala actual (se
        // puede mirar el loot sin tomarlo).
        let ubicacion = 'en tu inventario';
        let objetoEncontrado = resolverValorCanonico(
            nombreDeObjeto,
            inventario,
            (objeto: Objeto) => objeto.getNombre()
        );
        if (objetoEncontrado && state.equipados.includes(objetoEncontrado.getNombre())) {
            ubicacion = 'equipado';
        }
        if (!objetoEncontrado) {
            objetoEncontrado = resolverValorCanonico(
                nombreDeObjeto,
                suelo,
                (objeto: Objeto) => objeto.getNombre()
            );
            ubicacion = 'en el suelo';
        }

        const nombres = inventario
            .concat(suelo)
            .map((objeto: Objeto) => objeto.getNombre())
            .filter((nombre, indice, todos) => todos.indexOf(nombre) === indice);
        const completions = { inspeccionar: nombres };

        if (!objetoEncontrado) {
            return {
                ok: false,
                message: `No hay ningún "${nombreDeObjeto}" en tu inventario ni en la sala.`,
                completions
            };
        }

        const capacidades = this.getCapacidades(objetoEncontrado);
        const message = [
            `Objeto: ${objetoEncontrado.getNombre()}`,
            `Clase: ${objetoEncontrado.getClase()}`,
            `Descripción: ${objetoEncontrado.getDescripcion()}`,
            `Propiedades: ${capacidades.join(', ')}`,
            `Ubicación: ${ubicacion}`
        ].join('\n');

        return {
            ok: true,
            message,
            data: {
                nombre: objetoEncontrado.getNombre(),
                clase: objetoEncontrado.getClase(),
                descripcion: objetoEncontrado.getDescripcion(),
                propiedades: capacidades,
                ubicacion
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
