interface IComando {
    getKey(): string
    esComando(comando: string): boolean
    ejecutar(): string
}
