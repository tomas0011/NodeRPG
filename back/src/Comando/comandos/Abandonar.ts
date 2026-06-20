import CommandResult from '../../Game/CommandResult';
import SesionContexto from '../../Game/SesionContexto';
import IComandoSesion from '../IComandoSesion';

/**
 * Comando `abandonar` — termina la run actual voluntariamente. Sólo válido con
 * **run activa**; en el hub responde `ok:false`.
 *
 * Comparte cierre con la muerte: sólo **marca** la run como terminada por
 * `abandono` (setea el flag en el `GameState`). El cierre real
 * (bankear plata → archivar al histórico → borrar de activas → limpiar
 * `runActivaId`) lo ejecuta el ciclo de sesión tras este comando.
 */
export default class Abandonar implements IComandoSesion {
    getKey(): string {
        return 'abandonar';
    }

    esComando(comando: string): boolean {
        return comando === this.getKey();
    }

    ejecutar(_agente: string, contexto: SesionContexto): CommandResult {
        const state = contexto.state;
        if (state === null) {
            return {
                ok: false,
                message: 'No hay ninguna run activa que abandonar. Usa "crear" para empezar una.'
            };
        }

        state.terminar('abandono');

        return {
            ok: true,
            message: 'Abandonas la partida. Se banca tu plata y vuelves al hub.',
            data: {
                terminada: true,
                causaFin: state.causaFin
            }
        };
    }
}
