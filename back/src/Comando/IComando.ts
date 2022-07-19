interface IComando {
    getKey(): string
    esComando(comando: string): boolean
    ejecutar(agente: string): string
}

export default IComando;
