import GameEngine from '../src/Game/GameEngine';
import GameState from '../src/Game/GameState';
import crearGameState from '../src/Game/crearGameState';
import { Personaje } from '../src/Personaje/Personaje';
import EspadaStrategy from '../src/Objeto/estrategias/EspadaStrategy';
import ArcoStrategy from '../src/Objeto/estrategias/ArcoStrategy';
import MartilloStrategy from '../src/Objeto/estrategias/MartilloStrategy';
import PunosStrategy from '../src/Objeto/estrategias/PunosStrategy';
import { Arco } from '../src/Objeto/objetos/Arco';
import { Martillo } from '../src/Objeto/objetos/Martillo';

/**
 * NPC de prueba con stats deterministas y controlables, para aislar las
 * fórmulas de cada estrategia sin depender de los stats concretos del Cantinero.
 */
class NpcDePrueba extends Personaje {
    private nombre: string;
    private ca: number;

    constructor(nombre: string, vida: number, ca: number) {
        super(vida);
        this.nombre = nombre;
        this.ca = ca;
    }

    getNombre(): string {
        return this.nombre;
    }

    claseDeArmadura(): number {
        return this.ca;
    }
}

/** Atacante de prueba con dadoDeGolpe y destreza inyectables. */
class AtacanteDePrueba extends Personaje {
    private dado: number;

    constructor(dado: number, destreza: number) {
        super(10);
        this.dado = dado;
        this.destreza = destreza;
    }

    dadoDeGolpe(): number {
        return this.dado;
    }
}

describe('Estrategias de ataque (deterministas, en aislamiento)', () => {
    it('EspadaStrategy: dadoDeGolpe + destreza - floor(CA/3)', () => {
        const atacante = new AtacanteDePrueba(6, 1); // espada equipada => dado 6
        const objetivo = new NpcDePrueba('Maniqui', 100, 11);
        const r = new EspadaStrategy().resolver(atacante, objetivo);
        // 6 + 1 - floor(11/3=3) = 4
        expect(r.daño).toBe(4);
        expect(objetivo.getVidaActual()).toBe(96);
    });

    it('ArcoStrategy: escala con destreza (dado + destreza*3 - floor(CA/3))', () => {
        const objetivo1 = new NpcDePrueba('Maniqui', 100, 11);
        const bajaDestreza = new AtacanteDePrueba(5, 1);
        const r1 = new ArcoStrategy().resolver(bajaDestreza, objetivo1);
        // 5 + 1*3 - 3 = 5
        expect(r1.daño).toBe(5);

        const objetivo2 = new NpcDePrueba('Maniqui', 100, 11);
        const altaDestreza = new AtacanteDePrueba(5, 4);
        const r2 = new ArcoStrategy().resolver(altaDestreza, objetivo2);
        // 5 + 4*3 - 3 = 14  -> escala claramente con destreza
        expect(r2.daño).toBe(14);
        expect(r2.daño).toBeGreaterThan(r1.daño);
    });

    it('MartilloStrategy: ignora armadura (dado + destreza + 5)', () => {
        const atacante = new AtacanteDePrueba(7, 1); // martillo => dado 7
        const objetivoBlando = new NpcDePrueba('Blando', 100, 1);
        const objetivoDuro = new NpcDePrueba('Duro', 100, 30);
        const blando = new MartilloStrategy().resolver(atacante, objetivoBlando);
        const duro = new MartilloStrategy().resolver(atacante, objetivoDuro);
        // 7 + 1 + 5 = 13, sin importar la armadura
        expect(blando.daño).toBe(13);
        expect(duro.daño).toBe(13);
    });

    it('PunosStrategy: daño mínimo max(1, floor(dado/2)), sin destreza ni armadura', () => {
        const atacante = new AtacanteDePrueba(4, 5);
        const objetivo = new NpcDePrueba('Maniqui', 100, 30);
        const r = new PunosStrategy().resolver(atacante, objetivo);
        // floor(4/2) = 2
        expect(r.daño).toBe(2);
    });

    it('Contra armadura alta, el martillo supera a la espada (rompe armadura)', () => {
        const objetivoEspada = new NpcDePrueba('Duro', 100, 18);
        const objetivoMartillo = new NpcDePrueba('Duro', 100, 18);
        const conEspada = new AtacanteDePrueba(6, 1);
        const conMartillo = new AtacanteDePrueba(7, 1);
        const espada = new EspadaStrategy().resolver(conEspada, objetivoEspada);
        const martillo = new MartilloStrategy().resolver(conMartillo, objetivoMartillo);
        // espada: 6+1-floor(18/3=6)=1 ; martillo: 7+1+5=13
        expect(espada.daño).toBe(1);
        expect(martillo.daño).toBe(13);
        expect(martillo.daño).toBeGreaterThan(espada.daño);
    });

    it('El daño nunca baja de 1', () => {
        const debil = new AtacanteDePrueba(1, 1);
        const blindado = new NpcDePrueba('Tanque', 100, 90);
        expect(new EspadaStrategy().resolver(debil, blindado).daño).toBe(1);
    });
});

