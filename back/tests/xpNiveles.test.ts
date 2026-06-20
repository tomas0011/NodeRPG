import GameEngine from '../src/Game/GameEngine';
import GameState from '../src/Game/GameState';
import crearGameState from '../src/Game/crearGameState';
import GameStateMapper from '../src/Persistence/GameStateMapper';
import { RunDTO, ProfileDTO, SCHEMA_VERSION } from '../src/Persistence/dtos';
import { InMemoryProfileRepository } from '../src/Persistence/ProfileRepository';
import { InMemoryRunRepository } from '../src/Persistence/RunRepository';
import { InMemoryRunHistoryRepository } from '../src/Persistence/RunHistoryRepository';
import SessionManager from '../src/Persistence/SessionManager';
import { Personaje } from '../src/Personaje/Personaje';
import { PersonajeJugable } from '../src/Personaje/personajes/Jugador';
import CurvaDeNivel from '../src/Personaje/CurvaDeNivel';
import { Rata } from '../src/Personaje/personajes/Rata';
import { Cantinero } from '../src/Personaje/personajes/Cantinero';
import { Bandido } from '../src/Personaje/personajes/Bandido';
import { Ogro } from '../src/Personaje/personajes/Ogro';

/**
 * Tests 3i (XP / niveles dentro de la run). Deterministas, InMemory, sin red.
 */

describe('XP por enemigo (getXp, separado de recompensa/botín)', () => {
    it('cada enemigo expone su XP coherente', () => {
        expect(new Rata().getXp()).toBe(5);
        expect(new Cantinero().getXp()).toBe(8);
        expect(new Bandido().getXp()).toBe(20);
        expect(new Ogro().getXp()).toBe(100);
    });

    it('getXp es independiente de getRecompensa y getBotin', () => {
        const ogro = new Ogro();
        expect(ogro.getXp()).toBe(100);
        // Las otras recompensas no cambian por existir XP.
        expect(ogro.getRecompensa()).toEqual({ oro: 50, plata: 25 });
        expect(ogro.getBotin()).toEqual(['armadura de placas', 'martillo']);
    });

    it('un Personaje base no otorga XP por defecto', () => {
        expect(new Personaje().getXp()).toBe(0);
    });
});

describe('Curva de nivel (punto único, determinista)', () => {
    it('XP para subir del nivel n al n+1 = n * XP_BASE', () => {
        expect(CurvaDeNivel.xpParaSiguiente(1)).toBe(100);
        expect(CurvaDeNivel.xpParaSiguiente(2)).toBe(200);
        expect(CurvaDeNivel.xpParaSiguiente(3)).toBe(300);
    });
});

describe('ganarXp en el Personaje (acumular y subir de nivel)', () => {
    it('arranca en nivel 1 con xp 0', () => {
        const p = new PersonajeJugable('Heroe', 10);
        expect(p.nivel).toBe(1);
        expect(p.xp).toBe(0);
    });

    it('acumula XP sin subir si no cruza el umbral', () => {
        const p = new PersonajeJugable('Heroe', 10);
        const r = p.ganarXp(40);
        expect(r.subioNivel).toBe(false);
        expect(r.nivelesSubidos).toBe(0);
        expect(p.nivel).toBe(1);
        expect(p.xp).toBe(40);
        expect(r.xpParaSiguiente).toBe(100);
    });

    it('sube un nivel al cruzar el umbral y aumenta vidaMaxima/destreza', () => {
        const p = new PersonajeJugable('Heroe', 10);
        const destrezaAntes = p.destreza;
        const r = p.ganarXp(100); // umbral nivel 1 = 100
        expect(r.subioNivel).toBe(true);
        expect(r.nivelesSubidos).toBe(1);
        expect(p.nivel).toBe(2);
        expect(p.xp).toBe(0); // consumió 100
        expect(p.vidaMaxima).toBe(10 + CurvaDeNivel.VIDA_POR_NIVEL);
        expect(p.destreza).toBe(destrezaAntes + CurvaDeNivel.DESTREZA_POR_NIVEL);
        expect(p.vidaActual).toBe(p.vidaMaxima); // curado al nuevo máximo
    });

    it('sube VARIOS niveles de golpe si la XP alcanza', () => {
        const p = new PersonajeJugable('Heroe', 10);
        // nivel 1→2 cuesta 100, 2→3 cuesta 200, 3→4 cuesta 300. Total a nivel 4 = 600.
        const r = p.ganarXp(650);
        expect(r.nivelesSubidos).toBe(3);
        expect(p.nivel).toBe(4);
        expect(p.xp).toBe(50); // 650 - 600 sobrante hacia nivel 4→5
        expect(p.vidaMaxima).toBe(10 + 3 * CurvaDeNivel.VIDA_POR_NIVEL);
        expect(p.destreza).toBe(1 + 3 * CurvaDeNivel.DESTREZA_POR_NIVEL);
        expect(r.xpParaSiguiente).toBe(CurvaDeNivel.xpParaSiguiente(4));
    });

    it('ignora cantidades no positivas', () => {
        const p = new PersonajeJugable('Heroe', 10);
        p.ganarXp(50);
        const r = p.ganarXp(-100);
        expect(r.xpGanada).toBe(0);
        expect(r.subioNivel).toBe(false);
        expect(p.xp).toBe(50);
        expect(p.nivel).toBe(1);
    });
});

