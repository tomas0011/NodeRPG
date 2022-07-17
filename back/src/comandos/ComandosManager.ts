import { Escenario } from "../Escenario";

export class ComandoManager {
    protected escenario: Escenario = Escenario.getInstance();
    static instance: ComandoManager;

    comandos: IComando[] = [
        new GetEscenario,
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
        };
    };
}
