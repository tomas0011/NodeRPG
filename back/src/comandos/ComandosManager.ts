import { Escenario } from "../Escenario";

export class ComandoManager {
    protected escenario: Escenario = Escenario.getInstance();
    static instance: ComandoManager;
    
    constructor() {}

    public static getInstance(): ComandoManager {
        if (!ComandoManager.instance) {
            ComandoManager.instance = new ComandoManager();
        }
        return ComandoManager.instance
    }

    // IMPLEMENTAR EL HELP
    public getComandos() {
        return `
            Iniciar: iniciar
        `;
    };

    // IMPLEMENTAR EJECUTOR DE COMANDOS
    public ejecutarComando(comando: string) {
        console.log(comando)
        if (comando.toLowerCase() === 'iniciar') {
            return this.escenario.getEscenario()
        };
    };
}
