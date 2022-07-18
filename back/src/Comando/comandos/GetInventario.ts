import IComando from '../IComando';

class GetInventario implements IComando {
    getKey() {
        return 'inventario'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar() {
        return 'comando de inventario'
    }
}

export default GetInventario;
