import MapaDeRun from "../Escenario/MapaDeRun";
import {
    DefinicionDeSala,
    POOL_DE_SALAS,
    TABLA_DE_LOOT_POR_SALA,
    TipoDeSala
} from "../Escenario/MapaLayout";
import CatalogoEnemigos from "../Personaje/pools/CatalogoEnemigos";
import Prng from "./prng";

/**
 * Mapa de run **ya generado**: un grafo inmutable de `DefinicionDeSala` indexado
 * por `lugarId`. Cumple `MapaDeRun`; lo produce `RunGenerator.generar`. No tiene
 * azar propio (toda la aleatoriedad se consumió al generarlo), así que dos mapas
 * generados con la misma semilla son estructuralmente idénticos.
 */
class MapaGenerado implements MapaDeRun {
    private readonly salas: Readonly<Record<string, DefinicionDeSala>>;
    private readonly inicial: string;

    constructor(salas: Record<string, DefinicionDeSala>, inicial: string) {
        this.salas = salas;
        this.inicial = inicial;
    }

    lugarInicial(): string {
        return this.inicial;
    }

    obtener(lugarId: string): DefinicionDeSala | undefined {
        return this.salas[lugarId];
    }

    ids(): string[] {
        return Object.keys(this.salas);
    }

    salidas(lugarId: string): Record<string, string> {
        const definicion = this.salas[lugarId];
        return definicion ? { ...definicion.salidas } : {};
    }

    lootDeTipo(tipo: TipoDeSala): string[] {
        return [...TABLA_DE_LOOT_POR_SALA[tipo]];
    }
}

/** Nodo mutable usado durante la construcción (luego se congela en DefinicionDeSala). */
interface NodoEnConstruccion {
    id: string;
    tipo: TipoDeSala;
    nombre: string;
    ocupantes: string[];
    objetos: string[];
    salidas: Record<string, string>;
}

/**
 * **Generador procedural determinista del mapa de la run (3h, trade-off #7).**
 *
 * `generar(semilla)` produce un `MapaDeRun` derivado SÓLO de la semilla mediante
 * un PRNG sembrado (`Prng`, mulberry32). La misma semilla produce SIEMPRE el
 * mismo mapa (salas, conexiones, ocupantes, loot); el mapa **no se serializa**:
 * con `semilla` + `lugarId` se reconstruye idéntico. Muestrea los **pools
 * existentes** (`POOL_DE_SALAS`, `CatalogoEnemigos`, `TABLA_DE_LOOT_POR_SALA`),
 * no reinventa el contenido.
 *
 * **Algoritmo (garantiza grafo conexo y navegable):**
 * 1. **Espina lineal** de salas: `bar` (inicial) → varias intermedias → `jefe`
 *    (final). La cantidad de intermedias es determinista por semilla (4–6).
 * 2. Cada sala intermedia recibe un **tipo** muestreado de un pool ponderado
 *    (combate/pasillo/descanso/tienda); el resto del contenido (ocupantes/objetos)
 *    sale de `POOL_DE_SALAS[tipo]`, con la sala de combate eligiendo además un
 *    enemigo de `CatalogoEnemigos` por semilla. El loot encontrable se siembra
 *    desde `TABLA_DE_LOOT_POR_SALA[tipo]`.
 * 3. **Conexiones de la espina son bidireccionales** (cada sala enlaza con la
 *    siguiente y con la anterior). Como la espina es un camino simple de la
 *    inicial al jefe, **toda sala es alcanzable desde la inicial** (grafo conexo)
 *    y el jefe siempre tiene camino. Las direcciones se asignan de un repertorio
 *    fijo, evitando colisiones por sala.
 * 4. Se añaden algunas **aristas extra** deterministas (atajos) entre salas no
 *    adyacentes, siempre bidireccionales y hacia salas existentes; nunca rompen
 *    la conectividad (sólo añaden caminos).
 *
 * Como toda salida apunta a un `lugarId` que se creó en el mismo paso, **todas
 * las salidas tienen destino existente**.
 */
