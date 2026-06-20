import ILugar from "./Lugar/ILugar";

export class Escenario {
    private lugar: ILugar;

    constructor(lugar: ILugar) {
        this.lugar = lugar;
    }

    public getLugar(): ILugar {
        return this.lugar
    }

    /**
     * Cambia el lugar actual del escenario (lo usa `mover` al desplazarse a una
     * sala conectada). El `lugarId` del `GameState` se actualiza en paralelo para
     * que la serialización por id siga siendo la fuente de la posición.
     */
    public setLugar(lugar: ILugar): void {
        this.lugar = lugar
    }
}
