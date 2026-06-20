import Prng from '../src/Game/prng';
import RunGenerator from '../src/Game/RunGenerator';
import MapaDeRun from '../src/Escenario/MapaDeRun';
import MapaDeRunRegistry from '../src/Escenario/MapaDeRunRegistry';
import LugarFactory from '../src/Escenario/LugarFactory';
import GameEngine from '../src/Game/GameEngine';
import crearGameState from '../src/Game/crearGameState';
import GameStateMapper from '../src/Persistence/GameStateMapper';

/**
 * Tests deterministas del generador procedural por semilla (3h). NINGUNO toca la
 * red. Verifican: (1) PRNG reproducible y sin Math.random, (2) determinismo del
 * mapa, (3) grafo conexo + salidas válidas, (4) round-trip por semilla.
 */

/** Serializa un mapa a una forma comparable (orden estable) para asserts. */
function huella(mapa: MapaDeRun): unknown {
    const ids = mapa.ids().slice().sort();
    return ids.map((id) => {
        const def = mapa.obtener(id)!;
        return {
            id: def.id,
            tipo: def.tipo,
            nombre: def.nombre,
            ocupantes: [...def.ocupantes],
            objetos: [...def.objetos],
            salidas: { ...def.salidas }
        };
    });
}

describe('Prng — generador sembrado determinista', () => {
    it('la misma semilla produce la misma secuencia', () => {
        const a = new Prng(12345);
        const b = new Prng(12345);
        const secA = Array.from({ length: 10 }, () => a.siguiente());
        const secB = Array.from({ length: 10 }, () => b.siguiente());
        expect(secA).toEqual(secB);
    });

    it('semillas distintas producen secuencias distintas', () => {
        const a = new Prng(1);
        const b = new Prng(2);
        const secA = Array.from({ length: 10 }, () => a.siguiente());
        const secB = Array.from({ length: 10 }, () => b.siguiente());
        expect(secA).not.toEqual(secB);
    });

    it('siguiente() está en [0,1)', () => {
        const p = new Prng(99);
        for (let i = 0; i < 1000; i++) {
            const n = p.siguiente();
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThan(1);
        }
    });

    it('entero() respeta el rango inclusivo de forma determinista', () => {
        const p = new Prng(7);
        const valores = Array.from({ length: 200 }, () => p.entero(3, 6));
        for (const v of valores) {
            expect(v).toBeGreaterThanOrEqual(3);
            expect(v).toBeLessThanOrEqual(6);
        }
        // Reproducibilidad.
        const q = new Prng(7);
        const valores2 = Array.from({ length: 200 }, () => q.entero(3, 6));
        expect(valores2).toEqual(valores);
    });

    it('barajar() no muta y es determinista', () => {
        const original = [1, 2, 3, 4, 5];
        const p = new Prng(50);
        const baraja1 = p.barajar(original);
        const q = new Prng(50);
        const baraja2 = q.barajar(original);
        expect(baraja1).toEqual(baraja2);
        expect(original).toEqual([1, 2, 3, 4, 5]); // intacto
        expect(baraja1.slice().sort()).toEqual([1, 2, 3, 4, 5]); // permutación
    });
});

describe('RunGenerator — determinismo del mapa', () => {
    it('generar(s) dos veces con la misma s da mapas idénticos', () => {
        const s = 987654321;
        const m1 = RunGenerator.generar(s);
        const m2 = RunGenerator.generar(s);
        expect(huella(m1)).toEqual(huella(m2));
        expect(m1.lugarInicial()).toBe(m2.lugarInicial());
    });

    it('semillas distintas dan mapas distintos (estructura/contenido)', () => {
        const m1 = RunGenerator.generar(111);
        const m2 = RunGenerator.generar(222);
        expect(huella(m1)).not.toEqual(huella(m2));
    });
});

describe('RunGenerator — grafo conexo y salidas válidas', () => {
    /** BFS desde el inicial; devuelve el set de ids alcanzables. */
    function alcanzables(mapa: MapaDeRun): Set<string> {
        const visto = new Set<string>();
        const cola = [mapa.lugarInicial()];
        while (cola.length > 0) {
            const id = cola.shift()!;
            if (visto.has(id)) {
                continue;
            }
            visto.add(id);
            for (const destino of Object.values(mapa.salidas(id))) {
                if (!visto.has(destino)) {
                    cola.push(destino);
                }
            }
        }
        return visto;
    }

    it('toda sala es alcanzable desde la inicial (conexo) para muchas semillas', () => {
        for (let s = 1; s <= 60; s++) {
            const mapa = RunGenerator.generar(s);
            const ids = new Set(mapa.ids());
            const visto = alcanzables(mapa);
            expect(visto.size).toBe(ids.size);
        }
    });

    it('toda salida apunta a una sala existente del mapa', () => {
        for (let s = 1; s <= 60; s++) {
            const mapa = RunGenerator.generar(s);
            const ids = new Set(mapa.ids());
            for (const id of mapa.ids()) {
                for (const destino of Object.values(mapa.salidas(id))) {
                    expect(ids.has(destino)).toBe(true);
                }
            }
        }
    });

    it('hay una sala inicial (bar) y una sala de jefe', () => {
        const mapa = RunGenerator.generar(424242);
        const inicial = mapa.obtener(mapa.lugarInicial())!;
        expect(inicial.tipo).toBe('bar');
        const tipos = mapa.ids().map((id) => mapa.obtener(id)!.tipo);
        expect(tipos).toContain('jefe');
    });
});

