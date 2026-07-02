import CommandResult from '../../Game/CommandResult';
import SesionContexto from '../../Game/SesionContexto';
import { sonEntradasEquivalentes } from '../../Input/normalizarEntrada';
import ObjetoFactory from '../../Objeto/ObjetoFactory';
import CatalogoArticulos from '../../Tienda/CatalogoArticulos';
import CatalogoMejoras from '../../Tienda/CatalogoMejoras';
import IComandoSesion from '../IComandoSesion';

/**
 * Comando `comprar:<id>` — compra según el contexto:
 * - **Hub**: una **mejora** permanente con **plata**. Valida id y saldo; si la
 *   mejora no es acumulable y ya está comprada, la rechaza. Descuenta la plata y
 *   añade el id a `profile.mejoras` (lo persiste el ciclo de sesión, igual que
 *   hoy se guarda el perfil).
 * - **En run**: un **artículo** de equipo con **oro**. Valida id y oro; gasta el
 *   oro del jugador y añade el objeto (vía `ObjetoFactory`) al inventario de la
 *   run (viaja en el DTO de la run).
 *
 * Comando de **nivel sesión** porque distingue hub de run (como `tienda`). Los
 * precios/efectos vienen del catálogo; este comando no define números.
 *
 * Integración futura (3f): la tienda en-run no requiere aún estar en una sala de
 * tipo tienda; `comprar` funciona en cualquier sala de la run.
 */
export default class Comprar implements IComandoSesion {
    getKey(): string {
        return 'comprar';
    }

    esComando(comando: string): boolean {
        return comando === this.getKey();
    }

    ejecutar(id: string, contexto: SesionContexto): CommandResult {
        if (!id) {
            return { ok: false, message: 'Indica qué comprar: "comprar:<id>". Mira la "tienda".' };
        }
        return contexto.enHub() ? this.comprarMejora(id, contexto) : this.comprarArticulo(id, contexto);
    }

    /** Hub: compra de mejora con plata. */
    private comprarMejora(id: string, contexto: SesionContexto): CommandResult {
        const mejora = CatalogoMejoras.obtener(id);
        if (!mejora) {
            return { ok: false, message: `No existe la mejora "${id}" en la tienda del hub.` };
        }

        const profile = contexto.profile;
        const idCanonico = mejora.articulo.id;
        const yaComprada = profile.mejoras.some((mejoraComprada) => sonEntradasEquivalentes(mejoraComprada, idCanonico));
        if (!mejora.acumulable && yaComprada) {
            return { ok: false, message: `Ya tienes la mejora "${mejora.articulo.nombre}" (no es recomprable).` };
        }

        const costo = mejora.articulo.costo;
        if (profile.plata < costo) {
            return {
                ok: false,
                message: `Plata insuficiente para "${mejora.articulo.nombre}": cuesta ${costo}, tienes ${profile.plata}.`
            };
        }

        profile.plata -= costo;
        profile.mejoras.push(idCanonico);

        return {
            ok: true,
            message: `Compraste "${mejora.articulo.nombre}" por ${costo} plata. Te quedan ${profile.plata}. Aplica a la próxima run.`,
            data: {
                enHub: true,
                comprado: idCanonico,
                moneda: 'plata',
                costo,
                plata: profile.plata,
                mejoras: profile.mejoras.slice()
            }
        };
    }

    /** En run: compra de equipo con oro. */
    private comprarArticulo(id: string, contexto: SesionContexto): CommandResult {
        const articulo = CatalogoArticulos.obtener(id);
        if (!articulo) {
            return { ok: false, message: `No existe el artículo "${id}" en la tienda.` };
        }

        const state = contexto.state!;
        const idCanonico = articulo.id;
        const objeto = ObjetoFactory.crear(idCanonico);
        if (!objeto) {
            // No debería pasar (el catálogo usa ids de la fábrica), pero se valida.
            return { ok: false, message: `No se puede instanciar el artículo "${id}".` };
        }

        const oroAntes = state.jugador.getOro();
        const costo = articulo.costo;
        if (!state.jugador.gastarOro(costo)) {
            return {
                ok: false,
                message: `Oro insuficiente para "${articulo.nombre}": cuesta ${costo}, tienes ${oroAntes}.`
            };
        }

        state.jugadorBase.getInventario().agregarObjeto(objeto);
        const inventario = state.jugadorBase.getInventario().getObjetos().map((o) => o.getNombre());

        return {
            ok: true,
            message: `Compraste "${articulo.nombre}" por ${costo} oro. Te quedan ${state.jugador.getOro()}.`,
            data: {
                enHub: false,
                comprado: idCanonico,
                moneda: 'oro',
                costo,
                oro: state.jugador.getOro(),
                inventario
            },
            completions: { equipar: inventario }
        };
    }
}
