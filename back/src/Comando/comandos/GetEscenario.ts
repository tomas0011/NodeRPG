import { Escenario } from '../../Escenario/Escenario';
import IComando from '../IComando';

class GetEscenario implements IComando {
    getKey() {
        return 'escenario'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar() {
        return Escenario.getInstance().getEscenario()
    }
}

export default GetEscenario;
