import { Objeto } from "../../Objeto/Objeto";
import { Personaje } from "../../Personaje/Personaje";

interface ILugar {
    getNombre(): string
    getPersonajes(): Personaje[]
    getObjetos(): Objeto[]
};

export default ILugar;
