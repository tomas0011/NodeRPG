import GameEngine from '../src/Game/GameEngine';
import SessionManager from '../src/Persistence/SessionManager';
import { InMemoryProfileRepository } from '../src/Persistence/ProfileRepository';
import { InMemoryRunRepository } from '../src/Persistence/RunRepository';
import { InMemoryRunHistoryRepository } from '../src/Persistence/RunHistoryRepository';
import { ResumenRun, RunDTO } from '../src/Persistence/dtos';

/**
 * Tests del **histórico de lectura (3j)** con repos **InMemory**: tras archivar
 * runs (vía el flujo de cierre del SessionManager o `archive` directo), los
 * comandos `historial`/`detalle` las exponen en sólo lectura. Validan la
 * pertenencia a la sesión (no se exponen runs de otra sesión) y el motor/comando
 * no importan Mongo. NINGUNO toca la red.
 */

function nuevoEntorno() {
    const profileRepo = new InMemoryProfileRepository();
    const runRepo = new InMemoryRunRepository();
    const historyRepo = new InMemoryRunHistoryRepository();
    const engine = new GameEngine();
    const sm = new SessionManager(profileRepo, runRepo, historyRepo);
    return { profileRepo, runRepo, historyRepo, engine, sm };
}

/** Archiva una run mínima directa en el repo (sin jugar), para tests de lectura. */
async function archivarRun(
    historyRepo: InMemoryRunHistoryRepository,
    sessionId: string,
    runId: string,
    extra: Partial<ResumenRun> = {}
) {
    const dto: RunDTO = {
        runId,
        sessionId,
        schemaVersion: 2,
        semilla: 1,
        plataAcumulada: 0,
        jugador: {
            nombre: extra.nombre ?? 'Heroe',
            vidaMaxima: 10,
            vidaActual: extra.vidaActual ?? 0,
            destreza: 1,
            oro: extra.oro ?? 0,
            xp: 0,
            nivel: extra.nivel ?? 1,
            inventario: ['espada'],
            equipados: ['espada']
        },
        escenario: { lugarId: 'bar', salasVisitadas: [] }
    };
    const resumen: ResumenRun = {
        runId,
        sessionId,
        nombre: extra.nombre ?? 'Heroe',
        salasVisitadas: extra.salasVisitadas ?? 0,
        oro: extra.oro ?? 0,
        nivel: extra.nivel ?? 1,
        vidaActual: extra.vidaActual ?? 0,
        plataBankeada: extra.plataBankeada ?? 0,
        causa: extra.causa ?? 'abandono',
        terminadaEn: extra.terminadaEn ?? new Date().toISOString()
    };
    await historyRepo.archive(dto, resumen);
}

