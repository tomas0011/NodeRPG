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
        return `
            Nombre: ${PersonajeJugable.getInstance().getNombre()}
            Clase de armadura: ${PersonajeJugable.getInstance().claseDeArmadura()}
            Dado de golpe: ${PersonajeJugable.getInstance().dadoDeGolpe()}
            Inventario: ${objetosEncontrados.length ? objetosEncontrados : 'vacio'}
        `;
    }
}

export default GetStatus;
