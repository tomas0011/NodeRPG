import MapaDeRun from "./MapaDeRun";

/**
 * Proyección del grafo de salas a una grilla 2D para el minimapa del TUI
 * (estilo "niebla de guerra": el jugador ve lo visitado más las salas
 * adyacentes sin explorar).
 *
 * El mapa es un grafo con salidas nombradas, no una grilla: acá se derivan
 * coordenadas (x, y) deterministas haciendo BFS desde la sala inicial y
 * aplicando un delta por dirección. Módulo puro: sin estado, testeable solo.
 */

export interface SalaDeMapa {
    id: string;
    x: number;
    y: number;
    visitada: boolean;
    /** Direcciones de salida (sin destinos). Vacío si la sala no fue visitada. */
    salidas: string[];
    /** Solo presentes si la sala fue visitada (niebla de guerra). */
    nombre?: string;
    tipo?: string;
}

export interface MapaProyectado {
    lugarActual: string;
    salas: SalaDeMapa[];
}

/**
 * Delta de grilla por dirección. Los pares opuestos usan deltas negados y las
 * 8 direcciones caen en celdas vecinas distintas. `arriba`/`abajo` se proyectan
 * al eje diagonal NO/SE (el único par diagonal que las direcciones cardinales +
 * noreste/suroeste dejan libre). El ORDEN de este objeto fija el orden de
 * expansión del BFS — no depende del orden de inserción de las salidas.
 */
const DELTAS: Readonly<Record<string, { dx: number; dy: number }>> = {
    norte: { dx: 0, dy: -1 },
    sur: { dx: 0, dy: 1 },
    este: { dx: 1, dy: 0 },
    oeste: { dx: -1, dy: 0 },
    noreste: { dx: 1, dy: -1 },
    suroeste: { dx: -1, dy: 1 },
    arriba: { dx: -1, dy: -1 },
    abajo: { dx: 1, dy: 1 }
};

interface Coordenada {
    x: number;
    y: number;
}

function claveDeCelda(coordenada: Coordenada): string {
    return `${coordenada.x},${coordenada.y}`;
}

/**
 * Cache de posicionamiento por mapa. La proyección BFS es una función pura del
 * mapa (determinista por semilla) y el frontend pide `mapa` tras cada comando:
 * sin cache se recalcularía el BFS completo por request. `WeakMap` porque
 * `MapaDeRunRegistry` ya cachea y reutiliza la misma instancia por semilla.
 */
const cacheDePosiciones = new WeakMap<MapaDeRun, Map<string, Coordenada>>();

/**
 * Posiciona todas las salas del mapa por BFS desde `lugarInicial()` en (0,0).
 * Colisiones (los atajos pueden romper la planaridad): se prueba
 * `(x + k·dx, y + k·dy)` con k = 2, 3, … hasta la primera celda libre —
 * determinista y conserva la semántica direccional ("está más al norte").
 */
function posicionarSalas(mapa: MapaDeRun): Map<string, Coordenada> {
    const cacheado = cacheDePosiciones.get(mapa);
    if (cacheado) {
        return cacheado;
    }
    const coordenadas = new Map<string, Coordenada>();
    const ocupadas = new Set<string>();
    const inicial = mapa.lugarInicial();

    coordenadas.set(inicial, { x: 0, y: 0 });
    ocupadas.add(claveDeCelda({ x: 0, y: 0 }));

    const cola: string[] = [inicial];
    while (cola.length) {
        const actualId = cola.shift()!;
        const actual = coordenadas.get(actualId)!;
        const salidas = mapa.salidas(actualId);

        // Orden fijo por dirección (no por inserción) para que la proyección
        // sea idéntica entre llamadas y procesos.
        for (const direccion of Object.keys(DELTAS)) {
            const destinoId = salidas[direccion];
            if (!destinoId || coordenadas.has(destinoId)) {
                continue;
            }
            const delta = DELTAS[direccion];
            let k = 1;
            let celda: Coordenada = { x: actual.x + delta.dx, y: actual.y + delta.dy };
            while (ocupadas.has(claveDeCelda(celda))) {
                k += 1;
                celda = { x: actual.x + k * delta.dx, y: actual.y + k * delta.dy };
            }
            coordenadas.set(destinoId, celda);
            ocupadas.add(claveDeCelda(celda));
            cola.push(destinoId);
        }
    }

    cacheDePosiciones.set(mapa, coordenadas);
    return coordenadas;
}

/**
 * Proyecta el mapa de la run al minimapa visible: salas conocidas (visitadas ∪
 * sala actual, unión defensiva para runs persistidas antes de sembrar la
 * inicial) más las adyacentes-a-conocidas como incógnitas (sin nombre/tipo/
 * salidas). Las coordenadas se normalizan al mínimo del conjunto visible.
 */
export function proyectarMapa(
    mapa: MapaDeRun,
    visitadas: string[],
    lugarActual: string
): MapaProyectado {
    const coordenadas = posicionarSalas(mapa);
    const conocidas = new Set<string>(visitadas);
    conocidas.add(lugarActual);

    // Solo entran ids con coordenadas: una sala conocida que no está en el mapa
    // (id legado) se ignora, y los vecinos siempre están posicionados por BFS.
    const visibles = new Set<string>();
    conocidas.forEach((id) => {
        if (!coordenadas.has(id)) {
            return;
        }
        visibles.add(id);
        const salidas = mapa.salidas(id);
        for (const direccion of Object.keys(salidas)) {
            if (coordenadas.has(salidas[direccion])) {
                visibles.add(salidas[direccion]);
            }
        }
    });

    const ids = Array.from(visibles);
    if (!ids.length) {
        return { lugarActual, salas: [] };
    }

    const minX = Math.min(...ids.map((id) => coordenadas.get(id)!.x));
    const minY = Math.min(...ids.map((id) => coordenadas.get(id)!.y));

    const salas: SalaDeMapa[] = ids.map((id) => {
        const celda = coordenadas.get(id)!;
        const visitada = conocidas.has(id);
        const sala: SalaDeMapa = {
            id,
            x: celda.x - minX,
            y: celda.y - minY,
            visitada,
            salidas: visitada ? Object.keys(mapa.salidas(id)) : []
        };
        if (visitada) {
            const definicion = mapa.obtener(id);
            if (definicion) {
                sala.nombre = definicion.nombre;
                sala.tipo = definicion.tipo;
            }
        }
        return sala;
    });

    return { lugarActual, salas };
}