export default class RunGenerator {
    /** Tipos candidatos para las salas intermedias, con repetición = peso. */
    private static readonly TIPOS_INTERMEDIOS: readonly TipoDeSala[] = [
        'combate', 'combate', 'pasillo', 'descanso', 'tienda', 'combate'
    ];

    /** Direcciones disponibles para asignar a las salidas (opuestos emparejados). */
    private static readonly DIRECCIONES: readonly { dir: string; opuesta: string }[] = [
        { dir: 'norte', opuesta: 'sur' },
        { dir: 'este', opuesta: 'oeste' },
        { dir: 'arriba', opuesta: 'abajo' },
        { dir: 'noreste', opuesta: 'suroeste' }
    ];

    /** Nombres legibles por tipo (para variar la ambientación de forma determinista). */
    private static readonly NOMBRES: Readonly<Record<TipoDeSala, readonly string[]>> = {
        bar: ['Bar Puerco Verde'],
        pasillo: ['Pasillo lúgubre', 'Corredor angosto', 'Galería en penumbra'],
        combate: ['Sala de combate', 'Cripta de los caídos', 'Arena ruinosa'],
        descanso: ['Sala de descanso', 'Refugio tibio', 'Capilla en silencio'],
        tienda: ['Tienda del mercader', 'Tenderete clandestino', 'Bazar de las sombras'],
        jefe: ['Guarida del jefe', 'Trono del horror', 'Antro final']
    };

    /**
     * Genera el `MapaDeRun` determinista para `semilla`. Llamarla dos veces con
     * la misma semilla devuelve mapas estructuralmente idénticos.
     */
    public static generar(semilla: number): MapaDeRun {
        const prng = new Prng(semilla);
        const idsEnemigos = CatalogoEnemigos.ids();

        // 1. Cantidad de salas intermedias (entre el bar y el jefe).
        const intermedias = prng.entero(4, 6);

        // 2. Construye la secuencia de tipos: bar, [intermedias...], jefe.
        const nodos: NodoEnConstruccion[] = [];
        nodos.push(RunGenerator.crearNodo('bar', 'bar', prng, idsEnemigos));
        for (let i = 0; i < intermedias; i++) {
            const tipo = prng.elegir(RunGenerator.TIPOS_INTERMEDIOS) ?? 'combate';
            nodos.push(RunGenerator.crearNodo(`sala-${i + 1}`, tipo, prng, idsEnemigos));
        }
        nodos.push(RunGenerator.crearNodo('sala-jefe', 'jefe', prng, idsEnemigos));

        // 3. Conecta la espina: cada nodo con el siguiente (bidireccional). Como
        //    es un camino simple bar → ... → jefe, el grafo queda conexo y el
        //    jefe alcanzable desde la inicial.
        for (let i = 0; i < nodos.length - 1; i++) {
            RunGenerator.conectar(nodos[i], nodos[i + 1], prng);
        }

        // 4. Aristas extra deterministas (atajos) entre salas no adyacentes. Sólo
        //    añaden caminos; nunca desconectan. Se intentan unas pocas según la
        //    semilla, saltándose pares ya conectados o sin direcciones libres.
        const atajos = prng.entero(1, 2);
        for (let a = 0; a < atajos; a++) {
            const i = prng.entero(0, nodos.length - 1);
            const j = prng.entero(0, nodos.length - 1);
            if (Math.abs(i - j) <= 1) {
                continue; // adyacentes o el mismo: ya conectados.
            }
            if (RunGenerator.yaConectados(nodos[i], nodos[j])) {
                continue;
            }
            RunGenerator.conectar(nodos[i], nodos[j], prng);
        }

        // Congela los nodos en DefinicionDeSala inmutables.
        const salas: Record<string, DefinicionDeSala> = {};
        for (const nodo of nodos) {
            salas[nodo.id] = {
                id: nodo.id,
                tipo: nodo.tipo,
                nombre: nodo.nombre,
                ocupantes: nodo.ocupantes,
                objetos: nodo.objetos,
                salidas: nodo.salidas
            };
        }
        return new MapaGenerado(salas, nodos[0].id);
    }

