import GameEngine from '../src/Game/GameEngine';
import crearGameState from '../src/Game/crearGameState';
import GameStateMapper from '../src/Persistence/GameStateMapper';
import SessionManager from '../src/Persistence/SessionManager';
import { InMemoryProfileRepository } from '../src/Persistence/ProfileRepository';
import { InMemoryRunRepository } from '../src/Persistence/RunRepository';
import { InMemoryRunHistoryRepository } from '../src/Persistence/RunHistoryRepository';
import { RunDTO, ResumenRun, SCHEMA_VERSION } from '../src/Persistence/dtos';

/**
 * Tests de la Fase 2 con repositorios **InMemory**: round-trip sin pérdida,
 * separación de los tres agregados, multi-sesión y ciclo del SessionManager.
 * NINGUNO toca la red.
 */

describe('Round-trip toDTO → fromDTO (serialización sin pérdida)', () => {
    it('reconstruye el mismo claseDeArmadura/dadoDeGolpe/inventario con objetos equipados', () => {
        const engine = new GameEngine();
        const state = crearGameState('sesion-rt', 'run-rt', 42);

        // Toma y equipa espada + armadura de cuero.
        engine.ejecutar('tomar:espada', state);
        engine.ejecutar('tomar:armadura de cuero', state);
        engine.ejecutar('tomar:taza', state); // no equipable, sólo en inventario
        engine.ejecutar('equipar:espada', state);
        engine.ejecutar('equipar:armadura de cuero', state);

        const caBefore = state.jugador.claseDeArmadura();
        const golpeBefore = state.jugador.dadoDeGolpe();
        const invBefore = state.jugadorBase
            .getInventario()
            .getObjetos()
            .map((o) => o.getNombre())
            .sort();
        const equipBefore = state.equipados.slice();

        // Serializa y reconstruye.
        const dto = GameStateMapper.toDTO(state);
        const reconstruido = GameStateMapper.fromDTO(dto);

        expect(reconstruido.jugador.claseDeArmadura()).toBe(caBefore);
        expect(reconstruido.jugador.dadoDeGolpe()).toBe(golpeBefore);
        const invAfter = reconstruido.jugadorBase
            .getInventario()
            .getObjetos()
            .map((o) => o.getNombre())
            .sort();
        expect(invAfter).toEqual(invBefore);
        expect(reconstruido.equipados).toEqual(equipBefore);

        // Y los stats no son triviales (los decoradores realmente aplicaron).
        expect(caBefore).toBe(14); // armadura de cuero: 13 + destreza(1)
        expect(golpeBefore).toBe(6); // espada
    });

    it('el DTO tiene la forma esperada y schemaVersion', () => {
        const state = crearGameState('s', 'r', 7);
        const dto = GameStateMapper.toDTO(state);
        expect(dto.runId).toBe('r');
        expect(dto.sessionId).toBe('s');
        expect(dto.semilla).toBe(7);
        expect(dto.schemaVersion).toBe(SCHEMA_VERSION);
        expect(dto.escenario.lugarId).toBe('bar');
        expect(Array.isArray(dto.jugador.inventario)).toBe(true);
        expect(Array.isArray(dto.jugador.equipados)).toBe(true);
        expect(dto.jugador.oro).toBe(0);
    });

    it('deserialización tolerante: campos nuevos ausentes caen a defaults', () => {
        // DTO mínimo simulando un doc viejo sin oro/salasVisitadas.
        const dtoParcial = {
            runId: 'r2',
            sessionId: 's2',
            schemaVersion: 1,
            semilla: 0,
            jugador: {
                nombre: 'Heroe',
                vidaMaxima: 10,
                vidaActual: 8,
                destreza: 1,
                inventario: ['espada'],
                equipados: ['espada']
            },
            escenario: { lugarId: 'bar' }
        } as unknown as RunDTO;

        const state = GameStateMapper.fromDTO(dtoParcial);
        expect(state.jugadorBase.getOro()).toBe(0);
        expect(state.jugadorBase.getVidaActual()).toBe(8);
        expect(state.salasVisitadas).toEqual([]);
        expect(state.jugador.dadoDeGolpe()).toBe(6); // espada reconstruida y equipada
    });
});

describe('Separación de agregados y ciclos de vida', () => {
    it('borrar la run NO borra el perfil', async () => {
        const profileRepo = new InMemoryProfileRepository();
        const runRepo = new InMemoryRunRepository();

        const perfil = await profileRepo.create('sesion-X');
        const state = crearGameState('sesion-X', 'run-X', 1);
        await runRepo.save(GameStateMapper.toDTO(state));
        perfil.runActivaId = 'run-X';
        await profileRepo.save(perfil);

        // Borra la run (lo que hará el cierre en Fase 3).
        await runRepo.delete('run-X');

        expect(await runRepo.load('run-X')).toBeNull();
        const perfilTrasBorrar = await profileRepo.load('sesion-X');
        expect(perfilTrasBorrar).not.toBeNull();
        expect(perfilTrasBorrar!.sessionId).toBe('sesion-X');
    });

    it('archive guarda el snapshot inmutable en el histórico y list/getDetalle lo recuperan', async () => {
        const historyRepo = new InMemoryRunHistoryRepository();
        const state = crearGameState('sesion-H', 'run-H', 9);
        const dto = GameStateMapper.toDTO(state);
        const resumen: ResumenRun = {
            runId: 'run-H',
            sessionId: 'sesion-H',
            nombre: 'Tomas',
            salasVisitadas: 0,
            oro: 0,
            terminadaEn: new Date().toISOString()
        };

        await historyRepo.archive(dto, resumen);

        const lista = await historyRepo.list('sesion-H');
        expect(lista).toHaveLength(1);
        expect(lista[0].runId).toBe('run-H');

        const detalle = await historyRepo.getDetalle('run-H');
        expect(detalle).not.toBeNull();
        expect(detalle!.detalle.runId).toBe('run-H');
    });
});

