import GameEngine from '../src/Game/GameEngine';
import crearGameState from '../src/Game/crearGameState';
import SessionManager from '../src/Persistence/SessionManager';
import { InMemoryProfileRepository } from '../src/Persistence/ProfileRepository';
import { InMemoryRunRepository } from '../src/Persistence/RunRepository';
import { InMemoryRunHistoryRepository } from '../src/Persistence/RunHistoryRepository';
import CatalogoMejoras from '../src/Tienda/CatalogoMejoras';
import CatalogoArticulos from '../src/Tienda/CatalogoArticulos';
import aplicarMejoras from '../src/Tienda/aplicarMejoras';

/**
 * Tests de la sub-fase 3d: tiendas (hub=plata→mejoras, en-run=oro→equipo) y la
 * aplicación de mejoras al crear la run (meta-progresión efectiva).
 * Deterministas, InMemory, sin red.
 */

function entorno() {
    const profileRepo = new InMemoryProfileRepository();
    const runRepo = new InMemoryRunRepository();
    const historyRepo = new InMemoryRunHistoryRepository();
    const engine = new GameEngine();
    const sm = new SessionManager(profileRepo, runRepo, historyRepo);
    return { profileRepo, runRepo, historyRepo, engine, sm };
}

describe('Catálogo como única fuente de precios/efectos', () => {
    it('el catálogo de mejoras (hub) está en plata y el de artículos (en-run) en oro', () => {
        for (const a of CatalogoMejoras.articulos()) {
            expect(a.moneda).toBe('plata');
            expect(a.costo).toBeGreaterThan(0);
        }
        for (const a of CatalogoArticulos.listar()) {
            expect(a.moneda).toBe('oro');
            expect(a.costo).toBeGreaterThan(0);
        }
    });
});

describe('Hub: comprar mejora con plata', () => {
    it('comprar una mejora baja profile.plata y añade el id a profile.mejoras', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('hub-comprar');
        expect(sesion.contexto.enHub()).toBe(true);
        const costo = CatalogoMejoras.obtener('vida_extra')!.articulo.costo;
        sesion.profile.plata = 100;

        const r = engine.ejecutarSesion('comprar:vida_extra', sesion.contexto);
        expect(r.ok).toBe(true);
        expect(sesion.profile.plata).toBe(100 - costo);
        expect(sesion.profile.mejoras).toContain('vida_extra');
    });

    it('comprar sin plata suficiente → ok:false y no cambia nada', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('hub-pobre');
        sesion.profile.plata = 1;

        const r = engine.ejecutarSesion('comprar:vida_extra', sesion.contexto);
        expect(r.ok).toBe(false);
        expect(sesion.profile.plata).toBe(1);
        expect(sesion.profile.mejoras).toHaveLength(0);
    });

    it('comprar una mejora inexistente → ok:false, sin cambios', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('hub-fake');
        sesion.profile.plata = 999;
        const r = engine.ejecutarSesion('comprar:no_existe', sesion.contexto);
        expect(r.ok).toBe(false);
        expect(sesion.profile.plata).toBe(999);
        expect(sesion.profile.mejoras).toHaveLength(0);
    });

    it('mejora no acumulable: comprarla dos veces falla la segunda vez', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('hub-unica');
        sesion.profile.plata = 1000;
        expect(CatalogoMejoras.obtener('empezar_con_espada')!.acumulable).toBe(false);

        const r1 = engine.ejecutarSesion('comprar:empezar_con_espada', sesion.contexto);
        expect(r1.ok).toBe(true);
        const r2 = engine.ejecutarSesion('comprar:empezar_con_espada', sesion.contexto);
        expect(r2.ok).toBe(false);
        expect(sesion.profile.mejoras.filter((m) => m === 'empezar_con_espada')).toHaveLength(1);
    });

    it('mejora acumulable: comprarla dos veces apila el id', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('hub-acum');
        sesion.profile.plata = 1000;
        expect(CatalogoMejoras.obtener('vida_extra')!.acumulable).toBe(true);

        engine.ejecutarSesion('comprar:vida_extra', sesion.contexto);
        engine.ejecutarSesion('comprar:vida_extra', sesion.contexto);
        expect(sesion.profile.mejoras.filter((m) => m === 'vida_extra')).toHaveLength(2);
    });
});

describe('Hub: la compra de mejora persiste vía el ciclo de sesión', () => {
    it('tras comprar y guardar, el perfil recargado conserva plata y mejoras', async () => {
        const { profileRepo, engine, sm } = entorno();
        const sesion = await sm.resolver('hub-persist');
        sesion.profile.plata = 100;
        engine.ejecutarSesion('comprar:vida_extra', sesion.contexto);
        await sm.guardar(sesion);

        const recargado = await profileRepo.load('hub-persist');
        expect(recargado!.plata).toBe(100 - CatalogoMejoras.obtener('vida_extra')!.articulo.costo);
        expect(recargado!.mejoras).toContain('vida_extra');
    });
});