describe('Comando atacar (vía GameEngine)', () => {
    let engine: GameEngine;
    let state: GameState;

    beforeEach(() => {
        engine = new GameEngine();
        state = crearGameState('sesion-atacar');
    });

    function cantinero(): Personaje {
        return state.escenario
            .getLugar()
            .getPersonajes()
            .find((p) => p.getNombre() === 'Cantinero Pepe')!;
    }

    it('sin arma equipada usa la estrategia de puños (daño 2 con dado base 4)', () => {
        const vidaAntes = cantinero().getVidaActual();
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        expect(r.ok).toBe(true);
        // dadoDeGolpe base 4 => floor(4/2)=2
        expect(cantinero().getVidaActual()).toBe(vidaAntes - 2);
        expect((r.data as { daño: number }).daño).toBe(2);
    });

    it('con espada equipada el daño sale de EspadaStrategy (CA Cantinero = 11)', () => {
        engine.ejecutar('tomar:espada', state);
        engine.ejecutar('equipar:espada', state);
        const vidaAntes = cantinero().getVidaActual();
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        expect(r.ok).toBe(true);
        // con espada: dado 6, destreza 1, CA 11 => 6+1-3 = 4
        expect((r.data as { daño: number }).daño).toBe(4);
        expect(cantinero().getVidaActual()).toBe(vidaAntes - 4);
    });

    it('atacar a un NPC inexistente devuelve ok:false', () => {
        const r = engine.ejecutar('atacar:Dragon', state);
        expect(r.ok).toBe(false);
        expect(r.message).toContain('Dragon');
    });

    it('puebla completions.atacar con los NPCs vivos de la sala', () => {
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        expect(r.completions?.atacar).toEqual(
            expect.arrayContaining(['Cantinero Pepe'])
        );
    });

    it('informa la muerte del NPC cuando su vida llega a <= 0', () => {
        // El martillo no está en el Bar: se inyecta en el inventario y se equipa.
        state.jugadorBase.getInventario().agregarObjeto(new Martillo());
        const equip = engine.ejecutar('equipar:martillo', state);
        expect(equip.ok).toBe(true);
        const npc = cantinero();
        // baja la vida del NPC a un valor que un golpe de martillo (13) supere
        npc.vidaActual = 5;
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        expect(r.ok).toBe(true);
        expect(r.message).toContain('murió');
        expect((r.data as { murio: boolean }).murio).toBe(true);
    });

    it('cada arma equipada produce su patrón de daño esperado contra el Cantinero', () => {
        const e = new GameEngine();

        // Espada (ya está en el Bar): tomar + equipar.
        const sEspada = crearGameState('s1');
        e.ejecutar('tomar:espada', sEspada);
        e.ejecutar('equipar:espada', sEspada);
        const dEspada = (e.ejecutar('atacar:Cantinero Pepe', sEspada).data as { daño: number }).daño;

        // Arco: se inyecta en el inventario y se equipa.
        const sArco = crearGameState('s2');
        sArco.jugadorBase.getInventario().agregarObjeto(new Arco());
        const equipArco = e.ejecutar('equipar:arco', sArco);
        expect(equipArco.ok).toBe(true);
        const dArco = (e.ejecutar('atacar:Cantinero Pepe', sArco).data as { daño: number }).daño;

        // Martillo: idem.
        const sMartillo = crearGameState('s3');
        sMartillo.jugadorBase.getInventario().agregarObjeto(new Martillo());
        const equipMartillo = e.ejecutar('equipar:martillo', sMartillo);
        expect(equipMartillo.ok).toBe(true);
        const dMartillo = (e.ejecutar('atacar:Cantinero Pepe', sMartillo).data as { daño: number }).daño;

        // espada 4, arco 5 (dado 5 + destreza*3 - 3), martillo 13
        expect(dEspada).toBe(4);
        expect(dArco).toBe(5);
        expect(dMartillo).toBe(13);
        expect(dMartillo).toBeGreaterThan(dEspada);
    });
});
