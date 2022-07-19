import { Escenario } from '../../Escenario/Escenario';
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
            console.log('en equipar')
            const objetoEncontrado = PersonajeJugable.getInstance().getInventario().getObjetos().find((objeto: Objeto) => objeto.getNombre() === nombreDeObjeto)
            if (!objetoEncontrado) {
                return 'No se encuentra el objeto'
            }
            if (objetoEncontrado.getClase() !== 'armadura') {
                return 'No se puede poner este objeto'
            }
            PersonajeJugable.getInstance().getInventario().agregarObjeto(objetoEncontrado)
            return `Te Equipaste un/a "${objetoEncontrado.getNombre()}"`
        } catch (error) {
            console.log(error)
        }
    }
}

export default EquiparObjeto;