describe('Aplicar mejoras al crear la run (meta-progresión)', () => {
    it('vida_extra sube la vida máxima inicial del personaje', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('meta-vida');
        sesion.profile.mejoras = ['vida_extra'];

        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;
        // Base 10 + 5 de vida_extra = 15.
        expect(state.jugador.getVidaMaxima()).toBe(15);
        expect(state.jugador.getVidaActual()).toBe(15);
    });

    it('vida_extra acumulada apila el efecto (dos compras = +10)', () => {
        const config = aplicarMejoras(['vida_extra', 'vida_extra']);
        expect(config.vidaMaxima).toBe(20);
    });

    it('destreza_extra sube la destreza inicial (y la clase de armadura)', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('meta-destreza');
        sesion.profile.mejoras = ['destreza_extra'];

        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;
        expect(state.jugador.getDestreza()).toBe(2); // base 1 + 1
        expect(state.jugador.claseDeArmadura()).toBe(12); // 10 + 2
    });

    it('empezar_con_espada deja la espada en el inventario al empezar', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('meta-espada');
        sesion.profile.mejoras = ['empezar_con_espada'];

        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;
        const inventario = state.jugador.getInventario().getObjetos().map((o) => o.getNombre());
        expect(inventario).toContain('espada');
    });

    it('sin mejoras, el personaje arranca con los stats base', () => {
        const state = crearGameState('meta-base');
        expect(state.jugador.getVidaMaxima()).toBe(10);
        expect(state.jugador.getDestreza()).toBe(1);
        expect(state.jugador.getInventario().getObjetos()).toHaveLength(0);
    });

    it('un id de mejora desconocido (dato viejo) se ignora sin romper', () => {
        const config = aplicarMejoras(['mejora_fantasma', 'vida_extra']);
        expect(config.vidaMaxima).toBe(15); // sólo vida_extra aplicó
    });

    it('comprar en el hub y luego crear: la mejora aplica de punta a punta', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('e2e-meta');
        sesion.profile.plata = 100;
        engine.ejecutarSesion('comprar:vida_extra', sesion.contexto);
        engine.ejecutarSesion('crear', sesion.contexto);
        expect(sesion.contexto.state!.jugador.getVidaMaxima()).toBe(15);
    });
});

describe('En run: comprar equipo con oro', () => {
    it('comprar baja el oro y añade el objeto al inventario de la run', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('run-comprar');
        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;
        state.jugador.ganarOro(100);
        const costo = CatalogoArticulos.obtener('espada')!.costo;

        const r = engine.ejecutarSesion('comprar:espada', sesion.contexto);
        expect(r.ok).toBe(true);
        expect(state.jugador.getOro()).toBe(100 - costo);
        const inventario = state.jugadorBase.getInventario().getObjetos().map((o) => o.getNombre());
        expect(inventario).toContain('espada');
    });

    it('comprar un artículo sin tilde y con mayúsculas mixtas lo guarda con su id canónico', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('run-pocion-mixta');
        engine.ejecutarSesion('CrEaR', sesion.contexto);
        const state = sesion.contexto.state!;
        state.jugador.ganarOro(100);

        const r = engine.ejecutarSesion('CoMpRaR:PoCiOn De CuRaCiOn', sesion.contexto);
        const data = r.data as { comprado: string; inventario: string[] };

        expect(r.ok).toBe(true);
        expect(data.comprado).toBe('poción de curación');
        expect(data.inventario).toContain('poción de curación');
        expect(r.message).toContain('Poción de curación');
    });

    it('comprar en-run sin oro suficiente → ok:false, sin cambios', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('run-pobre');
        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;
        // Sin oro (0). La espada cuesta > 0.
        const r = engine.ejecutarSesion('comprar:espada', sesion.contexto);
        expect(r.ok).toBe(false);
        expect(state.jugador.getOro()).toBe(0);
        const inventario = state.jugadorBase.getInventario().getObjetos().map((o) => o.getNombre());
        expect(inventario).not.toContain('espada');
    });

    it('comprar en-run un id que no está en el catálogo en-run → ok:false', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('run-fake');
        engine.ejecutarSesion('crear', sesion.contexto);
        sesion.contexto.state!.jugador.ganarOro(100);
        const r = engine.ejecutarSesion('comprar:no_existe', sesion.contexto);
        expect(r.ok).toBe(false);
    });

    it('en el hub no se vende equipo de oro: comprar un id de oro falla (es id de mejora)', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('hub-no-equipo');
        sesion.profile.plata = 1000;
        // "arco" es artículo en-run (oro), NO una mejora del hub.
        const r = engine.ejecutarSesion('comprar:arco', sesion.contexto);
        expect(r.ok).toBe(false);
    });
});

describe('Comando tienda: lista según contexto', () => {
    it('en el hub lista mejoras (plata) y puebla completions.comprar', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('tienda-hub');
        sesion.profile.plata = 1000;
        const r = engine.ejecutarSesion('tienda', sesion.contexto);
        expect(r.ok).toBe(true);
        expect((r.data as { moneda: string }).moneda).toBe('plata');
        const comprables = r.completions!.comprar;
        expect(comprables).toContain('vida_extra');
        expect(comprables).not.toContain('arco'); // arco es en-run, no de hub
    });

    it('en la run lista equipo (oro) y puebla completions.comprar con lo pagable', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('tienda-run');
        engine.ejecutarSesion('crear', sesion.contexto);
        sesion.contexto.state!.jugador.ganarOro(15);
        const r = engine.ejecutarSesion('tienda', sesion.contexto);
        expect(r.ok).toBe(true);
        expect((r.data as { moneda: string }).moneda).toBe('oro');
        // Con 15 de oro puede pagar la espada (15) pero no el martillo (25).
        expect(r.completions!.comprar).toContain('espada');
        expect(r.completions!.comprar).not.toContain('martillo');
    });
});

describe('Persistencia: equipo comprado en-run viaja en el DTO de la run', () => {
    it('tras comprar y guardar, el inventario de la run recargada incluye el objeto', async () => {
        const { runRepo, engine, sm } = entorno();
        const sesion = await sm.resolver('run-persist');
        engine.ejecutarSesion('crear', sesion.contexto);
        sesion.contexto.state!.jugador.ganarOro(100);
        engine.ejecutarSesion('comprar:espada', sesion.contexto);
        await sm.guardar(sesion);

        const runId = sesion.profile.runActivaId!;
        const dto = await runRepo.load(runId);
        expect(dto!.jugador.inventario).toContain('espada');
    });
});
