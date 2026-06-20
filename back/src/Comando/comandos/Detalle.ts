import CommandResult from '../../Game/CommandResult';
import SesionContexto from '../../Game/SesionContexto';
import { RunHistoryDTO } from '../../Persistence/dtos';
import IComandoSesion from '../IComandoSesion';

/**
 * Comando `detalle:<runId>` — devuelve el **detalle completo** de una run
 * archivada del histórico (3j): su resumen + el snapshot inmutable de la run
 * (jugador, escenario, semilla…). Comando de **nivel sesión** (como `perfil`):
 * lee el histórico durable, no el `GameState` de la run.
 *
 * **Validación de pertenencia**: sólo expone runs **de la propia sesión**. El
 * `SesionContexto` sólo tiene pre-cargados los detalles de las runs de la sesión
 * (filtradas por `RunHistoryRepository.list(sessionId)`), así que un `runId`
 * inexistente o de **otra sesión** no se encuentra → `ok:false`. El comando NO
 * importa Mongo ni muta nada (sólo lectura).
 */
export default class Detalle implements IComandoSesion {
    getKey(): string {
        return 'detalle';
    }

    esComando(comando: string): boolean {
        return comando === this.getKey();
    }

    ejecutar(runId: string, contexto: SesionContexto): CommandResult {
        if (!runId) {
            return {
                ok: false,
                message: 'Indica qué run inspeccionar: "detalle:<runId>". Mira el "historial".'
            };
        }

        const detalle = contexto.getDetalleHistorico(runId);
        if (!detalle) {
            // No existe o no pertenece a esta sesión: no se filtra el motivo para
            // no revelar la existencia de runs ajenas.
            return {
                ok: false,
                message: `No se encontró la run "${runId}" en tu histórico.`
            };
        }

        return {
            ok: true,
            message: this.formatear(detalle),
            data: { resumen: detalle.resumen, detalle: detalle.detalle }
        };
    }

    /** Texto humano legible del detalle de una run archivada. */
    private formatear(d: RunHistoryDTO): string {
        const r = d.resumen;
        const j = d.detalle.jugador;
        const causa = r.causa ?? 'desconocida';
        const nivel = r.nivel ?? j.nivel ?? 1;
        const plata = r.plataBankeada ?? 0;
        return [
            `Run ${r.runId} — ${r.nombre}`,
            `Causa de fin: ${causa}`,
            `Nivel alcanzado: ${nivel}`,
            `Vida al cerrar: ${r.vidaActual ?? j.vidaActual}/${j.vidaMaxima}`,
            `Salas visitadas: ${r.salasVisitadas}`,
            `Oro: ${r.oro} — Plata bankeada: ${plata}`,
            `Inventario final: ${j.inventario.length ? j.inventario.join(', ') : 'vacío'}`,
            `Equipado al cerrar: ${j.equipados.length ? j.equipados.join(', ') : 'nada'}`,
            `Sala final: ${d.detalle.escenario.lugarId}`,
            `Terminada en: ${r.terminadaEn}`
        ].join('\n');
    }
}
