import { Inventario } from "../Contenedor/Inventario";

/**
 * Recompensa (botín de monedas) que un personaje otorga al ser derrotado.
 * `oro` alimenta la run (efímero); `plata` se acumula para bancar al perfil.
 */
export interface Recompensa {
    oro: number
    plata: number
}

export default interface IPersonaje {
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario
    destreza: number
    oro: number
    getDestreza(): number
    getOro(): number
    ganarOro(cantidad: number): number
    gastarOro(cantidad: number): boolean
    getRecompensa(): Recompensa
    claseDeArmadura(): number
    getVidaMaxima(): number
    getVidaActual(): number
    getInventario(): Inventario
    recibirDaño(daño: number): number
    dadoDeGolpe(): number
    getNombre(): string
}
