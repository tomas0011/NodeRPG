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

    ejecutar(nombreDeObjeto: string): string {
        try {
            const objetosDelLugar = Escenario.getInstance().getLugar().getObjetos()
            const objetoEncontrado = objetosDelLugar.find((objeto: Objeto) => objeto.getNombre() === nombreDeObjeto)
            if (!objetoEncontrado) {
                return 'No se encuentra el objeto'
            }
            PersonajeJugable.getInstance().getInventario().agregarObjeto(objetoEncontrado)
            const posicion = objetosDelLugar.indexOf(objetoEncontrado)
            if (posicion !== -1) {
                objetosDelLugar.splice(posicion, 1)
            }
            return `Tomaste un/a "${objetoEncontrado.getNombre()}"`
        } catch (error) {
            console.log(error)
            return 'No se pudo tomar el objeto'
        }
    }
}

export default TomarObjeto;
