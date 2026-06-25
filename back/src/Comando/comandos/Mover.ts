import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { resolverClaveCanonica } from '../../Input/normalizarEntrada';
import IComando from '../IComando';

/**
 * Comando `mover:<salida>`. Desplaza al jugador a la sala conectada por la salida
 * (dirección/nombre) indicada desde la sala actual.
 *
 * Valida contra las **salidas de la sala actual** (`lugar.getSalidas()`, cuya
 * fuente última es el `MapaDeRun` de la run): si la salida no existe, devuelve
 * `ok:false` listando las salidas válidas, sin mover. Si es válida:
 * 1. Reconstruye la sala destino con `LugarFactory.crear(lugarIdDestino,
 *    state.semilla)` (sus ocupantes/objetos/salidas salen del mapa de esa
 *    semilla, deterministas por id).
 * 2. Actualiza el lugar del escenario y el `state.lugarId` en paralelo, de modo
 *    que la posición se serializa por id (el mapa no se serializa entero).
 * 3. Añade la sala destino a `salasVisitadas` sin duplicar.
 *
 * Describe la nueva sala (nombre, ocupantes, salidas) en `message`/`data` y
 * puebla `completions.mover` con las salidas válidas de la sala nueva.
 */
export default class Mover implements IComando {
    getKey(): string {
        return 'mover';
    }

    esComando(comando: string): boolean {
        return comando === this.getKey();
    }

    ejecutar(salida: string, state: GameState): CommandResult {
        const lugarActual = state.escenario.getLugar();
        const salidas = lugarActual.getSalidas();
        const direcciones = Object.keys(salidas);

        const salidaCanonica = salida ? resolverClaveCanonica(salida, salidas) : undefined;
        const destinoId = salidaCanonica ? salidas[salidaCanonica] : undefined;
        if (!destinoId) {
            return {
                ok: false,
                message: `No puedes ir por "${salida || ''}" desde ${lugarActual.getNombre()}. Salidas: ${direcciones.join(', ') || 'ninguna'}.`,
                data: {
                    lugar: lugarActual.getNombre(),
                    lugarId: state.lugarId,
                    salidas: direcciones
                },
                completions: { mover: direcciones }
            };
        }

        // Reconstruye la sala destino desde su id y la semilla de la run (el
        // mapa generado por esa semilla es la fuente; cacheado por semilla) y
        // actualiza posición (lugar + lugarId) en paralelo.
        const lugarDestino = state.reconstruirLugar(destinoId);
        state.escenario.setLugar(lugarDestino);
        state.lugarId = destinoId;
        if (!state.salasVisitadas.includes(destinoId)) {
            state.salasVisitadas.push(destinoId);
        }

        const personajes = lugarDestino.getPersonajes().map((personaje) => personaje.getNombre());
        const objetos = lugarDestino.getObjetos().map((objeto) => objeto.getNombre());
        const salidasDestino = lugarDestino.getSalidas();
        const direccionesDestino = Object.keys(salidasDestino);

        const message = `
            Te mueves a: ${lugarDestino.getNombre()}
            Personas: ${personajes}
            Objetos: ${objetos}
            Salidas: ${direccionesDestino}
        `;

        return {
            ok: true,
            message,
            data: {
                lugar: lugarDestino.getNombre(),
                lugarId: destinoId,
                personajes,
                objetos,
                salidas: salidasDestino,
                salasVisitadas: state.salasVisitadas.slice()
            },
            completions: { mover: direccionesDestino, tomar: objetos }
        };
    }
}
