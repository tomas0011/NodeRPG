class GetEscenario {
    getKey() {
        return 'inicio'
    }

    esComando(comando: string) {
        return comando === this.getKey()
    }

    ejecutar() {
        return 'comando inicio ejecutado'
    }
}

export default GetEscenario;
