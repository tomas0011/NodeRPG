/**
 * Mapa de la run: **única fuente del grafo de salas** (layout fijo y
 * determinista en código).
 *
 * Hoy (3f) el mapa es un layout estático: un conjunto de nodos (salas) con su
 * tipo, nombre, ocupantes (enemigos/NPCs por id de catálogo), objetos por id, y
 * salidas (dirección → lugarId destino). Tanto `LugarFactory` (para reconstruir
 * una sala desde su `lugarId`) como el comando `mover` (para validar salidas)
 * consumen ESTA tabla — no hay conexiones hardcodeadas dispersas.
 *
 * 3h sustituirá esta tabla por generación procedural sembrada (un PRNG que
 * muestree los pools de salas/enemigos por `semilla`), manteniendo el mismo
 * contrato: id de sala → definición. Por eso el layout y los pools están
 * desacoplados de las clases concretas.
 */

/** Tipos de sala disponibles en el pool. La generación 3h elegirá de aquí. */
export type TipoDeSala =
    | 'bar'
    | 'pasillo'
    | 'combate'
    | 'descanso'
    | 'tienda'
    | 'jefe';

/**
 * Definición plana de una sala del mapa. Determinista por su `lugarId`:
 * reconstruir la misma sala siempre da el mismo nombre, ocupantes y salidas.
 */
export interface DefinicionDeSala {
    /** Id de la sala (clave del mapa, lo que se serializa como `lugarId`). */
    readonly id: string;
    /** Tipo de sala (selecciona la clase concreta en `LugarFactory`). */
    readonly tipo: TipoDeSala;
    /** Nombre legible de la sala. */
    readonly nombre: string;
    /** Ids de enemigos/NPCs (claves de `CatalogoEnemigos`/factorías de NPC). */
    readonly ocupantes: readonly string[];
    /** Ids de objetos presentes en la sala (claves de `ObjetoFactory`). */
    readonly objetos: readonly string[];
    /** Salidas: dirección/nombre → `lugarId` destino. */
    readonly salidas: Readonly<Record<string, string>>;
}

/**
 * Catálogo/pool de plantillas de sala por tipo. Declara, por tipo, los
 * ocupantes/objetos típicos. En 3f el layout fijo referencia estas plantillas;
 * en 3h la generación muestreará este pool por semilla. Añadir un tipo de sala
 * al juego = añadir aquí + registrar su clase en `LugarFactory`.
 */
export const POOL_DE_SALAS: Readonly<Record<TipoDeSala, { ocupantes: readonly string[]; objetos: readonly string[] }>> = {
    bar: { ocupantes: ['cantinero'], objetos: ['taza', 'espada', 'armadura de cuero'] },
    pasillo: { ocupantes: ['rata'], objetos: [] },
    combate: { ocupantes: ['bandido'], objetos: [] },
    descanso: { ocupantes: [], objetos: ['poción de curación'] },
    tienda: { ocupantes: [], objetos: [] },
    jefe: { ocupantes: ['ogro'], objetos: [] }
};

/**
 * **Tabla de botín por tipo de sala (loot encontrable, 3g).** Punto único que
 * declara, por tipo de sala, qué objetos encontrables aparecerían al "limpiar"
 * esa sala (ids de `ObjetoFactory`). Es una abstracción reutilizable pensada
 * para que **3h la muestree por semilla** y la siembre de forma determinista.
 *
 * **Decisión de alcance (documentada):** en 3f los objetos *fijos* de cada sala
 * ya viven en el `LAYOUT` (vía `POOL_DE_SALAS`), y el grueso del loot por
 * enemigo lo otorga `getBotin()` al derrotarlo (cae en la sala, ver `Atacar`).
 * Para no duplicar el layout fijo, esta tabla se mantiene **mínima** y por ahora
 * **no se siembra** automáticamente en las salas: queda como la fuente única que
 * 3h consumirá para poblar el suelo de cada sala de forma determinista por
 * semilla. Es **encontrable** (run, gratis), distinto de los catálogos de tienda
 * (comprables). Tipos sin loot encontrable propio quedan en `[]`.
 */
export const TABLA_DE_LOOT_POR_SALA: Readonly<Record<TipoDeSala, readonly string[]>> = {
    bar: [],
    pasillo: [],
    combate: ['poción de destreza'],
    descanso: ['poción de curación'],
    tienda: [],
    jefe: ['armadura de placas']
};

