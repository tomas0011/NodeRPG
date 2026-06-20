import { Inventario } from "../Contenedor/Inventario";
import IPersonaje, { Recompensa } from "./IPersonaje";

export class Personaje implements IPersonaje {
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario
    destreza: number =  1;
    oro: number = 0;

    constructor(vidaMaxima: number = 10){
        this.vidaMaxima = vidaMaxima
        this.vidaActual = vidaMaxima
        this.inventario = new Inventario()
    }

    getDestreza(): number {
        return this.destreza;
    }

    getOro(): number {
        return this.oro;
    }

    /**
     * Suma `cantidad` de oro (moneda de la run) a este personaje y devuelve el
     * total. No acepta cantidades negativas (gastar oro es la tienda, 3d).
     */
    ganarOro(cantidad: number): number {
        if (cantidad > 0) {
            this.oro += cantidad;
        }
        return this.oro;
    }

    /**
     * Gasta `cantidad` de oro (moneda de la run) si hay saldo suficiente.
     * Devuelve `true` y descuenta si pudo pagar; `false` y no cambia nada si no.
     * Ignora cantidades no positivas (no es un camino de gasto válido).
     */
    gastarOro(cantidad: number): boolean {
        if (cantidad <= 0 || this.oro < cantidad) {
            return false;
        }
        this.oro -= cantidad;
        return true;
    }

    /**
     * Botín de monedas que este personaje otorga al ser derrotado. Default sin
     * recompensa; los enemigos lo sobrescriben con sus valores (patrón: el botín
     * es comportamiento del enemigo, no un número fijo en `Atacar`). Determinista,
     * sin azar.
     */
    getRecompensa(): Recompensa {
        return { oro: 0, plata: 0 };
    }

    claseDeArmadura(): number {
        return 10 + this.getDestreza();
    }

    getVidaMaxima(): number {
        return this.vidaMaxima
    }

    getVidaActual(): number {
        return this.vidaActual
    }

    getInventario(): Inventario {
        return this.inventario
    }

    recibirDaño(daño: number): number {
        this.vidaActual -= daño;
        return daño
    }

    dadoDeGolpe(): number {
        return 4
    }

    getNombre(){
        return '';
    }

    
} 
