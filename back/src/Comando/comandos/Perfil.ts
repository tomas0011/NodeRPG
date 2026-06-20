import CommandResult from '../../Game/CommandResult';
import SesionContexto from '../../Game/SesionContexto';
import IComandoSesion from '../IComandoSesion';

/**
 * Comando `perfil` — muestra el estado **durable** del perfil (hub): la **plata**
 * persistente acumulada entre runs y las mejoras desbloqueadas. Es un comando de
 * **nivel sesión** porque consulta el perfil, no el `GameState` de la run; es
 * válido tanto en el hub (sin run activa) como durante una run.
 *
 * Separación de monedas (3c): el **oro** es de la run y se ve en `status`; la
 * **plata** es del perfil y se ve aquí. Si hay una run en curso, además informa
 * la plata aún sin bancar (`plataAcumulada`), que se sumará al perfil al cerrar.
 */
export default class Perfil implements IComandoSesion {
    getKey(): string {
        return 'perfil';
    }

    esComando(comando: string): boolean {
        return comando === this.getKey();
    }

    ejecutar(_agente: string, contexto: SesionContexto): CommandResult {
        const profile = contexto.profile;
        const enHub = contexto.enHub();
        const plataSinBancar = contexto.state ? contexto.state.plataAcumulada : 0;

        const mejoras = profile.mejoras.length ? profile.mejoras.join(', ') : 'ninguna';
        const lineaRun = enHub
            ? ''
            : `\n            Plata sin bancar (run actual): ${plataSinBancar}`;
        const message = `
            Plata: ${profile.plata}
            Mejoras: ${mejoras}${lineaRun}
        `;

        return {
            ok: true,
            message,
            data: {
                sessionId: profile.sessionId,
                plata: profile.plata,
                mejoras: profile.mejoras.slice(),
                enHub,
                plataSinBancar
            }
        };
    }
}
