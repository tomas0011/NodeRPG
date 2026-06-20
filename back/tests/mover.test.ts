import GameEngine from '../src/Game/GameEngine';
import GameState from '../src/Game/GameState';
import crearGameState from '../src/Game/crearGameState';
import LugarFactory from '../src/Escenario/LugarFactory';
import MapaLayout from '../src/Escenario/MapaLayout';
import { Escenario } from '../src/Escenario/Escenario';
import GameStateMapper from '../src/Persistence/GameStateMapper';

describe('mover (3f) — salidas y desplazamiento', () => {
    let engine: GameEngine;
    let state: GameState;

    beforeEach(() => {
        engine = new GameEngine();
        state = crearGameState('sesion-mover');
    });

    it('escenario muestra las salidas de la sala actual en data y completions', () => {
        const resultado = engine.ejecutar('escenario', state);
        expect(resultado.ok).toBe(true);
        // El bar conecta al este con el pasillo (layout fijo).
        expect(resultado.completions?.mover).toEqual(['este']);
        const data = resultado.data as { salidas: Record<string, string> };
        expect(data.salidas).toEqual({ este: 'pasillo' });
    });

    it('mover por una salida válida cambia la sala actual y la añade a salasVisitadas', () => {
        expect(state.lugarId).toBe('bar');
        expect(state.salasVisitadas).toEqual([]);

        const resultado = engine.ejecutar('mover:este', state);

        expect(resultado.ok).toBe(true);
        expect(state.lugarId).toBe('pasillo');
        expect(state.escenario.getLugar().getNombre()).toBe('Pasillo lúgubre');
        expect(state.salasVisitadas).toContain('pasillo');
        expect(resultado.completions?.mover).toEqual(
            expect.arrayContaining(['oeste', 'norte', 'sur'])
        );
    });

    it('mover por una salida inválida devuelve ok:false con las salidas válidas y no mueve', () => {
        const resultado = engine.ejecutar('mover:arriba', state);

        expect(resultado.ok).toBe(false);
        expect(resultado.message).toContain('este');
        expect(resultado.completions?.mover).toEqual(['este']);
        // No se movió.
        expect(state.lugarId).toBe('bar');
        expect(state.salasVisitadas).toEqual([]);
    });

    it('mover sin argumento devuelve ok:false sin mover', () => {
        const resultado = engine.ejecutar('mover', state);
        expect(resultado.ok).toBe(false);
        expect(state.lugarId).toBe('bar');
    });

    it('no duplica una sala ya visitada al volver a entrar', () => {
        engine.ejecutar('mover:este', state); // bar -> pasillo
        engine.ejecutar('mover:oeste', state); // pasillo -> bar
        engine.ejecutar('mover:este', state); // bar -> pasillo de nuevo
        const repeticiones = state.salasVisitadas.filter((id) => id === 'pasillo').length;
        expect(repeticiones).toBe(1);
        expect(state.salasVisitadas).toContain('bar');
    });

    it('tras mover, escenario opera sobre la nueva sala', () => {
        engine.ejecutar('mover:este', state); // bar -> pasillo
        const escenario = engine.ejecutar('escenario', state);
        const data = escenario.data as { lugar: string; personajes: string[] };
        expect(data.lugar).toBe('Pasillo lúgubre');
        expect(data.personajes).toContain('Rata');
    });

    it('tras mover a sala-jefe, atacar opera sobre el Ogro y cobra su recompensa', () => {
        // Camino fijo: bar -> pasillo -> sala-combate -> sala-jefe.
        engine.ejecutar('mover:este', state);
        engine.ejecutar('mover:norte', state);
        const moverJefe = engine.ejecutar('mover:norte', state);
        expect(moverJefe.ok).toBe(true);
        expect(state.lugarId).toBe('sala-jefe');

        const ocupantes = state.escenario.getLugar().getPersonajes().map((p) => p.getNombre());
        expect(ocupantes).toContain('Ogro');

        // El Ogro es un jefe (vida 30, golpe 9): un jugador sin equipo no lo mata.
        // Lo que verifica este test es que el Ogro es ATACABLE y que, al morir, da su
        // recompensa — no el balance del combate. Lo dejamos a 1 de vida y lo rematamos
        // de un golpe (puños hace ≥1 ignorando armadura), de forma determinista.
        const ogro = state.escenario.getLugar().getPersonajes().find((p) => p.getNombre() === 'Ogro');
        expect(ogro).toBeDefined();
        ogro!.recibirDaño(ogro!.getVidaActual() - 1); // queda en 1 de vida
        const oroAntes = state.jugador.getOro();
        const plataAntes = state.plataAcumulada;
        const r = engine.ejecutar('atacar:Ogro', state);
        const data = r.data as { murio: boolean };
        expect(data.murio).toBe(true);
        // Recompensa del Ogro: oro 50, plata 25.
        expect(state.jugador.getOro()).toBe(oroAntes + 50);
        expect(state.plataAcumulada).toBe(plataAntes + 25);
    });
});

