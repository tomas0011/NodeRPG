import { ComandoManager } from "../ComandosManager";

class GetHelp {
    getKey() {
        return 'help'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar() {
        return `${ComandoManager.getInstance().comandos.map((comando) => comando.getKey()).join('\n')}`
    }
}

export default GetHelp;