describe('Multi-sesión a nivel repositorio', () => {
    it('dos sessionId mantienen perfiles independientes', async () => {
        const profileRepo = new InMemoryProfileRepository();
        const a = await profileRepo.create('A');
        const b = await profileRepo.create('B');
        a.plata = 100;
        a.mejoras.push('mas-vida');
        await profileRepo.save(a);

        const cargadoA = await profileRepo.load('A');
        const cargadoB = await profileRepo.load('B');
        expect(cargadoA!.plata).toBe(100);
        expect(cargadoA!.mejoras).toEqual(['mas-vida']);
        expect(cargadoB!.plata).toBe(0);
        expect(cargadoB!.mejoras).toEqual([]);
        expect(b.sessionId).toBe('B');
    });

    it('dos sessionId mantienen runs independientes', async () => {
        const runRepo = new InMemoryRunRepository();
        const stateA = crearGameState('A', 'runA', 1);
        const stateB = crearGameState('B', 'runB', 2);
        stateA.jugadorBase.oro = 50;
        await runRepo.save(GameStateMapper.toDTO(stateA));
        await runRepo.save(GameStateMapper.toDTO(stateB));

        const dtoA = await runRepo.load('runA');
        const dtoB = await runRepo.load('runB');
        expect(dtoA!.jugador.oro).toBe(50);
        expect(dtoB!.jugador.oro).toBe(0);
        expect(dtoA!.sessionId).toBe('A');
        expect(dtoB!.sessionId).toBe('B');
    });
});

describe('SessionManager (caché write-through, repos InMemory)', () => {
    function nuevoSM() {
        return new SessionManager(
            new InMemoryProfileRepository(),
            new InMemoryRunRepository(),
            new InMemoryRunHistoryRepository()
        );
    }

    it('resuelve en el hub (sin run activa) sin auto-crear run', async () => {
        const sm = nuevoSM();
        const sesion = await sm.resolver('hub-sesion');
        expect(sesion.contexto.enHub()).toBe(true);
        expect(sesion.contexto.state).toBeNull();
        expect(sesion.profile.runActivaId).toBeUndefined();
    });

    it('crear inicia la run; persiste el equipo; recargar simulando reinicio lo recupera', async () => {
        const profileRepo = new InMemoryProfileRepository();
        const runRepo = new InMemoryRunRepository();
        const historyRepo = new InMemoryRunHistoryRepository();
        const engine = new GameEngine();

        // Primer "proceso": hub → crear → juega → guarda.
        const sm1 = new SessionManager(profileRepo, runRepo, historyRepo);
        const sesion1 = await sm1.resolver('mi-sesion');
        engine.ejecutarSesion('crear', sesion1.contexto);
        engine.ejecutarSesion('tomar:espada', sesion1.contexto);
        engine.ejecutarSesion('equipar:espada', sesion1.contexto);
        await sm1.guardar(sesion1);
        const state1 = sesion1.contexto.state!;
        const golpeAntes = state1.jugador.dadoDeGolpe();

        // Segundo "proceso": caché vacía, recarga la run activa desde los repos.
        const sm2 = new SessionManager(profileRepo, runRepo, historyRepo);
        const sesion2 = await sm2.resolver('mi-sesion');
        expect(sesion2.contexto.enHub()).toBe(false);
        const state2 = sesion2.contexto.state!;
        expect(state2.equipados).toContain('espada');
        expect(state2.jugador.dadoDeGolpe()).toBe(golpeAntes);
        expect(sesion2.profile.runActivaId).toBe(sesion1.profile.runActivaId);
    });

    it('genera un sessionId si no llega ninguno', async () => {
        const sm = nuevoSM();
        const sesion = await sm.resolver(undefined);
        expect(typeof sesion.sessionId).toBe('string');
        expect(sesion.sessionId.length).toBeGreaterThan(0);
    });

    it('el perfil sobrevive aunque se borre la run activa', async () => {
        const profileRepo = new InMemoryProfileRepository();
        const runRepo = new InMemoryRunRepository();
        const historyRepo = new InMemoryRunHistoryRepository();
        const engine = new GameEngine();
        const sm = new SessionManager(profileRepo, runRepo, historyRepo);

        const sesion = await sm.resolver('sesion-persistente');
        engine.ejecutarSesion('crear', sesion.contexto);
        await sm.guardar(sesion);
        const runId = sesion.profile.runActivaId!;

        await runRepo.delete(runId);

        const perfil = await profileRepo.load('sesion-persistente');
        expect(perfil).not.toBeNull();
        expect(perfil!.sessionId).toBe('sesion-persistente');
    });

    it('si el perfil apunta a una run inexistente, resolver cae al hub y desenlaza', async () => {
        const profileRepo = new InMemoryProfileRepository();
        const runRepo = new InMemoryRunRepository();
        const historyRepo = new InMemoryRunHistoryRepository();
        const sm = new SessionManager(profileRepo, runRepo, historyRepo);

        const perfil = await profileRepo.create('huerfana');
        perfil.runActivaId = 'run-que-no-existe';
        await profileRepo.save(perfil);

        const sesion = await sm.resolver('huerfana');
        expect(sesion.contexto.enHub()).toBe(true);
        expect(sesion.profile.runActivaId).toBeUndefined();
    });
});
