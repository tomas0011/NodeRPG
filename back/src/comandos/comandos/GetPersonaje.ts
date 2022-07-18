class GetPersonaje {
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
