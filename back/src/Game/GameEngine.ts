import AyudaDeComando from "../Comando/AyudaDeComando";
import IComando from "../Comando/IComando";
import IComandoSesion from "../Comando/IComandoSesion";
import {
    Abandonar,
    Atacar,
    Comprar,
    CrearPersonaje,
    Detalle,
    EquiparObjeto,
    GetEscenario,
    GetHelp,
    GetStatus,
    Historial,
    InspeccionarObjeto,
    Mover,
    Perfil,
    Tienda,
    TomarObjeto,
    UsarObjeto
} from "../Comando";
import { resolverValorCanonico } from "../Input/normalizarEntrada";
import CommandResult from "./CommandResult";
import GameState from "./GameState";
import SesionContexto from "./SesionContexto";

/**
 * Motor del juego. Reemplaza al antiguo `ComandoManager` como orquestador de
 * comandos, pero **sin estado de juego propio**: el `GameState` entra por
 * parámetro en cada `ejecutar`, así el motor es testeable sin HTTP ni globales
 * y soporta múltiples sesiones simultáneas.
 *
 * Dos familias de comandos:
 * - **De juego** (`IComando`): operan sobre el `GameState` de la run. Requieren
 *   run activa.
 * - **De sesión** (`IComandoSesion`): `crear`/`abandonar`, el ciclo de vida de
 *   la run. Operan sobre el `SesionContexto` (hub vs run).
 *
 * El ciclo de sesión usa `ejecutarSesion`, que enruta: comando de sesión →
 * comando de juego (si hay run) → hub (`ok:false` pidiendo `crear`). El motor
 * NO depende de repositorios: el cierre de la run vive en el ciclo de sesión.
 */
export default class GameEngine {
    public readonly comandos: IComando[];
    public readonly comandosSesion: IComandoSesion[];
    private readonly catalogoDeAyudas: { [clave: string]: AyudaDeComando } = {
        escenario: {
            clave: 'escenario',
            uso: 'escenario',
            descripcion: 'Muestra el lugar actual, sus personajes, objetos y salidas.'
        },
        help: {
            clave: 'help',
            uso: 'help',
            descripcion: 'Lista todos los comandos disponibles con una breve explicación.'
        },
        status: {
            clave: 'status',
            uso: 'status',
            descripcion: 'Muestra tu estado actual: vida, nivel, oro, equipo y estadísticas.'
        },
        tomar: {
            clave: 'tomar',
            uso: 'tomar:<objeto>',
            descripcion: 'Recoge un objeto del lugar actual y lo guarda en tu inventario.'
        },
        inspeccionar: {
            clave: 'inspeccionar',
            uso: 'inspeccionar:<objeto>',
            descripcion: 'Muestra la descripción y las propiedades de un objeto que lleves en el inventario.'
        },
        equipar: {
            clave: 'equipar',
            uso: 'equipar:<objeto>',
            descripcion: 'Equipa un objeto de tu inventario si se puede usar como equipo.'
        },
        atacar: {
            clave: 'atacar',
            uso: 'atacar:<objetivo>',
            descripcion: 'Ataca a un objetivo presente en la sala actual con tu arma actual.'
        },
        usar: {
            clave: 'usar',
            uso: 'usar:<objeto>',
            descripcion: 'Usa un objeto consumible que tengas en tu inventario.'
        },
        mover: {
            clave: 'mover',
            uso: 'mover:<dirección>',
            descripcion: 'Te desplaza por una salida válida de la sala actual.'
        },
        crear: {
            clave: 'crear',
            uso: 'crear',
            descripcion: 'Inicia una nueva run desde el hub.'
        },
        abandonar: {
            clave: 'abandonar',
            uso: 'abandonar',
            descripcion: 'Termina la run actual, banca la plata y te devuelve al hub.'
        },
        perfil: {
            clave: 'perfil',
            uso: 'perfil',
            descripcion: 'Muestra la plata persistente, tus mejoras y el estado de la sesión.'
        },
        tienda: {
            clave: 'tienda',
            uso: 'tienda',
            descripcion: 'Lista la tienda disponible en el contexto actual, sea hub o run.'
        },
        comprar: {
            clave: 'comprar',
            uso: 'comprar:<id>',
            descripcion: 'Compra una mejora o un artículo según la tienda disponible.'
        },
        historial: {
            clave: 'historial',
            uso: 'historial',
            descripcion: 'Lista las runs archivadas de tu sesión actual.'
        },
        detalle: {
            clave: 'detalle',
            uso: 'detalle:<runId>',
            descripcion: 'Muestra el detalle completo de una run guardada en tu historial.'
        }
    };

