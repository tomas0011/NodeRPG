import CommandResult from '../../Game/CommandResult';
import SesionContexto from '../../Game/SesionContexto';
import IComandoSesion from '../IComandoSesion';

/**
 * Comando `crear` — inicia una run nueva. Sólo válido en el **hub** (sin run
 * activa); si ya hay run en curso responde `ok:false`.
 *
 * Crea una run nueva (semilla nueva, jugador base) vía `contexto.iniciarRun()`,
 * que la enlaza al perfil y la deja como run activa de la sesión. NO importa
 * repositorios: la persistencia la realiza el ciclo de sesión que inyectó el
 * iniciador.
 *
 * Meta-progresión (3d): `iniciarRun` aplica `profile.mejoras` a los stats e
 * inventario iniciales del personaje (vía `crearGameState`/`aplicarMejoras`), de
 * modo que las mejoras compradas en el hub se hacen efectivas aquí.
 */
export default class CrearPersonaje implements IComandoSesion {
    getKey(): string {
        return 'crear';
    }

    esComando(comando: string): boolean {
        return comando === this.getKey();
    }

    ejecutar(_agente: string, contexto: SesionContexto): CommandResult {
        if (!contexto.enHub()) {
            return {
                ok: false,
                message: 'Ya tienes una run activa. Termina (muere o usa "abandonar") antes de crear otra.'
            };
        }

        const state = contexto.iniciarRun();
        const jugador = state.jugador;
        const lugar = state.escenario.getLugar();

        return {
            ok: true,
            message: `Comienza una nueva partida. ${jugador.getNombre()} despierta en ${lugar.getNombre()} con ${jugador.getVidaActual()} de vida.`,
            data: {
                enHub: false,
                runId: state.runId,
                semilla: state.semilla,
                nombre: jugador.getNombre(),
                vidaActual: jugador.getVidaActual(),
                lugar: lugar.getNombre()
            }
        };
    }
}
