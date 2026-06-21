import { useEffect, useState } from 'react';
import Boton from '../common/Boton';
import { RequestManager } from '../../utils/RequestManager';
import { DetalleData } from '../../api/tipos';

interface DetalleRunProps {
  runId: string;
  nombre: string;
  onCerrar: () => void;
}

const rm = RequestManager.getInstance();

function esDetalleData(data: unknown): data is DetalleData {
  return !!data && typeof data === 'object' && 'detalle' in data && 'resumen' in data;
}

/** Modal que pide `detalle:<runId>` y muestra el snapshot completo de la run. */
function DetalleRun({ runId, nombre, onCerrar }: DetalleRunProps) {
  const [detalle, setDetalle] = useState<DetalleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const resp = await rm.enviar(`detalle:${runId}`);
      if (cancelado) {
        return;
      }
      if (resp.ok && esDetalleData(resp.data)) {
        setDetalle(resp.data);
      } else {
        setError(resp.content || 'No se pudo cargar el detalle.');
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [runId]);

  return (
    <div
      className="modal-fondo"
      role="presentation"
      onClick={onCerrar}
    >
      <div
        className="modal"
        role="dialog"
        aria-label={`Detalle de ${nombre}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="modal__cabecera">
          <h2 className="titulo-medieval" style={{ margin: 0 }}>
            {nombre}
          </h2>
          <Boton variante="chip" onClick={onCerrar}>
            Cerrar
          </Boton>
        </div>

        {error ? <p className="texto-suave">{error}</p> : null}

        {!error && !detalle ? <p className="texto-suave">Cargando…</p> : null}

        {detalle ? (
          <>
            <dl className="detalle-grid">
              <dt>Nivel</dt>
              <dd>{detalle.detalle.jugador.nivel}</dd>
              <dt>Vida</dt>
              <dd>
                {detalle.detalle.jugador.vidaActual}/{detalle.detalle.jugador.vidaMaxima}
              </dd>
              <dt>Destreza</dt>
              <dd>{detalle.detalle.jugador.destreza}</dd>
              <dt>XP</dt>
              <dd>{detalle.detalle.jugador.xp}</dd>
              <dt>Oro</dt>
              <dd>{detalle.detalle.jugador.oro}</dd>
              <dt>Salas visitadas</dt>
              <dd>{detalle.detalle.escenario.salasVisitadas.length}</dd>
              <dt>Semilla</dt>
              <dd>{detalle.detalle.semilla}</dd>
              <dt>Causa</dt>
              <dd>{detalle.resumen.causa || '—'}</dd>
            </dl>

            <h3 className="panel__titulo">Inventario</h3>
            {detalle.detalle.jugador.inventario.length > 0 ? (
              <ul className="lista-mejoras">
                {detalle.detalle.jugador.inventario.map((obj, i) => (
                  <li key={`${obj}-${i}`}>{obj}</li>
                ))}
              </ul>
            ) : (
              <p className="texto-suave">Inventario vacío.</p>
            )}

            <h3 className="panel__titulo">Equipados</h3>
            {detalle.detalle.jugador.equipados.length > 0 ? (
              <ul className="lista-mejoras">
                {detalle.detalle.jugador.equipados.map((obj, i) => (
                  <li key={`${obj}-${i}`}>{obj}</li>
                ))}
              </ul>
            ) : (
              <p className="texto-suave">Sin equipo.</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default DetalleRun;
