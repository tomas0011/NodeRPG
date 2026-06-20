import CommandResult from '../Game/CommandResult';
import SesionContexto from '../Game/SesionContexto';

/**
 * Comando de **nivel sesión** (patrón Command, variante que opera sobre el
 * contexto de sesión en vez de sobre el `GameState` de la run).
 *
 * Lo implementan `crear` (sólo válido en el hub) y `abandonar` (sólo con run
 * activa): comandos del ciclo de vida de la run que necesitan ver el perfil y la
 * existencia (o no) de una run activa, cosa que `IComando` —centrado en el
 * `GameState`— no expone. El cierre real de la run (bankear/archivar/borrar) NO
 * vive aquí: estos comandos sólo crean la run o marcan su fin; el ciclo de
 * sesión hace el resto. Así el motor sigue sin depender de repositorios.
 */
export default interface IComandoSesion {
    getKey(): string;
    esComando(comando: string): boolean;
    ejecutar(agente: string, contexto: SesionContexto): CommandResult;
}