describe('historial (lista de runs archivadas)', () => {
    it('lista las 2 runs archivadas de la sesión con sus datos', async () => {
        const { historyRepo, engine, sm } = nuevoEntorno();
        await archivarRun(historyRepo, 's1', 'run-a', { nombre: 'Aria', causa: 'muerte', nivel: 3, plataBankeada: 12 });
        await archivarRun(historyRepo, 's1', 'run-b', { nombre: 'Borja', causa: 'abandono', nivel: 1, plataBankeada: 4 });

        const sesion = await sm.resolver('s1');
        const r = engine.ejecutarSesion('historial', sesion.contexto);

        expect(r.ok).toBe(true);
        const data = r.data as { runs: ResumenRun[] };
        expect(data.runs).toHaveLength(2);
        const nombres = data.runs.map((x) => x.nombre).sort();
        expect(nombres).toEqual(['Aria', 'Borja']);
        const aria = data.runs.find((x) => x.runId === 'run-a')!;
        expect(aria.causa).toBe('muerte');
        expect(aria.nivel).toBe(3);
        expect(aria.plataBankeada).toBe(12);
        // content humano lista numerada con ambos nombres.
        expect(r.message).toContain('Aria');
        expect(r.message).toContain('Borja');
        // completions.detalle con los runIds disponibles.
        expect((r.completions!.detalle).sort()).toEqual(['run-a', 'run-b']);
    });

    it('sin runs archivadas: mensaje amable y lista vacía', async () => {
        const { engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('vacia');
        const r = engine.ejecutarSesion('historial', sesion.contexto);

        expect(r.ok).toBe(true);
        expect((r.data as { runs: ResumenRun[] }).runs).toHaveLength(0);
        expect(r.message.toLowerCase()).toContain('crear');
        expect(r.completions!.detalle).toEqual([]);
    });

    it('sólo lista las runs de la propia sesión (no las de otra)', async () => {
        const { historyRepo, engine, sm } = nuevoEntorno();
        await archivarRun(historyRepo, 's1', 'run-propia');
        await archivarRun(historyRepo, 's2', 'run-ajena');

        const sesion = await sm.resolver('s1');
        const r = engine.ejecutarSesion('historial', sesion.contexto);
        const runs = (r.data as { runs: ResumenRun[] }).runs;
        expect(runs).toHaveLength(1);
        expect(runs[0].runId).toBe('run-propia');
    });
});

describe('detalle:<runId> (detalle de una run archivada)', () => {
    it('devuelve el detalle de una run propia', async () => {
        const { historyRepo, engine, sm } = nuevoEntorno();
        await archivarRun(historyRepo, 's1', 'run-a', { nombre: 'Aria', causa: 'muerte', nivel: 3 });

        const sesion = await sm.resolver('s1');
        const r = engine.ejecutarSesion('detalle:run-a', sesion.contexto);

        expect(r.ok).toBe(true);
        const data = r.data as { resumen: ResumenRun; detalle: RunDTO };
        expect(data.resumen.runId).toBe('run-a');
        expect(data.detalle.runId).toBe('run-a');
        expect(data.detalle.jugador.nombre).toBe('Aria');
        expect(r.message).toContain('Aria');
        expect(r.message).toContain('muerte');
    });

    it('runId inexistente → ok:false', async () => {
        const { historyRepo, engine, sm } = nuevoEntorno();
        await archivarRun(historyRepo, 's1', 'run-a');
        const sesion = await sm.resolver('s1');
        const r = engine.ejecutarSesion('detalle:no-existe', sesion.contexto);
        expect(r.ok).toBe(false);
    });

    it('runId de OTRA sesión → ok:false (no expone runs ajenas)', async () => {
        const { historyRepo, engine, sm } = nuevoEntorno();
        await archivarRun(historyRepo, 's2', 'run-ajena');
        const sesion = await sm.resolver('s1');
        const r = engine.ejecutarSesion('detalle:run-ajena', sesion.contexto);
        expect(r.ok).toBe(false);
    });

    it('sin runId → ok:false pidiendo el runId', async () => {
        const { engine, sm } = nuevoEntorno();
        const sesion = await sm.resolver('s1');
        const r = engine.ejecutarSesion('detalle', sesion.contexto);
        expect(r.ok).toBe(false);
    });
});

describe('Integración con el flujo de cierre real (archivado por SessionManager)', () => {
    it('tras crear+abandonar 2 runs, historial lista 2 y detalle de una funciona', async () => {
        const { engine, sm } = nuevoEntorno();

        // Run 1: crear → abandonar → cerrar.
        const s1 = await sm.resolver('jugador');
        engine.ejecutarSesion('crear', s1.contexto);
        const runId1 = s1.profile.runActivaId!;
        engine.ejecutarSesion('abandonar', s1.contexto);
        await sm.cerrarSiTermino(s1.contexto);
        await sm.guardar(s1);

        // Run 2: nueva resolver (hub) → crear → abandonar → cerrar.
        const s2 = await sm.resolver('jugador');
        engine.ejecutarSesion('crear', s2.contexto);
        const runId2 = s2.profile.runActivaId!;
        engine.ejecutarSesion('abandonar', s2.contexto);
        await sm.cerrarSiTermino(s2.contexto);
        await sm.guardar(s2);

        // Tercera resolver (hub): el histórico ya tiene 2 runs.
        const s3 = await sm.resolver('jugador');
        const lista = engine.ejecutarSesion('historial', s3.contexto);
        expect(lista.ok).toBe(true);
        expect((lista.data as { runs: ResumenRun[] }).runs).toHaveLength(2);

        const det = engine.ejecutarSesion(`detalle:${runId1}`, s3.contexto);
        expect(det.ok).toBe(true);
        expect((det.data as { detalle: RunDTO }).detalle.runId).toBe(runId1);

        // El otro runId también es accesible.
        const det2 = engine.ejecutarSesion(`detalle:${runId2}`, s3.contexto);
        expect(det2.ok).toBe(true);
    });
});

describe('Sólo lectura', () => {
    it('ejecutar historial/detalle no modifica el histórico', async () => {
        const { historyRepo, engine, sm } = nuevoEntorno();
        await archivarRun(historyRepo, 's1', 'run-a');

        const antes = await historyRepo.list('s1');
        const detalleAntes = await historyRepo.getDetalle('run-a');

        const sesion = await sm.resolver('s1');
        engine.ejecutarSesion('historial', sesion.contexto);
        engine.ejecutarSesion('detalle:run-a', sesion.contexto);

        const despues = await historyRepo.list('s1');
        const detalleDespues = await historyRepo.getDetalle('run-a');
        expect(despues).toEqual(antes);
        expect(detalleDespues).toEqual(detalleAntes);
    });
});
