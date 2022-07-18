class GetInventario {
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
