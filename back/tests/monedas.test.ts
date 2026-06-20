import GameEngine from '../src/Game/GameEngine';
import GameState from '../src/Game/GameState';
import crearGameState from '../src/Game/crearGameState';
import GameStateMapper from '../src/Persistence/GameStateMapper';
import SessionManager from '../src/Persistence/SessionManager';
import { InMemoryProfileRepository } from '../src/Persistence/ProfileRepository';
import { InMemoryRunRepository } from '../src/Persistence/RunRepository';
import { InMemoryRunHistoryRepository } from '../src/Persistence/RunHistoryRepository';
import { Cantinero } from '../src/Personaje/personajes/Cantinero';
import { Martillo } from '../src/Objeto/objetos/Martillo';

/**
 * Tests de la sub-fase 3c: las dos monedas (oro efímero de la run + plata
 * persistente del perfil). Deterministas, InMemory, sin red.
 *
 * Recompensa del Cantinero (fija, sin azar): { oro: 15, plata: 10 }.
 */

const ORO_CANTINERO = 15;
const PLATA_CANTINERO = 10;

function cantineroDe(state: GameState) {
    return state.escenario
        .getLugar()
        .getPersonajes()
        .find((p) => p.getNombre() === 'Cantinero Pepe')!;
}

/** Prepara un state con martillo equipado (golpe 13) y Cantinero con 5 de vida. */
function stateConMartillo(engine: GameEngine, sessionId: string): GameState {
    const state = crearGameState(sessionId);
    state.jugadorBase.getInventario().agregarObjeto(new Martillo());
    engine.ejecutar('equipar:martillo', state);
    cantineroDe(state).vidaActual = 5; // un golpe de martillo (13) lo mata
    return state;
}

describe('Botín del enemigo (getRecompensa)', () => {
    it('el Cantinero declara su botín; el Personaje base no da nada', () => {
        expect(new Cantinero().getRecompensa()).toEqual({ oro: ORO_CANTINERO, plata: PLATA_CANTINERO });
    });
});

describe('Otorgar botín al derrotar al Cantinero (vía atacar)', () => {
    it('suma el oro al jugador de la run y la plata a plataAcumulada', () => {
        const engine = new GameEngine();
        const state = stateConMartillo(engine, 'monedas-1');
        expect(state.jugador.getOro()).toBe(0);
        expect(state.plataAcumulada).toBe(0);

        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        expect(r.ok).toBe(true);

        const data = r.data as {
            murio: boolean;
            oroGanado: number;
            plataGanada: number;
            oroTotal: number;
            plataAcumulada: number;
        };
        expect(data.murio).toBe(true);
        expect(data.oroGanado).toBe(ORO_CANTINERO);
        expect(data.plataGanada).toBe(PLATA_CANTINERO);
        expect(data.oroTotal).toBe(ORO_CANTINERO);
        expect(data.plataAcumulada).toBe(PLATA_CANTINERO);

        // Estado mutado: oro en el jugador (base, vía decorador) y plata acumulada.
        expect(state.jugador.getOro()).toBe(ORO_CANTINERO);
        expect(state.jugadorBase.getOro()).toBe(ORO_CANTINERO);
        expect(state.plataAcumulada).toBe(PLATA_CANTINERO);
        expect(r.message).toContain('Botín');
    });

    it('no otorga botín si el NPC sobrevive al golpe', () => {
        const engine = new GameEngine();
        const state = crearGameState('monedas-2'); // sin arma: golpe de puños (2)
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        const data = r.data as { murio: boolean; oroGanado: number; plataGanada: number };
        expect(data.murio).toBe(false);
        expect(data.oroGanado).toBe(0);
        expect(data.plataGanada).toBe(0);
        expect(state.jugador.getOro()).toBe(0);
        expect(state.plataAcumulada).toBe(0);
    });
});

