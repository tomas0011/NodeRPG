"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Escenario_1 = require("./Escenario");
const escenario = Escenario_1.Escenario.getInstance();
escenario.getEscenario();
function getComandos() {
    return `
        Iniciar: iniciar
    `;
}
exports.getComandos = getComandos;
function ejecutarComando(comando) {
    console.log(comando);
    if (comando.toLowerCase() === 'iniciar') {
        return escenario.getEscenario();
    }
}
exports.ejecutarComando = ejecutarComando;
console.log('transpilado');
//# sourceMappingURL=asd.js.map