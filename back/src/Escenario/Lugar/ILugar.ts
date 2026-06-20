import { Objeto } from "../../Objeto/Objeto";
import { Personaje } from "../../Personaje/Personaje";

interface ILugar {
    getNombre(): string
    getPersonajes(): Personaje[]
    getObjetos(): Objeto[]
    /**
     * Salidas de la sala: dirección/nombre → `lugarId` destino. El comando
     * `mover` valida contra este mapa; vacío si la sala no conecta con ninguna.
     */
    getSalidas(): { [direccion: string]: string }
}

export default ILugar;