describe('Atacar otorga XP al derrotar y reporta la subida', () => {
    let engine: GameEngine;
    let state: GameState;

    beforeEach(() => {
        engine = new GameEngine();
        state = crearGameState('sesion-xp');
    });

    function cantinero(): Personaje {
        return state.escenario
            .getLugar()
            .getPersonajes()
            .find((p) => p.getNombre() === 'Cantinero Pepe')!;
    }

    it('matar un enemigo otorga su getXp() al jugador', () => {
        const npc = cantinero();
        npc.vidaActual = 1; // un golpe lo mata
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        const data = r.data as { murio: boolean; xpGanada: number; xp: number; nivel: number };
        expect(data.murio).toBe(true);
        expect(data.xpGanada).toBe(8); // XP del Cantinero
        expect(state.jugador.xp).toBe(8);
        expect(data.nivel).toBe(1);
    });

    it('no otorga XP si el NPC sobrevive', () => {
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        const data = r.data as { murio: boolean; xpGanada: number };
        expect(data.murio).toBe(false);
        expect(data.xpGanada).toBe(0);
        expect(state.jugador.xp).toBe(0);
    });

    it('al cruzar el umbral sube de nivel y lo refleja en data y mensaje', () => {
        // Lleva al jugador a 95 XP (nivel 1); matar al Cantinero (8 XP) cruza 100.
        state.jugador.ganarXp(95);
        const npc = cantinero();
        npc.vidaActual = 1;
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        const data = r.data as { subioNivel: boolean; nivelesSubidos: number; nivel: number };
        expect(data.subioNivel).toBe(true);
        expect(data.nivelesSubidos).toBe(1);
        expect(data.nivel).toBe(2);
        expect(state.jugador.nivel).toBe(2);
        expect(r.message).toContain('nivel');
    });

    it('matar un Ogro (100 XP) sube de nivel de golpe', () => {
        // Inyecta un Ogro débil en la sala y lo mata: 100 XP => nivel 1→2 exacto.
        const ogro = new Ogro();
        ogro.vidaActual = 1;
        state.escenario.getLugar().getPersonajes().push(ogro);
        const r = engine.ejecutar('atacar:Ogro', state);
        const data = r.data as { subioNivel: boolean; nivel: number; xpGanada: number };
        expect(data.xpGanada).toBe(100);
        expect(data.subioNivel).toBe(true);
        expect(data.nivel).toBe(2);
    });

    it('con el jugador DECORADO (equipo equipado), data.nivel/xp NO quedan undefined', () => {
        // Equipa la espada => state.jugador pasa a ser un PersonajeDecorador.
        engine.ejecutar('tomar:espada', state);
        engine.ejecutar('equipar:espada', state);
        expect(state.equipados).toContain('espada');

        const npc = cantinero();
        npc.vidaActual = 1; // muere de un golpe, otorga 8 XP
        const r = engine.ejecutar('atacar:Cantinero Pepe', state);
        const data = r.data as { xp: number; nivel: number; xpParaSiguiente: number };
        // Sin getters reenviados, el decorador devolvería undefined aquí.
        expect(data.xp).toBe(8);
        expect(data.nivel).toBe(1);
        expect(data.xpParaSiguiente).toBe(100);

        // Y GetStatus con jugador decorado también reporta valores reales.
        const s = engine.ejecutar('status', state);
        const sd = s.data as { nivel: number; xp: number };
        expect(sd.nivel).toBe(1);
        expect(sd.xp).toBe(8);
    });
});

