import { Escenario } from "../Escenario/Escenario";
import IComando from './IComando';
import {
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
        new TomarObjeto
    ]
    
    constructor() {}

    public static getInstance(): ComandoManager {
        if (!ComandoManager.instance) {
            ComandoManager.instance = new ComandoManager();
        }
        return ComandoManager.instance
    }

    private getComando(comando: string): IComando {
        const comandoFound: IComando = this.comandos.find((comandoParaEncontrar: IComando) => comandoParaEncontrar.esComando(comando))
        if (comandoFound) {
            return comandoFound
        } else {
            throw new Error('comando no encontrado');
        }
    }

    public ejecutarComando(comandoRecibido: string) {
        const [comando, agente] = comandoRecibido.split(':').map((fragmento: string) => fragmento.trim())
        const comandoFound: IComando = this.getComando(comando)
        if (comandoFound) {
            return comandoFound.ejecutar(agente)
        } else {
            throw new Error('Comando no encontrado')
        };
    };
}

export default ComandoManager