    /**
     * Crea un nodo en construcción para `id`/`tipo`, muestreando nombre,
     * ocupantes y objetos de los pools de forma determinista por el PRNG.
     */
    private static crearNodo(
        id: string,
        tipo: TipoDeSala,
        prng: Prng,
        idsEnemigos: readonly string[]
    ): NodoEnConstruccion {
        const nombre = prng.elegir(RunGenerator.NOMBRES[tipo]) ?? tipo;
        const ocupantes = RunGenerator.elegirOcupantes(tipo, prng, idsEnemigos);
        const objetos = RunGenerator.elegirObjetos(tipo, prng);
        return { id, tipo, nombre, ocupantes, objetos, salidas: {} };
    }

    /**
     * Ocupantes de una sala según su tipo. Las salas de combate eligen un
     * enemigo del `CatalogoEnemigos` por semilla (más algún extra ocasional); el
     * resto usa los ocupantes declarados en `POOL_DE_SALAS[tipo]`.
     */
    private static elegirOcupantes(
        tipo: TipoDeSala,
        prng: Prng,
        idsEnemigos: readonly string[]
    ): string[] {
        if (tipo === 'combate' && idsEnemigos.length > 0) {
            const cuantos = prng.entero(1, 2);
            const ocupantes: string[] = [];
            for (let i = 0; i < cuantos; i++) {
                const id = prng.elegir(idsEnemigos);
                if (id) {
                    ocupantes.push(id);
                }
            }
            return ocupantes;
        }
        return [...POOL_DE_SALAS[tipo].ocupantes];
    }

    /**
     * Objetos del suelo de una sala: los del pool del tipo más, ocasionalmente,
     * el loot encontrable declarado para el tipo (`TABLA_DE_LOOT_POR_SALA`),
     * sembrado de forma determinista.
     */
    private static elegirObjetos(tipo: TipoDeSala, prng: Prng): string[] {
        const objetos: string[] = [...POOL_DE_SALAS[tipo].objetos];
        const loot = TABLA_DE_LOOT_POR_SALA[tipo];
        if (loot.length > 0 && prng.siguiente() < 0.5) {
            const extra = prng.elegir(loot);
            if (extra) {
                objetos.push(extra);
            }
        }
        return objetos;
    }

    /**
     * Conecta dos nodos con una arista **bidireccional**, eligiendo una dirección
     * libre en ambos extremos (la opuesta en el destino). Si no quedan
     * direcciones libres, no conecta (el grafo ya está garantizado por la espina).
     */
    private static conectar(a: NodoEnConstruccion, b: NodoEnConstruccion, prng: Prng): void {
        const par = RunGenerator.direccionLibre(a, b, prng);
        if (!par) {
            return;
        }
        a.salidas[par.dir] = b.id;
        b.salidas[par.opuesta] = a.id;
    }

    /**
     * Busca un par de direcciones {dir en `a`, opuesta en `b`} ambas libres,
     * recorriendo el repertorio en orden barajado por la semilla. `undefined` si
     * no hay ninguna disponible.
     */
    private static direccionLibre(
        a: NodoEnConstruccion,
        b: NodoEnConstruccion,
        prng: Prng
    ): { dir: string; opuesta: string } | undefined {
        const candidatos = prng.barajar(RunGenerator.DIRECCIONES);
        for (const par of candidatos) {
            if (!(par.dir in a.salidas) && !(par.opuesta in b.salidas)) {
                return par;
            }
        }
        return undefined;
    }

    /** `true` si `a` ya tiene una salida hacia `b`. */
    private static yaConectados(a: NodoEnConstruccion, b: NodoEnConstruccion): boolean {
        return Object.values(a.salidas).includes(b.id);
    }
}
