import ComandoManager from '../src/Comando/ComandosManager';
import { Escenario } from '../src/Escenario/Escenario';

describe('ComandoManager (smoke)', () => {
    it('ejecuta el comando "status" y devuelve un string no vacío', () => {
        const resultado = ComandoManager.getInstance().ejecutarComando('status');
        expect(typeof resultado).toBe('string');
        expect((resultado as string).length).toBeGreaterThan(0);
    });

    it('ejecuta el comando "escenario" y devuelve un string', () => {
        const resultado = ComandoManager.getInstance().ejecutarComando('escenario');
        expect(typeof resultado).toBe('string');
    });

    it('lanza un Error cuando el comando no existe', () => {
        expect(() => ComandoManager.getInstance().ejecutarComando('comandoInexistente')).toThrow(
            'Comando no encontrado'
        );
    });

    it('al tomar un objeto del lugar no lo duplica (se quita del lugar)', () => {
        const lugar = Escenario.getInstance().getLugar();
        const objetosAntes = lugar.getObjetos().length;
        const primerObjeto = lugar.getObjetos()[0].getNombre();
        ComandoManager.getInstance().ejecutarComando(`tomar:${primerObjeto}`);
        expect(lugar.getObjetos().length).toBe(objetosAntes - 1);
    });
});
