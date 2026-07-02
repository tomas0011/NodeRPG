import GameEngine from '../src/Game/GameEngine';
import GameState from '../src/Game/GameState';
import crearGameState from '../src/Game/crearGameState';
import { Personaje } from '../src/Personaje/Personaje';
import { Objeto } from '../src/Objeto/Objeto';
import { PocionDeCuracion } from '../src/Objeto/objetos/PocionDeCuracion';
import { PocionDeDestreza } from '../src/Objeto/objetos/PocionDeDestreza';
import { Espada } from '../src/Objeto/objetos/Espada';
import EfectoCurar from '../src/Objeto/efectos/EfectoCurar';
import EfectoBuffDestreza from '../src/Objeto/efectos/EfectoBuffDestreza';
import EfectoVeneno from '../src/Objeto/efectos/EfectoVeneno';

/**
 * Cada IEfecto en aislamiento, sobre un personaje base controlable. Asserts
 * numéricos deterministas, sin red.
 */
describe('Efectos consumibles (deterministas, en aislamiento)', () => {
    it('EfectoCurar restaura vida hasta el delta pedido', () => {
        const p = new Personaje(20);
        p.recibirDaño(10); // vida 10/20
        const r = new EfectoCurar(5).aplicar(p);
        expect(r.vidaDelta).toBe(5);
        expect(p.getVidaActual()).toBe(15);
    });

    it('EfectoCurar no excede la vida máxima', () => {
        const p = new Personaje(20);
        p.recibirDaño(2); // vida 18/20
        const r = new EfectoCurar(5).aplicar(p); // sólo cabe +2
        expect(r.vidaDelta).toBe(2);
        expect(p.getVidaActual()).toBe(20);
    });

    it('EfectoCurar a vida llena cura 0 (no sobrepasa)', () => {
        const p = new Personaje(20); // vida 20/20
        const r = new EfectoCurar(5).aplicar(p);
        expect(r.vidaDelta).toBe(0);
        expect(p.getVidaActual()).toBe(20);
    });

    it('EfectoBuffDestreza sube la destreza', () => {
        const p = new Personaje(20); // destreza 1 por defecto
        const r = new EfectoBuffDestreza(3).aplicar(p);
        expect(r.destrezaDelta).toBe(3);
        expect(p.getDestreza()).toBe(4);
    });

    it('EfectoVeneno resta vida', () => {
        const p = new Personaje(20);
        const r = new EfectoVeneno(4).aplicar(p);
        expect(r.vidaDelta).toBe(-4);
        expect(p.getVidaActual()).toBe(16);
    });
});

describe('Comando usar (vía GameEngine)', () => {
    let engine: GameEngine;
    let state: GameState;

    beforeEach(() => {
        engine = new GameEngine();
        state = crearGameState('sesion-usar');
    });

    function tieneObjeto(nombre: string): boolean {
        return state.jugadorBase
            .getInventario()
            .getObjetos()
            .some((o: Objeto) => o.getNombre() === nombre);
    }

    it('usar poción de curación sube la vida sin exceder el máximo y consume la poción', () => {
        state.jugadorBase.getInventario().agregarObjeto(new PocionDeCuracion());
        // El jugador recibe daño primero.
        state.jugador.recibirDaño(8);
        const vidaAntes = state.jugador.getVidaActual();
        const vidaMaxima = state.jugador.getVidaMaxima();

        const r = engine.ejecutar('usar:poción de curación', state);

        expect(r.ok).toBe(true);
        const vidaDespues = state.jugador.getVidaActual();
        expect(vidaDespues).toBeGreaterThan(vidaAntes);
        expect(vidaDespues).toBeLessThanOrEqual(vidaMaxima);
        // Curación de 5 sobre la vida dañada.
        expect(vidaDespues).toBe(vidaAntes + 5);
        // Se consumió la poción.
        expect(tieneObjeto('poción de curación')).toBe(false);
    });

    it('usar una poción sin tilde y con mayúsculas mixtas resuelve el nombre canónico', () => {
        state.jugadorBase.getInventario().agregarObjeto(new PocionDeCuracion());
        state.jugador.recibirDaño(5);

        const r = engine.ejecutar('UsAr:PoCiOn De CuRaCiOn', state);
        const data = r.data as { objeto: string };

        expect(r.ok).toBe(true);
        expect(data.objeto).toBe('poción de curación');
        expect(r.message).toContain('"poción de curación"');
        expect(tieneObjeto('poción de curación')).toBe(false);
    });

    it('curar nunca excede la vida máxima', () => {
        state.jugadorBase.getInventario().agregarObjeto(new PocionDeCuracion());
        state.jugador.recibirDaño(2); // poca vida perdida
        const r = engine.ejecutar('usar:poción de curación', state);
        expect(r.ok).toBe(true);
        expect(state.jugador.getVidaActual()).toBe(state.jugador.getVidaMaxima());
    });

    it('usar poción de destreza sube la destreza y consume la poción', () => {
        state.jugadorBase.getInventario().agregarObjeto(new PocionDeDestreza());
        const destrezaAntes = state.jugador.getDestreza();

        const r = engine.ejecutar('usar:poción de destreza', state);

        expect(r.ok).toBe(true);
        expect(state.jugador.getDestreza()).toBe(destrezaAntes + 1);
        expect(tieneObjeto('poción de destreza')).toBe(false);
    });

    it('usar un objeto inexistente devuelve ok:false', () => {
        const r = engine.ejecutar('usar:poción de curación', state);
        expect(r.ok).toBe(false);
    });

    it('usar un objeto no consumible (espada) devuelve ok:false y no lo consume', () => {
        state.jugadorBase.getInventario().agregarObjeto(new Espada());
        const r = engine.ejecutar('usar:espada', state);
        expect(r.ok).toBe(false);
        expect(r.message).toContain('No se puede usar');
        expect(tieneObjeto('espada')).toBe(true);
    });

    it('puebla completions.usar con los consumibles del inventario', () => {
        state.jugadorBase.getInventario().agregarObjeto(new PocionDeCuracion());
        state.jugadorBase.getInventario().agregarObjeto(new Espada());
        const r = engine.ejecutar('usar:poción de curación', state);
        // Tras usar la poción ya no queda ningún consumible.
        expect(r.completions?.usar).toEqual([]);
    });
});
