import IComando from '../IComando';

class GetPersonaje implements IComando {
    getKey() {
        return 'status'
    }
    
    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar() {
        return 'comando de personaje'
    }
}

export default GetPersonaje;
