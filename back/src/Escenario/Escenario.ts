import ILugar from "./Lugar/ILugar";

export class Escenario {
    private lugar: ILugar;

    constructor(lugar: ILugar) {
        this.lugar = lugar;
    }

    public getLugar(): ILugar {
        return this.lugar
    }
}