describe('LugarFactory + MapaLayout — reconstrucción por lugarId', () => {
    it('reconstruye cada sala del mapa con su nombre, ocupantes y salidas', () => {
        const esperado: Record<string, { nombre: string; ocupante?: string }> = {
            'bar': { nombre: 'Bar Puerco Verde', ocupante: 'Cantinero Pepe' },
            'pasillo': { nombre: 'Pasillo lúgubre', ocupante: 'Rata' },
            'sala-combate': { nombre: 'Sala de combate', ocupante: 'Bandido' },
            'sala-descanso': { nombre: 'Sala de descanso' },
            'sala-tienda': { nombre: 'Tienda del mercader' },
            'sala-jefe': { nombre: 'Guarida del jefe', ocupante: 'Ogro' }
        };

        for (const lugarId of MapaLayout.ids()) {
            const lugar = LugarFactory.crear(lugarId);
            const def = esperado[lugarId];
            expect(lugar.getNombre()).toBe(def.nombre);
            // Las salidas reconstruidas coinciden con la fuente (el layout).
            expect(lugar.getSalidas()).toEqual(MapaLayout.salidas(lugarId));
            if (def.ocupante) {
                const nombres = lugar.getPersonajes().map((p) => p.getNombre());
                expect(nombres).toContain(def.ocupante);
            }
        }
    });

    it('la sala de descanso no tiene enemigos', () => {
        const descanso = LugarFactory.crear('sala-descanso');
        expect(descanso.getPersonajes()).toEqual([]);
    });

    it('un lugarId desconocido cae al bar (carga tolerante)', () => {
        const lugar = LugarFactory.crear('inexistente');
        expect(lugar.getNombre()).toBe('Bar Puerco Verde');
    });

    it('cada sala destino del layout existe en el mapa (grafo consistente)', () => {
        for (const lugarId of MapaLayout.ids()) {
            const salidas = MapaLayout.salidas(lugarId);
            for (const destino of Object.values(salidas)) {
                expect(MapaLayout.obtener(destino)).toBeDefined();
            }
        }
    });
});

describe('Round-trip con el jugador en una sala distinta del bar', () => {
    it('toDTO/fromDTO recupera la misma lugarId y salasVisitadas', () => {
        const engine = new GameEngine();
        // Semilla centinela (0) = layout fijo de 3f, para asertar su grafo
        // conocido; el round-trip por semilla procedural se cubre en runGenerator.test.
        const state = crearGameState('sesion-rt-mapa', 'run-rt-mapa', 0);

        // Recorre hasta sala-combate: bar -> pasillo -> sala-combate.
        engine.ejecutar('mover:este', state);
        engine.ejecutar('mover:norte', state);
        expect(state.lugarId).toBe('sala-combate');

        const dto = GameStateMapper.toDTO(state);
        expect(dto.escenario.lugarId).toBe('sala-combate');
        expect(dto.escenario.salasVisitadas).toEqual(['pasillo', 'sala-combate']);

        const reconstruido = GameStateMapper.fromDTO(dto);
        expect(reconstruido.lugarId).toBe('sala-combate');
        expect(reconstruido.salasVisitadas).toEqual(['pasillo', 'sala-combate']);
        // La sala reconstruida es la correcta, con sus ocupantes/salidas del layout.
        expect(reconstruido.escenario.getLugar().getNombre()).toBe('Sala de combate');
        const ocupantes = reconstruido.escenario.getLugar().getPersonajes().map((p) => p.getNombre());
        expect(ocupantes).toContain('Bandido');
        expect(reconstruido.escenario.getLugar().getSalidas()).toEqual(
            MapaLayout.salidas('sala-combate')
        );
    });

    it('tras recargar, atacar opera sobre el enemigo de la sala reconstruida', () => {
        const engine = new GameEngine();
        // Semilla centinela (0) = layout fijo de 3f (bar -este-> pasillo con Rata).
        const state = crearGameState('sesion-rt-atk', 'run-rt-atk', 0);
        engine.ejecutar('mover:este', state); // pasillo (tiene Rata)

        const dto = GameStateMapper.toDTO(state);
        const reconstruido = GameStateMapper.fromDTO(dto);

        const ataque = engine.ejecutar('atacar:Rata', reconstruido);
        expect(ataque.ok).toBe(true);
        const data = ataque.data as { objetivo: string };
        expect(data.objetivo).toBe('Rata');
    });
});

describe('Escenario.setLugar', () => {
    it('cambia el lugar devuelto por getLugar', () => {
        const escenario = new Escenario(LugarFactory.crear('bar'));
        expect(escenario.getLugar().getNombre()).toBe('Bar Puerco Verde');
        escenario.setLugar(LugarFactory.crear('sala-jefe'));
        expect(escenario.getLugar().getNombre()).toBe('Guarida del jefe');
    });
});