describe('Persistencia del oro en el round-trip toDTO/fromDTO', () => {
    it('el oro de la run viaja en el DTO y se restaura', () => {
        const engine = new GameEngine();
        const state = stateConMartillo(engine, 'monedas-3');
        engine.ejecutar('atacar:Cantinero Pepe', state);
        expect(state.jugador.getOro()).toBe(ORO_CANTINERO);

        const dto = GameStateMapper.toDTO(state);
        expect(dto.jugador.oro).toBe(ORO_CANTINERO);
        expect(dto.plataAcumulada).toBe(PLATA_CANTINERO);

        const restaurado = GameStateMapper.fromDTO(dto);
        expect(restaurado.jugador.getOro()).toBe(ORO_CANTINERO);
        expect(restaurado.plataAcumulada).toBe(PLATA_CANTINERO);
    });
});

describe('GetStatus refleja el oro de la run', () => {
    it('muestra el oro en content y data tras cobrar el botín', () => {
        const engine = new GameEngine();
        const state = stateConMartillo(engine, 'monedas-4');
        engine.ejecutar('atacar:Cantinero Pepe', state);

        const r = engine.ejecutar('status', state);
        expect((r.data as { oro: number }).oro).toBe(ORO_CANTINERO);
        expect(r.message).toContain(`Oro: ${ORO_CANTINERO}`);
    });
});

describe('Cierre de la run: plata bankeada al perfil, oro perdido', () => {
    function entorno() {
        const profileRepo = new InMemoryProfileRepository();
        const runRepo = new InMemoryRunRepository();
        const historyRepo = new InMemoryRunHistoryRepository();
        const engine = new GameEngine();
        const sm = new SessionManager(profileRepo, runRepo, historyRepo);
        return { profileRepo, runRepo, historyRepo, engine, sm };
    }

    it('al abandonar tras matar al Cantinero, la plata se banca y el oro NO viaja al perfil', async () => {
        const { profileRepo, engine, sm } = entorno();
        const sesion = await sm.resolver('jugador-monedas');
        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;

        // Equipa martillo, deja al Cantinero a 5 y lo mata: +15 oro, +10 plata.
        state.jugadorBase.getInventario().agregarObjeto(new Martillo());
        engine.ejecutarSesion('equipar:martillo', sesion.contexto);
        cantineroDe(state).vidaActual = 5;
        engine.ejecutarSesion('atacar:Cantinero Pepe', sesion.contexto);
        expect(state.jugador.getOro()).toBe(ORO_CANTINERO);
        expect(state.plataAcumulada).toBe(PLATA_CANTINERO);

        engine.ejecutarSesion('abandonar', sesion.contexto);
        await sm.cerrarSiTermino(sesion.contexto);
        await sm.guardar(sesion);

        const perfil = await profileRepo.load('jugador-monedas');
        // La plata se bancó (lo acumulado en la run).
        expect(perfil!.plata).toBe(PLATA_CANTINERO);
        // El perfil NO tiene noción de oro: el oro de la run se perdió.
        expect(perfil as unknown as { oro?: number }).not.toHaveProperty('oro');
        // Vuelve al hub: la run (con su oro) ya no existe.
        expect(sesion.contexto.enHub()).toBe(true);
    });
});

describe('Hub: el comando perfil muestra la plata persistente', () => {
    function entorno() {
        const profileRepo = new InMemoryProfileRepository();
        const runRepo = new InMemoryRunRepository();
        const historyRepo = new InMemoryRunHistoryRepository();
        const engine = new GameEngine();
        const sm = new SessionManager(profileRepo, runRepo, historyRepo);
        return { profileRepo, runRepo, historyRepo, engine, sm };
    }

    it('perfil es consultable en el hub (sin run activa) y muestra la plata', async () => {
        const { engine, sm } = entorno();
        const sesion = await sm.resolver('hub-1');
        expect(sesion.contexto.enHub()).toBe(true);
        sesion.profile.plata = 42;

        const r = engine.ejecutarSesion('perfil', sesion.contexto);
        expect(r.ok).toBe(true);
        expect((r.data as { plata: number }).plata).toBe(42);
        expect((r.data as { enHub: boolean }).enHub).toBe(true);
        expect(r.message).toContain('42');
    });
});