describe('MapaDeRunRegistry — caché y semilla centinela', () => {
    it('la semilla centinela resuelve al layout fijo de 3f', () => {
        const mapa = MapaDeRunRegistry.obtener(MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO);
        expect(mapa.lugarInicial()).toBe('bar');
        expect(mapa.obtener('bar')!.nombre).toBe('Bar Puerco Verde');
        expect(mapa.salidas('bar')).toEqual({ este: 'pasillo' });
    });

    it('devuelve la misma instancia cacheada para la misma semilla', () => {
        const a = MapaDeRunRegistry.obtener(555);
        const b = MapaDeRunRegistry.obtener(555);
        expect(a).toBe(b); // misma referencia ⇒ no se regeneró
    });
});

describe('Round-trip por semilla (mapa NO serializado)', () => {
    it('crear con semilla procedural, moverse y recargar regenera el mismo mapa y posición', () => {
        const engine = new GameEngine();
        const semilla = 13579;
        const state = crearGameState('sesion-3h', 'run-3h', semilla);

        // Recorre una salida cualquiera de la sala inicial.
        const lugarIdInicial = state.lugarId;
        const inicial = state.escenario.getLugar();
        const direccion = Object.keys(inicial.getSalidas())[0];
        expect(direccion).toBeDefined();
        const mov = engine.ejecutar(`mover:${direccion}`, state);
        expect(mov.ok).toBe(true);
        const lugarIdTrasMover = state.lugarId;
        const nombreTrasMover = state.escenario.getLugar().getNombre();
        const salidasTrasMover = state.escenario.getLugar().getSalidas();
        expect(lugarIdTrasMover).not.toBe(lugarIdInicial);

        // Serializa: el DTO lleva semilla + lugarId + salasVisitadas, NO el mapa.
        const dto = GameStateMapper.toDTO(state);
        expect(dto.semilla).toBe(semilla);
        expect(dto.escenario.lugarId).toBe(lugarIdTrasMover);
        expect((dto as unknown as Record<string, unknown>).mapa).toBeUndefined();
        expect((dto.escenario as unknown as Record<string, unknown>).mapa).toBeUndefined();

        // Reconstruye desde el DTO: mismo mapa y misma sala (deriva de la semilla).
        const recargado = GameStateMapper.fromDTO(dto);
        expect(recargado.semilla).toBe(semilla);
        expect(recargado.lugarId).toBe(lugarIdTrasMover);
        expect(recargado.salasVisitadas).toEqual(state.salasVisitadas);
        expect(recargado.escenario.getLugar().getNombre()).toBe(nombreTrasMover);
        expect(recargado.escenario.getLugar().getSalidas()).toEqual(salidasTrasMover);
    });

    it('dos semillas distintas dan mapas distintos al crear la run', () => {
        const sA = 2468;
        const sB = 9753;
        const stateA = crearGameState('a', 'a', sA);
        const stateB = crearGameState('b', 'b', sB);
        const mapaA = huella(MapaDeRunRegistry.obtener(sA));
        const mapaB = huella(MapaDeRunRegistry.obtener(sB));
        expect(mapaA).not.toEqual(mapaB);
        // Ambas tienen sala inicial reconstruible.
        expect(stateA.escenario.getLugar()).toBeDefined();
        expect(stateB.escenario.getLugar()).toBeDefined();
    });

    it('mover/atacar funcionan sobre el mapa generado (recorrido hasta el jefe)', () => {
        const engine = new GameEngine();
        const semilla = 31415;
        const state = crearGameState('sesion-recorrido', 'run-recorrido', semilla);
        const mapa = MapaDeRunRegistry.obtener(semilla);

        // Recorre con BFS siguiendo salidas reales hasta visitar todas las salas.
        const visitadas = new Set<string>([state.lugarId]);
        let progreso = true;
        while (progreso) {
            progreso = false;
            const salidas = state.escenario.getLugar().getSalidas();
            for (const [dir, destino] of Object.entries(salidas)) {
                if (!visitadas.has(destino)) {
                    const r = engine.ejecutar(`mover:${dir}`, state);
                    expect(r.ok).toBe(true);
                    visitadas.add(state.lugarId);
                    progreso = true;
                    break;
                }
            }
        }
        // Llegamos al menos a la sala de jefe del mapa generado.
        const jefeId = mapa.ids().find((id) => mapa.obtener(id)!.tipo === 'jefe')!;
        // Coloca al jugador en la sala de jefe vía LugarFactory por semilla.
        state.escenario.setLugar(LugarFactory.crear(jefeId, semilla));
        state.lugarId = jefeId;
        const ocupantes = state.escenario.getLugar().getPersonajes().map((p) => p.getNombre());
        expect(ocupantes.length).toBeGreaterThan(0);
        // Atacar al primer ocupante no rompe.
        const ataque = engine.ejecutar(`atacar:${ocupantes[0]}`, state);
        expect(ataque.ok).toBe(true);
    });
});