describe('GetStatus muestra nivel y xp', () => {
    it('incluye nivel/xp/xpParaSiguiente en content y data', () => {
        const engine = new GameEngine();
        const state = crearGameState('sesion-status-xp');
        state.jugador.ganarXp(150); // nivel 2, xp 50 hacia 3 (umbral 200)
        const r = engine.ejecutar('status', state);
        const data = r.data as { nivel: number; xp: number; xpParaSiguiente: number };
        expect(data.nivel).toBe(2);
        expect(data.xp).toBe(50);
        expect(data.xpParaSiguiente).toBe(200);
        expect(r.message).toContain('Nivel');
        expect(r.message).toContain('XP');
    });
});

describe('Persistencia v2: round-trip y tolerancia v1→v2', () => {
    it('SCHEMA_VERSION es 2', () => {
        expect(SCHEMA_VERSION).toBe(2);
    });

    it('round-trip toDTO/fromDTO conserva xp y nivel', () => {
        const state = crearGameState('sesion-rt-xp', 'run-rt-xp', 3);
        state.jugador.ganarXp(250); // nivel 2, xp 50
        const nivelAntes = state.jugadorBase.nivel;
        const xpAntes = state.jugadorBase.xp;
        const vidaMaxAntes = state.jugadorBase.getVidaMaxima();
        const destrezaAntes = state.jugadorBase.getDestreza();

        const dto = GameStateMapper.toDTO(state);
        expect(dto.jugador.xp).toBe(xpAntes);
        expect(dto.jugador.nivel).toBe(nivelAntes);

        const reconstruido = GameStateMapper.fromDTO(dto);
        expect(reconstruido.jugadorBase.xp).toBe(xpAntes);
        expect(reconstruido.jugadorBase.nivel).toBe(nivelAntes);
        // vidaMaxima/destreza ya elevadas viajan en el DTO; no se re-aplican.
        expect(reconstruido.jugadorBase.getVidaMaxima()).toBe(vidaMaxAntes);
        expect(reconstruido.jugadorBase.getDestreza()).toBe(destrezaAntes);
    });

    it('un DTO v1 sin xp/nivel cae a nivel:1 / xp:0 (tolerante)', () => {
        const dtoV1 = {
            runId: 'r-v1',
            sessionId: 's-v1',
            schemaVersion: 1,
            semilla: 0,
            jugador: {
                nombre: 'Viejo',
                vidaMaxima: 10,
                vidaActual: 7,
                destreza: 1,
                oro: 5,
                inventario: [],
                equipados: []
            },
            escenario: { lugarId: 'bar' }
        } as unknown as RunDTO;

        const state = GameStateMapper.fromDTO(dtoV1);
        expect(state.jugadorBase.nivel).toBe(1);
        expect(state.jugadorBase.xp).toBe(0);
        expect(state.jugadorBase.getVidaActual()).toBe(7);
    });
});

describe('XP/nivel NO van al perfil (efímeros con la run)', () => {
    it('el ProfileDTO no expone xp/nivel; al cerrar la run no se filtran al perfil', async () => {
        const profileRepo = new InMemoryProfileRepository();
        const runRepo = new InMemoryRunRepository();
        const historyRepo = new InMemoryRunHistoryRepository();
        const engine = new GameEngine();
        const sm = new SessionManager(profileRepo, runRepo, historyRepo);

        const sesion = await sm.resolver('sesion-perfil-xp');
        engine.ejecutarSesion('crear', sesion.contexto);
        const state = sesion.contexto.state!;
        state.jugador.ganarXp(350); // sube de nivel dentro de la run
        expect(state.jugador.nivel).toBeGreaterThan(1);
        await sm.guardar(sesion);

        // Cierra la run (abandono): banca plata, archiva, borra de activas.
        engine.ejecutarSesion('abandonar', sesion.contexto);
        await sm.guardar(sesion);

        const perfil: ProfileDTO | null = await profileRepo.load('sesion-perfil-xp');
        expect(perfil).not.toBeNull();
        // El perfil sólo tiene plata/mejoras/runActivaId; ninguna clave xp/nivel.
        expect(Object.keys(perfil as object)).not.toContain('xp');
        expect(Object.keys(perfil as object)).not.toContain('nivel');
        expect((perfil as unknown as { xp?: number }).xp).toBeUndefined();
        expect((perfil as unknown as { nivel?: number }).nivel).toBeUndefined();
    });
});
