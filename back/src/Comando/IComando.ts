interface IComando {
    getKey(): string
    esComando(comando: string): boolean
    ejecutar(interactive: string): string
}

export default IComando;
