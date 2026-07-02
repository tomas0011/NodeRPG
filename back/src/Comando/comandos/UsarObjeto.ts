import CommandResult from '../../Game/CommandResult';
import GameState from '../../Game/GameState';
import { resolverValorCanonico } from '../../Input/normalizarEntrada';
import { Objeto } from '../../Objeto/Objeto';
import IComando from '../IComando';

/**
 * Comando `usar:<nombreObjeto>`. El jugador consume un objeto de su inventario.
 *
 * El **efecto lo resuelve el propio objeto** (patrón Strategy de efecto), no un
 * `if` por nombre aquí: este comando sólo localiza el ítem, comprueba que sea
 * consumible (`getEfecto()` definido), delega en `efecto.aplicar(state.jugador)`
 * y **consume** el ítem quitándolo del inventario base. Añadir un consumible
 * nuevo no requiere tocar este comando (abierto-cerrado).
 *
 * Casos de fallo (sin consumir nada): objeto inexistente en el inventario →
 * `ok:false`; objeto no consumible (sin efecto, p. ej. una espada) → `ok:false`.
 * Es un comando de **juego**: requiere run activa.
 */
export default class UsarObjeto implements IComando {
    getKey() {
        return 'usar';
    }

    esComando(comando: string) {
        return comando === this.getKey();
    }

    ejecutar(nombreDeObjeto: string, state: GameState): CommandResult {
        const inventario = state.jugadorBase.getInventario();
        const objeto = resolverValorCanonico(
            nombreDeObjeto,
            inventario.getObjetos(),
            (o: Objeto) => o.getNombre()
        );

        if (!objeto) {
            return {
                ok: false,
                message: `No tienes ningún "${nombreDeObjeto}" para usar.`,
                completions: { usar: this.consumibles(state) }
            };
        }

        const efecto = objeto.getEfecto();
        if (!efecto) {
            return {
                ok: false,
                message: `No se puede usar "${objeto.getNombre()}".`,
                completions: { usar: this.consumibles(state) }
            };
        }

        const resultado = efecto.aplicar(state.jugador);
        // Consume el ítem: un consumible se agota al usarse.
        inventario.quitarObjeto(objeto);

        return {
            ok: true,
            message: `Usas "${objeto.getNombre()}". ${resultado.descripcion}`,
            data: {
                objeto: objeto.getNombre(),
                vidaDelta: resultado.vidaDelta,
                destrezaDelta: resultado.destrezaDelta,
                vidaActual: state.jugador.getVidaActual(),
                vidaMaxima: state.jugador.getVidaMaxima(),
                destreza: state.jugador.getDestreza()
            },
            completions: { usar: this.consumibles(state) }
        };
    }

    /** Nombres de los consumibles que quedan en el inventario (autocompletado). */
    private consumibles(state: GameState): string[] {
        return state.jugadorBase
            .getInventario()
            .getObjetos()
            .filter((o: Objeto) => o.getEfecto() !== undefined)
            .map((o: Objeto) => o.getNombre());
    }
}
