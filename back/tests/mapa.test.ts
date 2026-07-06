import GameEngine from '../src/Game/GameEngine';
import crearGameState from '../src/Game/crearGameState';
import MapaDeRun from '../src/Escenario/MapaDeRun';
import MapaDeRunRegistry from '../src/Escenario/MapaDeRunRegistry';
import { proyectarMapa, SalaDeMapa } from '../src/Escenario/ProyeccionDeMapa';
import { DefinicionDeSala, TipoDeSala } from '../src/Escenario/MapaLayout';

/**
 * Minimapa (comando `mapa` + proyección BFS a grilla). Layout fijo (semilla 0):
 *
 *   bar --este-- pasillo --norte-- sala-combate --este-- sala-tienda
 *                   |                    |
 *                  sur                 norte
 *                   |                    |
 *             sala-descanso         sala-jefe
 */

function salaPorId(salas: SalaDeMapa[], id: string): SalaDeMapa {
    const sala = salas.find((s) => s.id === id);
    expect(sala).toBeDefined();
    return sala!;
}

describe('Comando mapa (niebla de guerra, layout fijo)', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
    });

    it('con la run recién creada muestra el bar visitado y el pasillo como incógnita', () => {
        const state = crearGameState('mapa-1');
        const resultado = engine.ejecutar('mapa', state);
        const data = resultado.data as { lugarActual: string; salas: SalaDeMapa[] };

        expect(resultado.ok).toBe(true);
        expect(resultado.message).toBe('Salas conocidas: 1. Estás en Bar Puerco Verde.');
        expect(data.lugarActual).toBe('bar');
        expect(data.salas).toHaveLength(2);

        const bar = salaPorId(data.salas, 'bar');
        expect(bar.visitada).toBe(true);
        expect(bar.nombre).toBe('Bar Puerco Verde');
        expect(bar.tipo).toBe('bar');
        expect(bar.salidas).toEqual(['este']);

        // La incógnita viaja sin nombre/tipo/salidas (niebla de guerra).
        const pasillo = salaPorId(data.salas, 'pasillo');
        expect(pasillo.visitada).toBe(false);
        expect(pasillo.nombre).toBeUndefined();
        expect(pasillo.tipo).toBeUndefined();
        expect(pasillo.salidas).toEqual([]);

        // El pasillo está al este del bar.
        expect(pasillo.x).toBe(bar.x + 1);
        expect(pasillo.y).toBe(bar.y);
    });

    it('mover descubre la sala y expone sus vecinas como incógnitas en posición relativa', () => {
        const state = crearGameState('mapa-2');
        engine.ejecutar('mover:este', state);

        const data = engine.ejecutar('mapa', state).data as {
            lugarActual: string;
            salas: SalaDeMapa[];
        };

        expect(data.lugarActual).toBe('pasillo');
        const bar = salaPorId(data.salas, 'bar');
        const pasillo = salaPorId(data.salas, 'pasillo');
        const combate = salaPorId(data.salas, 'sala-combate');
        const descanso = salaPorId(data.salas, 'sala-descanso');

        expect(pasillo.visitada).toBe(true);
        expect(pasillo.tipo).toBe('pasillo');
        expect(bar.visitada).toBe(true);
        expect(combate.visitada).toBe(false);
        expect(descanso.visitada).toBe(false);

        // Posiciones relativas (robustas a la normalización de la grilla).
        expect(pasillo.x).toBe(bar.x + 1);
        expect(pasillo.y).toBe(bar.y);
        expect(combate.x).toBe(pasillo.x);
        expect(combate.y).toBe(pasillo.y - 1);
        expect(descanso.x).toBe(pasillo.x);
        expect(descanso.y).toBe(pasillo.y + 1);

        // Las coordenadas normalizadas arrancan en (0,0).
        expect(Math.min(...data.salas.map((s) => s.x))).toBe(0);
        expect(Math.min(...data.salas.map((s) => s.y))).toBe(0);
    });

    it('el mapa completo del layout fijo no tiene celdas duplicadas', () => {
        const mapa = MapaDeRunRegistry.obtener(MapaDeRunRegistry.SEMILLA_LAYOUT_FIJO);
        const proyeccion = proyectarMapa(mapa, mapa.ids(), 'bar');

        expect(proyeccion.salas).toHaveLength(mapa.ids().length);
        const celdas = proyeccion.salas.map((s) => `${s.x},${s.y}`);
        expect(new Set(celdas).size).toBe(celdas.length);
    });
});

describe('proyectarMapa — determinismo y colisiones', () => {
    it('sobre un mapa generado por semilla es determinista y sin celdas duplicadas', () => {
        const mapa = MapaDeRunRegistry.obtener(12345);
        const a = proyectarMapa(mapa, mapa.ids(), mapa.lugarInicial());
        const b = proyectarMapa(mapa, mapa.ids(), mapa.lugarInicial());

        expect(a).toEqual(b);
        expect(a.salas).toHaveLength(mapa.ids().length);
        const celdas = a.salas.map((s) => `${s.x},${s.y}`);
        expect(new Set(celdas).size).toBe(celdas.length);
    });

    it('una arista que cae en una celda ocupada se desplaza sobre el mismo eje (determinista)', () => {
        // Ciclo no plano: A→B→C→D y D vuelve "al sur" hacia E, cuya celda ideal
        // es la de A. E debe desplazarse al siguiente múltiplo libre del delta.
        const salas: Record<string, Partial<DefinicionDeSala>> = {
            A: { salidas: { este: 'B' } },
            B: { salidas: { norte: 'C' } },
            C: { salidas: { oeste: 'D' } },
            D: { salidas: { sur: 'E' } },
            E: { salidas: {} }
        };
        const mapaFalso: MapaDeRun = {
            lugarInicial: () => 'A',
            ids: () => Object.keys(salas),
            obtener: (id: string) =>
                salas[id]
                    ? ({
                          id,
                          tipo: 'pasillo' as TipoDeSala,
                          nombre: `Sala ${id}`,
                          ocupantes: [],
                          objetos: [],
                          salidas: salas[id]!.salidas || {}
                      } as DefinicionDeSala)
                    : undefined,
            salidas: (id: string) => ({ ...(salas[id] ? salas[id]!.salidas || {} : {}) }),
            lootDeTipo: () => []
        };

        const proyeccion = proyectarMapa(mapaFalso, Object.keys(salas), 'A');
        const a = salaPorId(proyeccion.salas, 'A');
        const d = salaPorId(proyeccion.salas, 'D');
        const e = salaPorId(proyeccion.salas, 'E');

        // D está en la misma columna que A (una celda al norte); la celda ideal
        // de E (sur de D) es la de A → se desplaza un paso más al sur.
        expect(d.x).toBe(a.x);
        expect(d.y).toBe(a.y - 1);
        expect(e.x).toBe(d.x);
        expect(e.y).toBe(d.y + 2);

        const celdas = proyeccion.salas.map((s) => `${s.x},${s.y}`);
        expect(new Set(celdas).size).toBe(celdas.length);
    });
});
