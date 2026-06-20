import { Inventario } from "../Contenedor/Inventario";

/**
 * Recompensa (botín de monedas) que un personaje otorga al ser derrotado.
 * `oro` alimenta la run (efímero); `plata` se acumula para bancar al perfil.
 */
export interface Recompensa {
    oro: number
    plata: number
}

/**
 * Resultado de ganar XP (3i): cuánta XP se ganó, si subió de nivel (y cuántos
 * niveles), y el estado resultante (nivel, xp acumulada hacia el siguiente y
 * cuánta falta). Lo consume `Atacar` para reportar la subida.
 */
export interface ResultadoXp {
    xpGanada: number
    subioNivel: boolean
    nivelesSubidos: number
    nivel: number
    /** XP acumulada hacia el siguiente nivel (ya restada la consumida al subir). */
    xp: number
    /** XP que falta para el siguiente nivel. */
    xpParaSiguiente: number
}

export default interface IPersonaje {
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario
    destreza: number
    oro: number
    /** XP acumulada hacia el siguiente nivel (efímera; vive en la run). */
    xp: number
    /** Nivel del personaje dentro de la run (efímero; arranca en 1). */
    nivel: number
    getDestreza(): number
    /**
     * Ajusta la destreza del personaje en `delta` (puede ser negativo) dentro de
     * la run y devuelve la destreza resultante. Camino de los efectos consumibles
     * (buffs/debuffs), separado del Decorator de equipo. No baja de 0.
     */
    modificarDestreza(delta: number): number
    getOro(): number
    ganarOro(cantidad: number): number
    gastarOro(cantidad: number): boolean
    getRecompensa(): Recompensa
    /**
     * Tabla de botín de objetos encontrables (loot) soltados al ser derrotado:
     * ids válidos de `ObjetoFactory`. Default `[]`; separada de `getRecompensa()`
     * (monedas) y de los catálogos de tienda. Determinista (sin azar).
     */
    getBotin(): string[]
    /**
     * XP que este personaje otorga al ser derrotado (3i). Separada de
     * `getRecompensa()` (monedas) y `getBotin()` (objetos). Default 0; los
     * enemigos la sobrescriben con valores coherentes. Determinista, sin azar.
     */
    getXp(): number
    /**
     * Suma `cantidad` de XP (estado de la run) y sube de nivel cuando cruza el
     * umbral de `CurvaDeNivel`, pudiendo subir **varios** niveles si alcanza.
     * Cada subida aumenta `vidaMaxima`/`destreza`. Devuelve el detalle de lo
     * ganado/subido. Ignora cantidades no positivas.
     */
    ganarXp(cantidad: number): ResultadoXp
    /**
     * Nivel actual del personaje dentro de la run. Getter (no campo crudo): el
     * Decorator lo reenvía al portador, así un jugador decorado reporta el nivel
     * real del base (igual que `getOro()`/`getDestreza()`).
     */
    getNivel(): number
    /**
     * XP acumulada hacia el siguiente nivel. Getter reenviado por el Decorator
     * (no el campo crudo `xp`, que no se sincroniza en la cadena de decoradores).
     */
    getXpActual(): number
    claseDeArmadura(): number
    getVidaMaxima(): number
    getVidaActual(): number
    getInventario(): Inventario
    recibirDaño(daño: number): number
    dadoDeGolpe(): number
    getNombre(): string
}
