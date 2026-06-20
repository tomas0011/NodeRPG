import { ProfileDTO } from '../Persistence/dtos';
import GameState from './GameState';

/**
 * Contexto de sesión sobre el que operan los comandos de **nivel sesión**
 * (`crear`, `abandonar`). A diferencia de los comandos de juego —que sólo
 * conocen el `GameState` de la run—, estos necesitan distinguir el **hub** (sin
 * run activa) de una **run en curso** y poder **iniciar** una run nueva.
 *
 * Modelo roguelike:
 * - `state === null` ⇒ el jugador está en el **hub** (sólo `crear` es válido).
 * - `state !== null` ⇒ hay **run activa** (comandos de juego válidos).
 *
 * El contexto NO importa repositorios: la creación de la run se inyecta como un
 * `iniciador` (closure) desde el ciclo de sesión, que es quien sabe persistir.
 * Así el motor/comandos siguen sin depender de Mongo.
 */
export default class SesionContexto {
    public readonly profile: ProfileDTO;

    /** Run activa, o `null` si el jugador está en el hub. */
    public state: GameState | null;

    /** Crea una run nueva, la enlaza al perfil y la deja como activa. */
    private readonly iniciador: () => GameState;

    constructor(
        profile: ProfileDTO,
        state: GameState | null,
        iniciador: () => GameState
    ) {
        this.profile = profile;
        this.state = state;
        this.iniciador = iniciador;
    }

    /** `true` si no hay run activa (el jugador está en el hub). */
    public enHub(): boolean {
        return this.state === null;
    }

    /**
     * Inicia una run nueva y la deja como `state` activo del contexto. El
     * llamador debe garantizar que se está en el hub (`crear` lo verifica).
     */
    public iniciarRun(): GameState {
        const nuevo = this.iniciador();
        this.state = nuevo;
        return nuevo;
    }
}