/**
 * Layout fijo y determinista de la run (grafo estático). Las salidas son
 * idealmente bidireccionales (cada destino tiene una salida de vuelta), pero el
 * mapa no lo exige: la fuente de verdad es esta tabla.
 *
 *   bar ──este──► pasillo ──norte──► sala-combate ──norte──► sala-jefe
 *                   │                     │
 *                 sur│                  este│
 *                   ▼                     ▼
 *               sala-descanso         sala-tienda
 */
const LAYOUT: Readonly<Record<string, DefinicionDeSala>> = {
    'bar': {
        id: 'bar',
        tipo: 'bar',
        nombre: 'Bar Puerco Verde',
        ocupantes: POOL_DE_SALAS.bar.ocupantes,
        objetos: POOL_DE_SALAS.bar.objetos,
        salidas: { este: 'pasillo' }
    },
    'pasillo': {
        id: 'pasillo',
        tipo: 'pasillo',
        nombre: 'Pasillo lúgubre',
        ocupantes: POOL_DE_SALAS.pasillo.ocupantes,
        objetos: POOL_DE_SALAS.pasillo.objetos,
        salidas: { oeste: 'bar', norte: 'sala-combate', sur: 'sala-descanso' }
    },
    'sala-combate': {
        id: 'sala-combate',
        tipo: 'combate',
        nombre: 'Sala de combate',
        ocupantes: POOL_DE_SALAS.combate.ocupantes,
        objetos: POOL_DE_SALAS.combate.objetos,
        salidas: { sur: 'pasillo', este: 'sala-tienda', norte: 'sala-jefe' }
    },
    'sala-descanso': {
        id: 'sala-descanso',
        tipo: 'descanso',
        nombre: 'Sala de descanso',
        ocupantes: POOL_DE_SALAS.descanso.ocupantes,
        objetos: POOL_DE_SALAS.descanso.objetos,
        salidas: { norte: 'pasillo' }
    },
    'sala-tienda': {
        id: 'sala-tienda',
        tipo: 'tienda',
        nombre: 'Tienda del mercader',
        ocupantes: POOL_DE_SALAS.tienda.ocupantes,
        objetos: POOL_DE_SALAS.tienda.objetos,
        salidas: { oeste: 'sala-combate' }
    },
    'sala-jefe': {
        id: 'sala-jefe',
        tipo: 'jefe',
        nombre: 'Guarida del jefe',
        ocupantes: POOL_DE_SALAS.jefe.ocupantes,
        objetos: POOL_DE_SALAS.jefe.objetos,
        salidas: { sur: 'sala-combate' }
    }
};

/**
 * Fuente única del mapa fijo (3f). Encapsula el LAYOUT para que `LugarFactory` y
 * `mover` lo consulten sin acoplarse a la estructura concreta. 3h reemplazará la
 * implementación (generación sembrada) conservando esta interfaz.
 */
export default class MapaLayout {
    /** Id de la sala inicial de una run. */
    public static readonly LUGAR_INICIAL: string = 'bar';

    /** Definición de una sala por su id, o `undefined` si no existe en el mapa. */
    public static obtener(lugarId: string): DefinicionDeSala | undefined {
        return LAYOUT[lugarId];
    }

    /** Ids de todas las salas del mapa (orden de declaración). */
    public static ids(): string[] {
        return Object.keys(LAYOUT);
    }

    /**
     * Loot encontrable (3g) declarado para un **tipo** de sala: ids de objetos de
     * `ObjetoFactory`. Determinista por tipo; copia defensiva. Es la abstracción
     * que 3h muestreará por semilla para sembrar el suelo de las salas. Vacío si
     * el tipo no tiene loot encontrable propio.
     */
    public static lootDeTipo(tipo: TipoDeSala): string[] {
        return [...TABLA_DE_LOOT_POR_SALA[tipo]];
    }

    /**
     * Salidas válidas desde una sala: dirección → lugarId destino. Vacío si la
     * sala no existe o no tiene salidas.
     */
    public static salidas(lugarId: string): Record<string, string> {
        const definicion = LAYOUT[lugarId];
        return definicion ? { ...definicion.salidas } : {};
    }
}
