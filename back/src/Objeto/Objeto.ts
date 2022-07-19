export abstract class Objeto{
    nombre: String;
    clase: String;

    constructor(nombre: String, clase: String){
        this.nombre = nombre;
        this.clase = clase;
    }

    abstract getModificacion(): any

    getNombre(){
        return this.nombre;
    }
    
    getClase(){
        return this.clase;
    }
}
