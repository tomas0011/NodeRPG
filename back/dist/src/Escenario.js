"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Escenario {
    constructor() {
        this.personaje = 'Tomas';
        this.lugar = 'Bar';
    }
    static getInstance() {
        if (!Escenario.escenario) {
            Escenario.escenario = new Escenario();
        }
        return Escenario.escenario;
    }
    getPersonaje() {
        return this.personaje;
    }
    getLugar() {
        return this.lugar;
    }
    getEscenario() {
        return `
            Personaje: ${this.getPersonaje()}
            Lugar: ${this.getLugar()}
        `;
    }
}
Escenario.escenario = null;
exports.Escenario = Escenario;
//# sourceMappingURL=Escenario.js.map