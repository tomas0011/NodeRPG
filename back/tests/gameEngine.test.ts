import GameEngine from '../src/Game/GameEngine';
import GameState from '../src/Game/GameState';
import crearGameState from '../src/Game/crearGameState';

describe('GameEngine (sin HTTP ni globales)', () => {
    let engine: GameEngine;
    let state: GameState;

    beforeEach(() => {
        engine = new GameEngine();
        state = crearGameState('sesion-A');
    });

    it('status devuelve ok y un mensaje no vacío con los stats base', () => {
        const resultado = engine.ejecutar('status', state);
        expect(resultado.ok).toBe(true);
        expect(typeof resultado.message).toBe('string');
        expect(resultado.message.length).toBeGreaterThan(0);
        // Stats base: claseDeArmadura = 10 + destreza(1) = 11; dadoDeGolpe = 4.
        expect(state.jugador.claseDeArmadura()).toBe(11);
        expect(state.jugador.dadoDeGolpe()).toBe(4);
    });

    it('escenario devuelve ok y completions de tomar', () => {
        const resultado = engine.ejecutar('escenario', state);
        expect(resultado.ok).toBe(true);
        expect(resultado.completions?.tomar).toEqual(
            expect.arrayContaining(['espada', 'armadura de cuero', 'taza'])
        );
    });

    it('comando inexistente lanza Error', () => {
        expect(() => engine.ejecutar('comandoInexistente', state)).toThrow('Comando no encontrado');
    });

    it('tomar un objeto lo quita del lugar y lo agrega al inventario (no duplica)', () => {
        const lugar = state.escenario.getLugar();
        const objetosAntes = lugar.getObjetos().length;
        engine.ejecutar('tomar:espada', state);
        expect(lugar.getObjetos().length).toBe(objetosAntes - 1);
        const inventario = state.jugadorBase.getInventario().getObjetos().map((o) => o.getNombre());
        expect(inventario).toContain('espada');
        expect(inventario.filter((n) => n === 'espada').length).toBe(1);
    });

    it('secuencia tomar→equipar→status refleja el cambio en dadoDeGolpe (espada)', () => {
        expect(state.jugador.dadoDeGolpe()).toBe(4);
        engine.ejecutar('tomar:espada', state);
        const equip = engine.ejecutar('equipar:espada', state);
        expect(equip.ok).toBe(true);
        expect(state.jugador.dadoDeGolpe()).toBe(6);
        const status = engine.ejecutar('status', state);
        expect(status.message).toContain('Dado de golpe: 6');
    });

    it('secuencia tomar→equipar→status refleja el cambio en claseDeArmadura (armadura de cuero)', () => {
        expect(state.jugador.claseDeArmadura()).toBe(11);
        engine.ejecutar('tomar:armadura de cuero', state);
        engine.ejecutar('equipar:armadura de cuero', state);
        // 13 + destreza(1) = 14.
        expect(state.jugador.claseDeArmadura()).toBe(14);
        const status = engine.ejecutar('status', state);
        expect(status.message).toContain('Clase de armadura: 14');
    });

    it('equipar es idempotente: equipar dos veces no encadena el decorador dos veces', () => {
        engine.ejecutar('tomar:espada', state);
        engine.ejecutar('equipar:espada', state);
        engine.ejecutar('equipar:espada', state);
        expect(state.equipados).toEqual(['espada']);
        expect(state.jugador.dadoDeGolpe()).toBe(6);
    });

    it('equipar un objeto que no está en inventario falla con ok:false', () => {
        const resultado = engine.ejecutar('equipar:espada', state);
        expect(resultado.ok).toBe(false);
        expect(resultado.message).toBe('No se encuentra el objeto');
    });

    it('equipar un objeto no equipable (taza) falla con ok:false', () => {
        engine.ejecutar('tomar:taza', state);
        const resultado = engine.ejecutar('equipar:taza', state);
        expect(resultado.ok).toBe(false);
        expect(resultado.message).toBe('El objeto no se puede equipar');
    });
});

describe('GameState — desequipar y rebuild determinista', () => {
    it('desequipar quita el decorador y restaura los stats base', () => {
        const engine = new GameEngine();
        const state = crearGameState();
        engine.ejecutar('tomar:espada', state);
        engine.ejecutar('equipar:espada', state);
        expect(state.jugador.dadoDeGolpe()).toBe(6);
        const quitado = state.desequipar('espada');
        expect(quitado).toBe(true);
        expect(state.equipados).toEqual([]);
        expect(state.jugador.dadoDeGolpe()).toBe(4);
    });

    it('rebuild combina varios decoradores de forma determinista (espada + armadura de cuero)', () => {
        const engine = new GameEngine();
        const state = crearGameState();
        engine.ejecutar('tomar:espada', state);
        engine.ejecutar('tomar:armadura de cuero', state);
        engine.ejecutar('equipar:espada', state);
        engine.ejecutar('equipar:armadura de cuero', state);
        expect(state.equipados).toEqual(['espada', 'armadura de cuero']);
        // Ambos decoradores aplicados: dado de golpe 6 (espada) y CA 14 (cuero).
        expect(state.jugador.dadoDeGolpe()).toBe(6);
        expect(state.jugador.claseDeArmadura()).toBe(14);
    });
});

describe('Multi-sesión: dos GameState independientes no se interfieren', () => {
    it('equipar en una sesión no afecta a la otra', () => {
        const engine = new GameEngine();
        const sesionA = crearGameState('A');
        const sesionB = crearGameState('B');

        engine.ejecutar('tomar:espada', sesionA);
        engine.ejecutar('equipar:espada', sesionA);

        // A cambió.
        expect(sesionA.jugador.dadoDeGolpe()).toBe(6);
        expect(sesionA.equipados).toEqual(['espada']);

        // B sigue intacta: ni equipo ni stats ni inventario tocados.
        expect(sesionB.jugador.dadoDeGolpe()).toBe(4);
        expect(sesionB.equipados).toEqual([]);
        expect(sesionB.jugadorBase.getInventario().getObjetos().length).toBe(0);
        // La espada sigue en el lugar de B (no se la llevó A).
        const objetosLugarB = sesionB.escenario.getLugar().getObjetos().map((o) => o.getNombre());
        expect(objetosLugarB).toContain('espada');
    });

    it('los jugadores base de dos sesiones son instancias distintas', () => {
        const sesionA = crearGameState('A');
        const sesionB = crearGameState('B');
        expect(sesionA.jugadorBase).not.toBe(sesionB.jugadorBase);
        expect(sesionA.escenario).not.toBe(sesionB.escenario);
    });
});
