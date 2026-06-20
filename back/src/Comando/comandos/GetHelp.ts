import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import IComando from '../IComando';

/**
 * Proveedor de las claves de comandos disponibles. Se inyecta desde el motor
 * para evitar reintroducir un acceso global al manager de comandos.
 */
type ProveedorDeClaves = () => string[];

class GetHelp implements IComando {
    private readonly obtenerClaves: ProveedorDeClaves;

    constructor(obtenerClaves: ProveedorDeClaves) {
        this.obtenerClaves = obtenerClaves;
    }

    getKey() {
        return 'help'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar(_agente: string, _state: GameState): CommandResult {
        const claves = this.obtenerClaves();
        return {
            ok: true,
            message: claves.join('\n'),
            data: { comandos: claves }
        };
    }
}

export default GetHelp;
