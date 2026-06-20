import GameEngine from '../src/Game/GameEngine';
import SessionManager from '../src/Persistence/SessionManager';
import { InMemoryProfileRepository } from '../src/Persistence/ProfileRepository';
import { InMemoryRunRepository } from '../src/Persistence/RunRepository';
import { InMemoryRunHistoryRepository } from '../src/Persistence/RunHistoryRepository';

/**
 * Tests del **ciclo de la run** (sub-fase 3b) con repos **InMemory**: hub →
 * `crear` → jugar → morir/`abandonar` → cierre (bankear/archivar/borrar/limpiar
 * runActivaId) → hub. NINGUNO toca la red.
 */

function nuevoEntorno() {
    const profileRepo = new InMemoryProfileRepository();
    const runRepo = new InMemoryRunRepository();
    const historyRepo = new InMemoryRunHistoryRepository();
    const engine = new GameEngine();
    const sm = new SessionManager(profileRepo, runRepo, historyRepo);
    return { profileRepo, runRepo, historyRepo, engine, sm };
}

describe('Hub vs run (sin auto-crear)', () => {
    it('arranca en el hub: comandos de juego responden ok:false pidiendo crear', async () => {
        const { engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('s');
        expect(sesion.contexto.enHub()).toBe(true);

        const status = engine.ejecutarSesion('status', sesion.contexto);
        expect(status.ok).toBe(false);
        expect(status.message.toLowerCase()).toContain('crear');
        expect((status.data as { enHub: boolean }).enHub).toBe(true);

        const atacar = engine.ejecutarSesion('atacar:Cantinero Pepe', sesion.contexto);
        expect(atacar.ok).toBe(false);
    });

    it('crear en el hub inicia la run y deja de estar en el hub', async () => {
        const { engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('s');
        const r = engine.ejecutarSesion('crear', sesion.contexto);
        expect(r.ok).toBe(true);
        expect(sesion.contexto.enHub()).toBe(false);
        expect(sesion.profile.runActivaId).toBeDefined();
        // Ahora los comandos de juego funcionan.
        const status = engine.ejecutarSesion('status', sesion.contexto);
        expect(status.ok).toBe(true);
    });

    it('crear con run ya activa responde ok:false', async () => {
        const { engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('s');
        engine.ejecutarSesion('crear', sesion.contexto);
        const segundo = engine.ejecutarSesion('crear', sesion.contexto);
        expect(segundo.ok).toBe(false);
    });

    it('abandonar en el hub responde ok:false', async () => {
        const { engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('s');
        const r = engine.ejecutarSesion('abandonar', sesion.contexto);
        expect(r.ok).toBe(false);
    });
});

describe('Cierre por abandono (loop completo sin HTTP)', () => {
    it('abandonar banca la plata, archiva la run, la borra de activas y vuelve al hub', async () => {
        const { profileRepo, runRepo, historyRepo, engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('jugador-1');
        engine.ejecutarSesion('crear', sesion.contexto);
        await sm.guardar(sesion);

        const runId = sesion.profile.runActivaId!;
        // Simula plata acumulada en la run (su generación es 3c).
        sesion.contexto.state!.plataAcumulada = 25;

        const r = engine.ejecutarSesion('abandonar', sesion.contexto);
        expect(r.ok).toBe(true);
        expect(sesion.contexto.state!.terminada).toBe(true);
        expect(sesion.contexto.state!.causaFin).toBe('abandono');

        await sm.cerrarSiTermino(sesion.contexto);
        await sm.guardar(sesion);

        // Vuelve al hub.
        expect(sesion.contexto.enHub()).toBe(true);
        // Plata bankeada al perfil.
        const perfil = await profileRepo.load('jugador-1');
        expect(perfil!.plata).toBe(25);
        expect(perfil!.runActivaId).toBeUndefined();
        // Run borrada de activas.
        expect(await runRepo.load(runId)).toBeNull();
        // Run archivada en el histórico.
        const lista = await historyRepo.list('jugador-1');
        expect(lista).toHaveLength(1);
        expect(lista[0].runId).toBe(runId);
        expect(lista[0].causa).toBe('abandono');
        expect(lista[0].plataBankeada).toBe(25);
    });
});

describe('Cierre por muerte (contraataque determinista)', () => {
    it('atacar al Cantinero sin arma mata al jugador por el contraataque, de forma reproducible', async () => {
        const { engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('jugador-2');
        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;

        // El jugador base tiene 10 de vida; CA 11 → mitigación floor(11/10)=1;
        // Cantinero dado 4 → contraataque 3/exchange. Sin arma, el jugador no
        // mata al Cantinero (10 de vida) antes de morir. Secuencia fija:
        let ultima = engine.ejecutarSesion('atacar:Cantinero Pepe', sesion.contexto);
        let golpes = 1;
        while (!state.terminada && golpes < 20) {
            ultima = engine.ejecutarSesion('atacar:Cantinero Pepe', sesion.contexto);
            golpes++;
        }

        expect(state.terminada).toBe(true);
        expect(state.causaFin).toBe('muerte');
        expect(state.jugador.getVidaActual()).toBeLessThanOrEqual(0);
        expect((ultima.data as { murioJugador: boolean }).murioJugador).toBe(true);
        // Muerte reproducible: con 10 de vida y 3 de daño por exchange, muere al 4º.
        expect(golpes).toBe(4);
    });

    it('la muerte cierra la run: archiva, borra y vuelve al hub con la plata bankeada', async () => {
        const { profileRepo, runRepo, historyRepo, engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('jugador-3');
        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;
        state.plataAcumulada = 10;
        const runId = state.runId;

        // Golpea hasta morir por el contraataque.
        for (let i = 0; i < 20 && !state.terminada; i++) {
            engine.ejecutarSesion('atacar:Cantinero Pepe', sesion.contexto);
        }
        expect(state.terminada).toBe(true);

        await sm.cerrarSiTermino(sesion.contexto);
        await sm.guardar(sesion);

        expect(sesion.contexto.enHub()).toBe(true);
        const perfil = await profileRepo.load('jugador-3');
        expect(perfil!.plata).toBe(10);
        expect(perfil!.runActivaId).toBeUndefined();
        expect(await runRepo.load(runId)).toBeNull();
        const lista = await historyRepo.list('jugador-3');
        expect(lista).toHaveLength(1);
        expect(lista[0].causa).toBe('muerte');
        expect(lista[0].vidaActual).toBe(0);
    });

    it('tras cerrar, una nueva resolver arranca en el hub y se puede crear otra run', async () => {
        const { engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('jugador-4');
        engine.ejecutarSesion('crear', sesion.contexto);
        engine.ejecutarSesion('abandonar', sesion.contexto);
        await sm.cerrarSiTermino(sesion.contexto);
        await sm.guardar(sesion);

        const sesion2 = await sm.resolver('jugador-4');
        expect(sesion2.contexto.enHub()).toBe(true);
        const r = engine.ejecutarSesion('crear', sesion2.contexto);
        expect(r.ok).toBe(true);
        expect(sesion2.contexto.enHub()).toBe(false);
    });
});
