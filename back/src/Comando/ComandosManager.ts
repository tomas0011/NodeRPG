import { Escenario } from "../Escenario/Escenario";
import IComando from './IComando';
import {
    EquiparObjeto,
    GetEscenario,
    GetHelp,
    GetStatus,
    TomarObjeto
} from './';

class ComandoManager {
    protected escenario: Escenario = Escenario.getInstance();
    static instance: ComandoManager;

    public comandos: IComando[] = [
        new GetEscenario,
        new GetHelp,
        new GetStatus,
        new TomarObjeto,
        new EquiparObjeto
    ]
    
    constructor() {}

    public static getInstance(): ComandoManager {
        if (!ComandoManager.instance) {
            ComandoManager.instance = new ComandoManager();
        }
        return ComandoManager.instance
    }

    private getComando(comando: string): IComando | undefined {
        const comandoFound = this.comandos.find((comandoParaEncontrar: IComando) => comandoParaEncontrar.esComando(comando))
        if (comandoFound) {
            return comandoFound
        } else {
            console.error('getComando: comando no encontrado');
            return undefined
        }
    }

    public ejecutarComando(comandoRecibido: string) {
        const [comando, agente] = comandoRecibido.split(':').map((fragmento: string) => fragmento.trim())
        const comandoFound = this.getComando(comando)
        if (comandoFound) {
            return comandoFound.ejecutar(agente)
        } else {
            throw new Error('Comando no encontrado')
        }
    }
}

export default ComandoManager
