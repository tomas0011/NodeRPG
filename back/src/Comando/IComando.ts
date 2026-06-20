import CommandResult from '../Game/CommandResult';
import GameState from '../Game/GameState';

interface IComando {
    getKey(): string;
    esComando(comando: string): boolean;
    ejecutar(agente: string, state: GameState): CommandResult;
}

export default IComando;
