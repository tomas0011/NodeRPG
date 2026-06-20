import { ProfileDTO, ResumenRun, RunHistoryDTO } from '../Persistence/dtos';
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
 * Igual con el **histórico (3j)**: el ciclo de sesión carga del
 * `RunHistoryRepository` los resúmenes de la sesión (`historial`) y el detalle de
 * cada run propia (`detalles`, ya filtrado por pertenencia a la sesión) y los
 * inyecta aquí; los comandos `historial`/`detalle` sólo **leen** de este
 * contexto. Así el motor/comandos siguen sin depender de Mongo.
 */
export default class SesionContexto {
    public readonly profile: ProfileDTO;

    /** Run activa, o `null` si el jugador está en el hub. */
    public state: GameState | null;

    /** Crea una run nueva, la enlaza al perfil y la deja como activa. */
    private readonly iniciador: () => GameState;

    /**
     * Resúmenes de las runs archivadas **de esta sesión** (histórico, 3j). Ya
     * vienen filtrados por `sessionId` desde el `RunHistoryRepository.list`. Sólo
     * lectura: los comandos no lo mutan.
     */
    public readonly historial: ResumenRun[];

    /**
     * Detalle completo de cada run archivada **de esta sesión**, indexado por
     * `runId`. Pre-cargado en el ciclo de sesión únicamente para las runs que
     * pertenecen a la sesión (filtrado estructural de pertenencia: una run de
     * otra sesión NUNCA entra en este mapa, por lo que `detalle:<runId>` ajeno no
     * la encuentra). Sólo lectura.
     */
    private readonly detalles: Map<string, RunHistoryDTO>;

    constructor(
        profile: ProfileDTO,
        state: GameState | null,
        iniciador: () => GameState,
        historial: ResumenRun[] = [],
        detalles: Map<string, RunHistoryDTO> = new Map()
    ) {
        this.profile = profile;
        this.state = state;
        this.iniciador = iniciador;
        this.historial = historial;
        this.detalles = detalles;
    }

    /**
     * Devuelve el detalle de una run archivada **de esta sesión**, o `null` si el
     * `runId` no existe o pertenece a otra sesión (no está en el mapa pre-cargado
     * por pertenencia). Sólo lectura: no toca repositorios ni muta nada.
     */
    public getDetalleHistorico(runId: string): RunHistoryDTO | null {
        return this.detalles.get(runId) ?? null;
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
