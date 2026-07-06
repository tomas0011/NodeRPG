import AyudaDeComando from '../AyudaDeComando';
import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import SesionContexto from '../../Game/SesionContexto';
import { resolverValorCanonico } from '../../Input/normalizarEntrada';
import { seccion } from '../formato';
import IComando from '../IComando';
import IComandoSesion from '../IComandoSesion';

/**
 * Proveedor del catálogo de comandos disponibles. Se inyecta desde el motor
 * para evitar reintroducir un acceso global al manager de comandos.
 */
type ProveedorDeAyudas = () => AyudaDeComando[];

class GetHelp implements IComando, IComandoSesion {
    private readonly obtenerAyudas: ProveedorDeAyudas;

    constructor(obtenerAyudas: ProveedorDeAyudas) {
        this.obtenerAyudas = obtenerAyudas;
    }

    getKey() {
        return 'help'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    getUso(): string {
        return 'help';
    }

    getDescripcion(): string {
        return 'Lista todos los comandos disponibles; con "help:<comando>" muestra el detalle de uno.';
    }

    ejecutar(agente: string, _state: GameState): CommandResult;
    ejecutar(agente: string, _contexto: SesionContexto): CommandResult;
    ejecutar(agente: string, _stateOContexto: GameState | SesionContexto): CommandResult {
        const ayudas = this.obtenerAyudas();
        const completions = { help: ayudas.map((ayuda) => ayuda.clave) };
        if (!agente) {
            return {
                ok: true,
                message: this.formatearAyudas(ayudas),
                data: {
                    comandos: ayudas.map((ayuda) => ayuda.uso),
                    ayudas
                },
                completions
            };
        }

        const ayuda = resolverValorCanonico(agente, ayudas, (a: AyudaDeComando) => a.clave);
        if (!ayuda) {
            return {
                ok: false,
                message: `No existe el comando "${agente}". Escribe "help" para ver la lista completa.`,
                completions
            };
        }

        return {
            ok: true,
            message: `Comando: ${ayuda.clave}\nUso: ${ayuda.uso}\nDescripción: ${ayuda.descripcion}`,
            data: { ayuda },
            completions
        };
    }

    private formatearAyudas(ayudas: AyudaDeComando[]): string {
        return seccion(
            'Comandos disponibles',
            ayudas.map((ayuda) => `${ayuda.uso}: ${ayuda.descripcion}`),
            'ninguno'
        ).join('\n');
    }
}

export default GetHelp;