    constructor() {
        // GetHelp necesita conocer el catálogo disponible; se lo inyectamos
        // para no reintroducir un acceso global al manager.
        const getHelp = new GetHelp(() => this.todasLasAyudas());
        this.comandos = [
            new GetEscenario(),
            getHelp,
            new GetStatus(),
            new TomarObjeto(),
            new InspeccionarObjeto(),
            new EquiparObjeto(),
            new Atacar(),
            new UsarObjeto(),
            new Mover()
        ];
        this.comandosSesion = [
            getHelp,
            new CrearPersonaje(),
            new Abandonar(),
            new Perfil(),
            new Tienda(),
            new Comprar(),
            new Historial(),
            new Detalle()
        ];
    }

    private getComando(comando: string): IComando | undefined {
        return resolverValorCanonico(comando, this.comandos, (c: IComando) => c.getKey());
    }

    private getComandoSesion(comando: string): IComandoSesion | undefined {
        return resolverValorCanonico(comando, this.comandosSesion, (c: IComandoSesion) => c.getKey());
    }

    /** Ayudas de todos los comandos (juego + sesión), para el `GetHelp`. */
    private todasLasAyudas(): AyudaDeComando[] {
        const claves = [
            ...this.comandos.map((c) => c.getKey()),
            ...this.comandosSesion.map((c) => c.getKey())
        ].filter((clave, indice, todas) => todas.indexOf(clave) === indice);

        return claves.map((clave) => this.obtenerAyuda(clave));
    }

    private obtenerAyuda(clave: string): AyudaDeComando {
        return this.catalogoDeAyudas[clave] || {
            clave,
            uso: clave,
            descripcion: 'Sin descripción disponible.'
        };
    }

    /**
     * Parsea la entrada con formato `"comando: agente"` y delega en el comando
     * de juego correspondiente, pasándole el `state`. Punto de entrada de los
     * comandos de juego (requieren run activa); el ciclo de sesión usa
     * `ejecutarSesion`.
     * @throws Error si el comando no existe (la ruta lo mapea a HTTP 400).
     */
    public ejecutar(input: string, state: GameState): CommandResult {
        const [comando, agente] = this.parsear(input);
        const comandoFound = this.getComando(comando);
        if (!comandoFound) {
            throw new Error('Comando no encontrado');
        }
        return comandoFound.ejecutar(agente, state);
    }

    /**
     * Punto de entrada del **ciclo de sesión**. Enruta el comando según el
     * ámbito:
     * 1. Comando de sesión (`crear`/`abandonar`) → opera sobre el contexto.
     * 2. Comando de juego con run activa → opera sobre el `state`.
     * 3. Comando de juego en el hub → `ok:false` pidiendo `crear`.
     *
     * El motor sólo ejecuta el comando; el cierre de la run (si `state.terminada`)
     * lo dispara el ciclo de sesión tras esta llamada.
     * @throws Error si el comando no existe.
     */
    public ejecutarSesion(input: string, contexto: SesionContexto): CommandResult {
        const [comando, agente] = this.parsear(input);

        const sesion = this.getComandoSesion(comando);
        if (sesion) {
            return sesion.ejecutar(agente, contexto);
        }

        const juego = this.getComando(comando);
        if (!juego) {
            throw new Error('Comando no encontrado');
        }
        if (contexto.state === null) {
            return {
                ok: false,
                message: `Estás en el hub: no hay run activa. Usa "crear" para empezar una partida.`,
                data: { enHub: true }
            };
        }
        return juego.ejecutar(agente, contexto.state);
    }

    private parsear(input: string): [string, string] {
        const fragmentos = input.split(':');
        const comando = (fragmentos[0] || '').trim();
        const agente = fragmentos.slice(1).join(':').trim();
        return [comando, agente];
    }
}
