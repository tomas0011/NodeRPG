import { Inventario } from "../Contenedor/Inventario";

interface IPersonaje {
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario
    destreza: number
    getDestreza(): number
    claseDeArmadura(): number
    getVidaMaxima(): number
    getVidaActual(): number
    getInventario(): Inventario
    recibirDaño(daño: number): number
    dadoDeGolpe(): number
    getNombre(): string
}

export default IPersonaje