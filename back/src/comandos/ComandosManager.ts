import { Escenario } from "../Escenario";
import GetEscenario from './comandos/GetEscenario'
import GetHelp from "./comandos/GetHelp";
import GetInventario from "./comandos/GetInventario";
import GetPersonaje from './comandos/GetPersonaje'

export class ComandoManager {
    protected escenario: Escenario = Escenario.getInstance();
    static instance: ComandoManager;

    public comandos: IComando[] = [
        new GetEscenario,
        new GetPersonaje,
        new GetInventario,
        new GetHelp
    ]
    
    constructor() {}

    public static getInstance(): ComandoManager {
        if (!ComandoManager.instance) {
            ComandoManager.instance = new ComandoManager();
        }
        return ComandoManager.instance
    }

    private getComando(comando: string): IComando {
        const comandoFound = this.comandos.find((com) => com.esComando(comando))
        if (comandoFound) {
            return comandoFound
        } else {
            throw new Error('comando no encontrado');
        }
    }

    public ejecutarComando(comando: string) {
        const comandoFound: IComando = this.getComando(comando)
        if (comandoFound) {
            return comandoFound.ejecutar()
        } else {
            throw new Error('Comando no encontrado')
        };
    };
}
