import { Rata } from '../src/Personaje/personajes/Rata';
import { Bandido } from '../src/Personaje/personajes/Bandido';
import { Ogro } from '../src/Personaje/personajes/Ogro';
import CatalogoEnemigos from '../src/Personaje/pools/CatalogoEnemigos';
import CatalogoOcupantes from '../src/Personaje/pools/CatalogoOcupantes';

describe('Enemigos nuevos (3f) — stats y recompensa', () => {
    it('Rata: stats débiles y botín pequeño', () => {
        const rata = new Rata();
        expect(rata.getNombre()).toBe('Rata');
        expect(rata.getVidaMaxima()).toBe(4);
        expect(rata.dadoDeGolpe()).toBe(2);
        expect(rata.claseDeArmadura()).toBe(8);
        expect(rata.getRecompensa()).toEqual({ oro: 3, plata: 1 });
    });

    it('Bandido: stats medios y botín moderado', () => {
        const bandido = new Bandido();
        expect(bandido.getNombre()).toBe('Bandido');
        expect(bandido.getVidaMaxima()).toBe(12);
        expect(bandido.dadoDeGolpe()).toBe(5);
        expect(bandido.claseDeArmadura()).toBe(12);
        expect(bandido.getRecompensa()).toEqual({ oro: 12, plata: 5 });
    });

    it('Ogro (jefe): stats altos y botín grande', () => {
        const ogro = new Ogro();
        expect(ogro.getNombre()).toBe('Ogro');
        expect(ogro.getVidaMaxima()).toBe(30);
        expect(ogro.dadoDeGolpe()).toBe(9);
        expect(ogro.claseDeArmadura()).toBe(15);
        expect(ogro.getRecompensa()).toEqual({ oro: 50, plata: 25 });
    });

    it('recibirDaño reduce la vida (atacable como cualquier Personaje)', () => {
        const ogro = new Ogro();
        ogro.recibirDaño(10);
        expect(ogro.getVidaActual()).toBe(20);
    });
});

describe('Pools de enemigos/ocupantes (para 3h)', () => {
    it('CatalogoEnemigos resuelve cada id a una instancia nueva', () => {
        expect(CatalogoEnemigos.ids()).toEqual(
            expect.arrayContaining(['rata', 'bandido', 'ogro'])
        );
        const a = CatalogoEnemigos.crear('ogro');
        const b = CatalogoEnemigos.crear('ogro');
        expect(a).toBeDefined();
        expect(a).not.toBe(b); // instancias distintas, sin estado compartido
        expect(a!.getNombre()).toBe('Ogro');
    });

    it('CatalogoEnemigos devuelve undefined para un id desconocido', () => {
        expect(CatalogoEnemigos.crear('dragon')).toBeUndefined();
    });

    it('CatalogoOcupantes resuelve enemigos y el NPC cantinero', () => {
        expect(CatalogoOcupantes.crear('rata')!.getNombre()).toBe('Rata');
        expect(CatalogoOcupantes.crear('cantinero')!.getNombre()).toBe('Cantinero Pepe');
        expect(CatalogoOcupantes.crear('nadie')).toBeUndefined();
    });
});
