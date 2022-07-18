import { Escenario } from "../Escenario/Escenario";
import IComando from './IComando';
import {
    GetEscenario,
    GetHelp,
    GetInventario,
    GetPersonaje
} from './comandos';

class ComandoManager {
    protected escenario: Escenario = Escenario.getInstance();
    static instance: ComandoManager;

    public comandos: IComando[] = [
        new GetEscenario,
        new GetHelp,
        new GetInventario,
        new GetPersonaje
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

    public ejecutarComando(comando: string) {
        const comandoFound: IComando = this.getComando(comando)
        if (comandoFound) {
            return comandoFound.ejecutar()
        } else {
            throw new Error('Comando no encontrado')
        };
    };
}

export default ComandoManager
