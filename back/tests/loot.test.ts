import GameEngine from '../src/Game/GameEngine';
import GameState from '../src/Game/GameState';
import crearGameState from '../src/Game/crearGameState';
import LugarFactory from '../src/Escenario/LugarFactory';
import MapaLayout, { TABLA_DE_LOOT_POR_SALA } from '../src/Escenario/MapaLayout';
import GameStateMapper from '../src/Persistence/GameStateMapper';
import ObjetoFactory from '../src/Objeto/ObjetoFactory';
import { Personaje } from '../src/Personaje/Personaje';
import { Rata } from '../src/Personaje/personajes/Rata';
import { Bandido } from '../src/Personaje/personajes/Bandido';
import { Ogro } from '../src/Personaje/personajes/Ogro';
import { Cantinero } from '../src/Personaje/personajes/Cantinero';

/**
 * 3g — Loot encontrable (tablas de botín por enemigo/sala).
 *
 * Deterministas, InMemory, sin red. Cubren: getBotin separado de getRecompensa;
 * el loot se suelta en la sala al morir el enemigo; ids válidos de ObjetoFactory;
 * un enemigo sin botín no suelta nada; el loot tomado persiste en el inventario
 * tras round-trip toDTO/fromDTO; loot del suelo es efímero (documentado).
 */
describe('getBotin() por enemigo (objetos, separado de getRecompensa)', () => {
    it('Rata y Cantinero no sueltan objetos (botín vacío)', () => {
        expect(new Rata().getBotin()).toEqual([]);
        expect(new Cantinero().getBotin()).toEqual([]);
    });

    it('Bandido suelta una poción de curación', () => {
        expect(new Bandido().getBotin()).toEqual(['poción de curación']);
    });

    it('Ogro (jefe) suelta equipo bueno: armadura de placas y martillo', () => {
        expect(new Ogro().getBotin()).toEqual(['armadura de placas', 'martillo']);
    });

    it('Personaje base no tiene botín (default [])', () => {
        const base = new Personaje();
        expect(base.getBotin()).toEqual([]);
    });

    it('getBotin (objetos) y getRecompensa (monedas) son métodos separados', () => {
        const ogro = new Ogro();
        // El botín son objetos (ids), la recompensa son monedas: cosas distintas.
        expect(Array.isArray(ogro.getBotin())).toBe(true);
        expect(ogro.getRecompensa()).toEqual({ oro: 50, plata: 25 });
        // El botín no contiene monedas ni se mezcla con la recompensa.
        expect(ogro.getBotin()).not.toContain('oro');
    });

    it('todos los ids de botín son válidos en ObjetoFactory', () => {
        const enemigos: Personaje[] = [new Rata(), new Bandido(), new Ogro(), new Cantinero()];
        for (const enemigo of enemigos) {
            for (const id of enemigo.getBotin()) {
                expect(ObjetoFactory.crear(id)).toBeDefined();
            }
        }
    });
});

describe('Atacar — el loot cae en la sala al derrotar al enemigo', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
    });

    /** Coloca al jugador en una sala dada (vía LugarFactory) en un state fresco. */
    function estadoEnSala(lugarId: string, sessionId: string): GameState {
        const state = crearGameState(sessionId);
        state.escenario.setLugar(LugarFactory.crear(lugarId));
        state.lugarId = lugarId;
        return state;
    }

    function npcEnSala(state: GameState, nombre: string): Personaje {
        return state.escenario
            .getLugar()
            .getPersonajes()
            .find((p) => p.getNombre() === nombre)!;
    }

    it('matar a un Bandido suelta su botín en el suelo de la sala (determinista)', () => {
        const state = estadoEnSala('sala-combate', 's-bandido');
        const bandido = npcEnSala(state, 'Bandido');
        // Dejar al bandido a 1 de vida para que un golpe lo mate.
        bandido.vidaActual = 1;
        const objetosAntes = state.escenario.getLugar().getObjetos().length;

        const r = engine.ejecutar('atacar:Bandido', state);

        expect(r.ok).toBe(true);
        expect((r.data as { murio: boolean }).murio).toBe(true);
        // El botín del Bandido cayó en la sala.
        expect((r.data as { botin: string[] }).botin).toEqual(['poción de curación']);
        const objetosSala = state.escenario.getLugar().getObjetos().map((o) => o.getNombre());
        expect(objetosSala).toContain('poción de curación');
        expect(state.escenario.getLugar().getObjetos().length).toBe(objetosAntes + 1);
    });

    it('matar al Ogro suelta sus dos objetos en la sala', () => {
        const state = estadoEnSala('sala-jefe', 's-ogro');
        const ogro = npcEnSala(state, 'Ogro');
        ogro.vidaActual = 1;

        const r = engine.ejecutar('atacar:Ogro', state);

        expect((r.data as { botin: string[] }).botin).toEqual(['armadura de placas', 'martillo']);
        const objetosSala = state.escenario.getLugar().getObjetos().map((o) => o.getNombre());
        expect(objetosSala).toEqual(expect.arrayContaining(['armadura de placas', 'martillo']));
    });

    it('un enemigo sin botín (Rata) no suelta objetos', () => {
        const state = estadoEnSala('pasillo', 's-rata');
        const rata = npcEnSala(state, 'Rata');
        rata.vidaActual = 1;
        const objetosAntes = state.escenario.getLugar().getObjetos().length;

        const r = engine.ejecutar('atacar:Rata', state);

        expect((r.data as { murio: boolean }).murio).toBe(true);
        expect((r.data as { botin: string[] }).botin).toEqual([]);
        expect(state.escenario.getLugar().getObjetos().length).toBe(objetosAntes);
    });

    it('no suelta loot si el enemigo sobrevive al golpe', () => {
        const state = estadoEnSala('sala-combate', 's-vivo');
        const objetosAntes = state.escenario.getLugar().getObjetos().length;

        const r = engine.ejecutar('atacar:Bandido', state); // Bandido a vida llena no muere

        expect((r.data as { murio: boolean }).murio).toBe(false);
        expect((r.data as { botin: string[] }).botin).toEqual([]);
        expect(state.escenario.getLugar().getObjetos().length).toBe(objetosAntes);
    });

    it('el loot soltado aparece en completions.tomar para la TUI', () => {
        const state = estadoEnSala('sala-combate', 's-comp');
        npcEnSala(state, 'Bandido').vidaActual = 1;
        const r = engine.ejecutar('atacar:Bandido', state);
        expect(r.completions?.tomar).toContain('poción de curación');
    });
});

