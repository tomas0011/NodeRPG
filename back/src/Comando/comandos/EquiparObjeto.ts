import { Objeto } from '../../Objeto/Objeto';
import { PersonajeJugable } from '../../Personaje/personajes/Jugador';
import IComando from '../IComando';

class EquiparObjeto implements IComando {
    getKey() {
        return 'equipar'
    }
    
    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar(nombreDeObjeto: string) {
        try {
            const objetoEncontrado = PersonajeJugable.getInstance().getInventario().getObjetos().find((objeto: Objeto) => objeto.getNombre() === nombreDeObjeto)
            if (!objetoEncontrado) {
                return 'No se encuentra el objeto'
            }
            const modificacion = objetoEncontrado.getModificacion()
            if (!modificacion) {
                return 'El objeto no se puede equipar'
            }
            PersonajeJugable.setInstance(modificacion)
            return `Te Equipaste un/a "${objetoEncontrado.getNombre()}"`
        } catch (error) {
            console.log(error)
        }
    }
}

export default EquiparObjeto;
