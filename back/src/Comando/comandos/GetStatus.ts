import { Espada } from '../../Objeto/objetos/Espada';
import { PersonajeJugable } from '../../Personaje/personajes/Jugador';
import IComando from '../IComando';

class GetStatus implements IComando {
    getKey() {
        return 'status'
    }
    
    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar() {
        const objetosEncontrados = PersonajeJugable.getInstance().getInventario().getObjetos().map((objeto) => objeto.getNombre())
        return `${objetosEncontrados.length ? objetosEncontrados : 'vacio'}`
    }
}

export default GetStatus;