describe('Persistencia del loot: tomado persiste, suelo es efímero', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
    });

    it('el jugador puede tomar el loot soltado y persiste tras round-trip toDTO/fromDTO', () => {
        const state = crearGameState('s-persist');
        state.escenario.setLugar(LugarFactory.crear('sala-jefe'));
        state.lugarId = 'sala-jefe';
        const ogro = state.escenario.getLugar().getPersonajes().find((p) => p.getNombre() === 'Ogro')!;
        ogro.vidaActual = 1;

        engine.ejecutar('atacar:Ogro', state); // suelta armadura de placas + martillo en la sala
        // Tomar uno de los objetos soltados.
        const tomar = engine.ejecutar('tomar:martillo', state);
        expect(tomar.ok).toBe(true);
        const inventario = state.jugadorBase.getInventario().getObjetos().map((o) => o.getNombre());
        expect(inventario).toContain('martillo');

        // Round-trip: el loot tomado vive en el inventario, que sí se serializa.
        const dto = GameStateMapper.toDTO(state);
        expect(dto.jugador.inventario).toContain('martillo');
        const recargado = GameStateMapper.fromDTO(dto);
        const invRecargado = recargado.jugadorBase.getInventario().getObjetos().map((o) => o.getNombre());
        expect(invRecargado).toContain('martillo');
    });

    it('el loot NO tomado (suelo) es efímero: la sala se reconstruye por lugarId sin él', () => {
        const state = crearGameState('s-efimero');
        state.escenario.setLugar(LugarFactory.crear('sala-jefe'));
        state.lugarId = 'sala-jefe';
        const ogro = state.escenario.getLugar().getPersonajes().find((p) => p.getNombre() === 'Ogro')!;
        ogro.vidaActual = 1;
        engine.ejecutar('atacar:Ogro', state); // suelta loot en el suelo, NO se toma

        // Round-trip: la sala se reconstruye desde el lugarId (layout fijo); el
        // loot del suelo no se serializa, así que no reaparece (efímero, 3h lo
        // hará determinista por semilla).
        const recargado = GameStateMapper.fromDTO(GameStateMapper.toDTO(state));
        const salaRecargada = recargado.escenario.getLugar().getObjetos().map((o) => o.getNombre());
        expect(salaRecargada).not.toContain('martillo');
        expect(salaRecargada).not.toContain('armadura de placas');
    });
});

describe('Tabla de loot por tipo de sala (3g) — abstracción para 3h', () => {
    it('expone loot encontrable por tipo con ids válidos de ObjetoFactory', () => {
        const tipos = Object.keys(TABLA_DE_LOOT_POR_SALA) as Array<keyof typeof TABLA_DE_LOOT_POR_SALA>;
        for (const tipo of tipos) {
            for (const id of TABLA_DE_LOOT_POR_SALA[tipo]) {
                expect(ObjetoFactory.crear(id)).toBeDefined();
            }
        }
    });

    it('MapaLayout.lootDeTipo devuelve una copia determinista por tipo', () => {
        expect(MapaLayout.lootDeTipo('jefe')).toEqual(['armadura de placas']);
        expect(MapaLayout.lootDeTipo('bar')).toEqual([]);
        // Copia defensiva: mutar el resultado no altera la tabla.
        const copia = MapaLayout.lootDeTipo('descanso');
        copia.push('intruso');
        expect(MapaLayout.lootDeTipo('descanso')).toEqual(['poción de curación']);
    });
});
