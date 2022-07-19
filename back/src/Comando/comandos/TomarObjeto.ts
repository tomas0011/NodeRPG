import { Escenario } from '../../Escenario/Escenario';
import { Objeto } from '../../Objeto/Objeto';
import { PersonajeJugable } from '../../Personaje/personajes/Jugador';
import IComando from '../IComando';

class TomarObjeto implements IComando {
    getKey() {
        return 'tomar'
    }
    
    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar(nombreDeObjeto: string) {
        try {
            console.log('en ejecutar')
            const objetoEncontrado = Escenario.getInstance().getLugar().getObjetos().find((objeto: Objeto) => objeto.getNombre() === nombreDeObjeto)
            if (!objetoEncontrado) {
                return 'No se encuentra el objeto'
            }
            PersonajeJugable.getInstance().getInventario().agregarObjeto(objetoEncontrado)
            return `Tomaste un/a "${objetoEncontrado.getNombre()}"`
        } catch (error) {
            console.log(error)
        }
    }
}

export default TomarObjeto;
