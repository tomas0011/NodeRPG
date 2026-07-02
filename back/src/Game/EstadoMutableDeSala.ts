export interface EstadoMutableDeSala {
    objetosTomados: string[];
    objetosAgregadosAlSuelo: string[];
    ocupantesEliminados: string[];
}

export interface EstadoMutablePorSala {
    [lugarId: string]: EstadoMutableDeSala;
}

function clonarListaDeIds(ids: string[]): string[] {
    return ids.slice();
}

function esListaDeStrings(valor: unknown): valor is string[] {
    return Array.isArray(valor) && valor.every((item) => typeof item === 'string');
}

export function crearEstadoMutableDeSala(): EstadoMutableDeSala {
    return {
        objetosTomados: [],
        objetosAgregadosAlSuelo: [],
        ocupantesEliminados: []
    };
}

export function normalizarEstadoMutableDeSala(
    estado?: Partial<EstadoMutableDeSala> | null
): EstadoMutableDeSala {
    if (!estado) {
        return crearEstadoMutableDeSala();
    }

    return {
        objetosTomados: esListaDeStrings(estado.objetosTomados)
            ? clonarListaDeIds(estado.objetosTomados)
            : [],
        objetosAgregadosAlSuelo: esListaDeStrings(estado.objetosAgregadosAlSuelo)
            ? clonarListaDeIds(estado.objetosAgregadosAlSuelo)
            : [],
        ocupantesEliminados: esListaDeStrings(estado.ocupantesEliminados)
            ? clonarListaDeIds(estado.ocupantesEliminados)
            : []
    };
}

export function normalizarEstadoMutablePorSala(
    estadoPorSala?: { [lugarId: string]: Partial<EstadoMutableDeSala> } | null
): EstadoMutablePorSala {
    const normalizado: EstadoMutablePorSala = {};
    if (!estadoPorSala || typeof estadoPorSala !== 'object') {
        return normalizado;
    }

    for (const lugarId of Object.keys(estadoPorSala)) {
        normalizado[lugarId] = normalizarEstadoMutableDeSala(estadoPorSala[lugarId]);
    }

    return normalizado;
}

export function obtenerEstadoMutableDeSala(
    estadoPorSala: EstadoMutablePorSala | undefined,
    lugarId: string
): EstadoMutableDeSala {
    if (!estadoPorSala || !estadoPorSala[lugarId]) {
        return crearEstadoMutableDeSala();
    }

    return normalizarEstadoMutableDeSala(estadoPorSala[lugarId]);
}
