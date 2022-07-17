"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Escenario_1 = require("../Escenario");
class ComandoManager {
    constructor() {
        this.escenario = Escenario_1.Escenario.getInstance();
    }
    static getInstance() {
        if (!ComandoManager.instance) {
            ComandoManager.instance = new ComandoManager();
        }
        return ComandoManager.instance;
    }
    // IMPLEMENTAR EL HELP
    getComandos() {
        return `
            Iniciar: iniciar
        `;
    }
    ;
    // IMPLEMENTAR EJECUTOR DE COMANDOS
    ejecutarComando(comando) {
        console.log(comando);
        if (comando.toLowerCase() === 'iniciar') {
            return this.escenario.getEscenario();
        }
        ;
    }
    ;
}
exports.ComandoManager = ComandoManager;
//# sourceMappingURL=ComandosManager.js.map