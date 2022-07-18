import { Personaje } from "./Personaje";

export class Jugador extends Personaje{
    constructor(vidaMaxima = 10){
        super(vidaMaxima)
    }
} 