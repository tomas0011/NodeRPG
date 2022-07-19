import { Escenario } from '../../Escenario/Escenario';
import { PersonajeJugable } from '../../Personaje/personajes/Jugador';
import IComando from '../IComando';

class GetEscenario implements IComando {
    getKey() {
        return 'escenario'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar() {
        return `
            Personaje: ${PersonajeJugable.getInstance().getNombre()}
            Clase de armadura: ${PersonajeJugable.getInstance().claseDeArmadura()}
            Lugar: ${Escenario.getInstance().getLugar().getNombre()}
            Personas: ${Escenario.getInstance().getLugar().getPersonajes().map((personaje) => personaje.getNombre())}
            Objetos: ${Escenario.getInstance().getLugar().getObjetos().map((objeto) => objeto.getNombre())}
        `;
    }
}

export default GetEscenario;
