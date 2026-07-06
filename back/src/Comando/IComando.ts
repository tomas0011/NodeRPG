import CommandResult from '../Game/CommandResult';
import GameState from '../Game/GameState';

interface IComando {
    getKey(): string;
    esComando(comando: string): boolean;
    /** Forma de invocación mostrada en la ayuda, p. ej. `mover:<dirección>`. */
    getUso(): string;
    /** Descripción breve del comando para el catálogo de `help`. */
    getDescripcion(): string;
    ejecutar(agente: string, state: GameState): CommandResult;
}

export default IComando;
