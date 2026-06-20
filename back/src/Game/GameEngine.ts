import IComando from "../Comando/IComando";
import {
    EquiparObjeto,
    GetEscenario,
    GetHelp,
    GetStatus,
    TomarObjeto
} from "../Comando";
import CommandResult from "./CommandResult";
import GameState from "./GameState";

/**
 * Motor del juego. Reemplaza al antiguo `ComandoManager` como orquestador de
 * comandos, pero **sin estado de juego propio**: el `GameState` entra por
 * parámetro en cada `ejecutar`, así el motor es testeable sin HTTP ni globales
 * y soporta múltiples sesiones simultáneas.
 */
export default class GameEngine {
    public readonly comandos: IComando[];

    constructor() {
        // GetHelp necesita conocer las claves disponibles; se las inyectamos
        // para no reintroducir un acceso global al manager.
        const getHelp = new GetHelp(() => this.comandos.map((comando) => comando.getKey()));
        this.comandos = [
            new GetEscenario(),
            getHelp,
            new GetStatus(),
            new TomarObjeto(),
            new EquiparObjeto()
        ];
    }

    private getComando(comando: string): IComando | undefined {
        return this.comandos.find((c: IComando) => c.esComando(comando));
    }

    /**
     * Parsea la entrada con formato `"comando: agente"` y delega en el comando
     * correspondiente, pasándole el `state`.
     * @throws Error si el comando no existe (la ruta lo mapea a HTTP 400).
     */
    public ejecutar(input: string, state: GameState): CommandResult {
        const [comando, agente] = input.split(':').map((fragmento: string) => fragmento.trim());
        const comandoFound = this.getComando(comando);
        if (!comandoFound) {
            throw new Error('Comando no encontrado');
        }
        return comandoFound.ejecutar(agente, state);
    }
}
