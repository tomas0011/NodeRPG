import { Inventario } from "../Contenedor/Inventario";
import CurvaDeNivel from "./CurvaDeNivel";
import IPersonaje, { Recompensa, ResultadoXp } from "./IPersonaje";

export class Personaje implements IPersonaje {
    vidaMaxima: number
    vidaActual: number
    inventario: Inventario
    destreza: number =  1;
    oro: number = 0;
    /** XP acumulada hacia el siguiente nivel (estado de la run; efímero). */
    xp: number = 0;
    /** Nivel dentro de la run (efímero; arranca en 1). */
    nivel: number = 1;

    constructor(vidaMaxima: number = 10){
        this.vidaMaxima = vidaMaxima
        this.vidaActual = vidaMaxima
        this.inventario = new Inventario()
    }

    getDestreza(): number {
        return this.destreza;
    }

    modificarDestreza(delta: number): number {
        this.destreza = Math.max(0, this.destreza + delta);
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

    /**
     * Tabla de botín de **objetos encontrables** (loot) que este personaje suelta
     * al ser derrotado: ids válidos de `ObjetoFactory`. Default sin botín (`[]`);
     * los enemigos lo sobrescriben con su tabla.
     *
     * Es una responsabilidad **separada** de `getRecompensa()` (monedas: oro/plata)
     * — el loot son **objetos**, no monedas — y de los catálogos de tienda
     * (comprables). Como `getRecompensa()`, es comportamiento del enemigo y es
     * **determinista** (sin azar; la aleatoriedad por semilla es 3h).
     */
    getBotin(): string[] {
        return [];
    }

    /**
     * XP que este personaje otorga al ser derrotado (3i). Default 0; los enemigos
     * lo sobrescriben (p. ej. Rata 5, Cantinero 8, Bandido 20, Ogro 100). Es una
     * responsabilidad **separada** de `getRecompensa()` (monedas) y `getBotin()`
     * (objetos). Determinista, sin azar.
     */
    getXp(): number {
        return 0;
    }

    /**
     * Suma `cantidad` de XP (estado de la run) y sube de nivel mientras la XP
     * acumulada alcance el umbral de `CurvaDeNivel` (puede subir **varios**
     * niveles de golpe). Cada subida aumenta `vidaMaxima`/`destreza` y cura al
     * nuevo máximo. La XP se consume al subir (modelo "hacia el siguiente nivel").
     * Ignora cantidades no positivas. Determinista, sin azar.
     */
    ganarXp(cantidad: number): ResultadoXp {
        const xpGanada = cantidad > 0 ? Math.floor(cantidad) : 0;
        let nivelesSubidos = 0;
        if (xpGanada > 0) {
            this.xp += xpGanada;
            let umbral = CurvaDeNivel.xpParaSiguiente(this.nivel);
            while (this.xp >= umbral) {
                this.xp -= umbral;
                this.nivel += 1;
                this.vidaMaxima += CurvaDeNivel.VIDA_POR_NIVEL;
                this.destreza += CurvaDeNivel.DESTREZA_POR_NIVEL;
                // Al subir de nivel se cura al nuevo máximo.
                this.vidaActual = this.vidaMaxima;
                nivelesSubidos += 1;
                umbral = CurvaDeNivel.xpParaSiguiente(this.nivel);
            }
        }
        return {
            xpGanada,
            subioNivel: nivelesSubidos > 0,
            nivelesSubidos,
            nivel: this.nivel,
            xp: this.xp,
            xpParaSiguiente: CurvaDeNivel.xpParaSiguiente(this.nivel)
        };
    }

    /** Nivel actual dentro de la run (getter del campo `nivel`). */
    getNivel(): number {
        return this.nivel;
    }

    /** XP acumulada hacia el siguiente nivel (getter del campo `xp`). */
    getXpActual(): number {
        return this.xp;
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
