import CommandResult from '../../Game/CommandResult';
import SesionContexto from '../../Game/SesionContexto';
import { Articulo } from '../../Tienda/Articulo';
import CatalogoArticulos from '../../Tienda/CatalogoArticulos';
import CatalogoMejoras from '../../Tienda/CatalogoMejoras';
import IComandoSesion from '../IComandoSesion';

/**
 * Comando `tienda` — lista el catálogo de compra **según el contexto**:
 * - **Hub** (sin run activa): mejoras permanentes del perfil pagadas con
 *   **plata** (meta-progresión).
 * - **En run**: equipo comprable con el **oro** de la partida.
 *
 * Es un comando de **nivel sesión** porque debe distinguir hub de run (como
 * `perfil`). Puebla `completions.comprar` con los ids comprables del contexto
 * para el autocompletado de la TUI.
 *
 * Sólo lista; la compra la hace `comprar:<id>`. El catálogo es la **única
 * fuente** de precios/efectos: este comando no define números.
 */
export default class Tienda implements IComandoSesion {
    getKey(): string {
        return 'tienda';
    }

    esComando(comando: string): boolean {
        return comando === this.getKey();
    }

    ejecutar(_agente: string, contexto: SesionContexto): CommandResult {
        return contexto.enHub() ? this.tiendaHub(contexto) : this.tiendaRun(contexto);
    }

    /** Tienda del hub: mejoras (plata). Indica cuáles puede pagar el jugador. */
    private tiendaHub(contexto: SesionContexto): CommandResult {
        const plata = contexto.profile.plata;
        const mejoras = CatalogoMejoras.listar();
        const lineas = mejoras.map((mejora) => {
            const a = mejora.articulo;
            const puede = plata >= a.costo ? '' : ' (plata insuficiente)';
            return `- ${a.id}: ${a.nombre} — ${a.costo} plata. ${a.descripcion}${puede}`;
        });
        const comprables = mejoras
            .filter((mejora) => plata >= mejora.articulo.costo)
            .map((mejora) => mejora.articulo.id);

        return {
            ok: true,
            message: `Tienda del hub (plata: ${plata})\n${lineas.join('\n')}`,
            data: {
                enHub: true,
                moneda: 'plata',
                plata,
                articulos: mejoras.map((mejora) => this.detalle(mejora.articulo, plata >= mejora.articulo.costo))
            },
            completions: { comprar: comprables }
        };
    }

    /** Tienda en-run: equipo (oro). Indica cuál puede pagar el jugador. */
    private tiendaRun(contexto: SesionContexto): CommandResult {
        const state = contexto.state!;
        const oro = state.jugador.getOro();
        const articulos = CatalogoArticulos.listar();
        const lineas = articulos.map((a) => {
            const puede = oro >= a.costo ? '' : ' (oro insuficiente)';
            return `- ${a.id}: ${a.nombre} — ${a.costo} oro. ${a.descripcion}${puede}`;
        });
        const comprables = articulos
            .filter((a) => oro >= a.costo)
            .map((a) => a.id);

        return {
            ok: true,
            message: `Tienda (oro: ${oro})\n${lineas.join('\n')}`,
            data: {
                enHub: false,
                moneda: 'oro',
                oro,
                articulos: articulos.map((a) => this.detalle(a, oro >= a.costo))
            },
            completions: { comprar: comprables }
        };
    }

    /** Detalle estructurado de un artículo para el payload `data`. */
    private detalle(articulo: Articulo, puedePagar: boolean): {
        id: string;
        nombre: string;
        descripcion: string;
        costo: number;
        moneda: string;
        puedePagar: boolean;
    } {
        return {
            id: articulo.id,
            nombre: articulo.nombre,
            descripcion: articulo.descripcion,
            costo: articulo.costo,
            moneda: articulo.moneda,
            puedePagar
        };
    }
}
