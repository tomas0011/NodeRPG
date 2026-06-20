export abstract class Objeto{
    nombre: string;
    clase: string;

    constructor(nombre: string, clase: string){
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
