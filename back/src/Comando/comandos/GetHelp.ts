import AyudaDeComando from '../AyudaDeComando';
import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import SesionContexto from '../../Game/SesionContexto';
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

    ejecutar(_agente: string, _state: GameState): CommandResult;
    ejecutar(_agente: string, _contexto: SesionContexto): CommandResult;
    ejecutar(_agente: string, _stateOContexto: GameState | SesionContexto): CommandResult {
        const ayudas = this.obtenerAyudas();
        return {
            ok: true,
            message: this.formatearAyudas(ayudas),
            data: {
                comandos: ayudas.map((ayuda) => ayuda.uso),
                ayudas
            }
        };
    }

    private formatearAyudas(ayudas: AyudaDeComando[]): string {
        const lineas = ayudas.map((ayuda) => `- ${ayuda.uso}: ${ayuda.descripcion}`);
        return `Comandos disponibles:\n${lineas.join('\n')}`;
    }
}

export default GetHelp;
