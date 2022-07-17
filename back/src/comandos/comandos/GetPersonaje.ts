class GetPersonaje {
    esComando(comando: string) {
        return comando === 'status'
    }

    ejecutar() {
        return 'comando de personaje'
    }
}