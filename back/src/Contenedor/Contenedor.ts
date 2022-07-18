import { Objeto } from "../Objeto/Objeto";

export abstract class Contenedor{
    objetos: Objeto[] = []

    puedeContener(contenedor: Contenedor): Boolean {
        return false
    };

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
