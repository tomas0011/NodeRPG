import { Inventario } from "../Contenedor/Inventario";

export interface Personaje {
    getNombre(): string
    getVidaMaxima(): number
    getVidaActual(): number
    getInventario(): Inventario
}
