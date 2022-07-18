import { Objeto } from "../Objeto/Objeto";


export abstract class Contenedor{
    objetos: Array<Objeto> = []
    puedeContenerUnContenedor: Boolean = false;

    getObjetos(){
        return this.objetos
    }
    agregarObjeto(objeto: Objeto){
        this.objetos.push(objeto)
    }
    quitarObjeto(objeto: Objeto){
        let posicion = this.objetos.indexOf(objeto)
        if(posicion != -1){
            this.objetos.splice(posicion,1);
        } else {
            console.log("El objeto no existe");
        }
    }
} 