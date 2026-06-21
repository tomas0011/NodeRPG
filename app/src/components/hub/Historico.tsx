import { useState } from 'react';
import Panel from '../common/Panel';
import DetalleRun from './DetalleRun';
import { useGame } from '../../context/GameContext';
import { ResumenRun } from '../../api/tipos';

/** Lista el histórico de runs; cada item abre el detalle en un modal. */
function Historico() {
  const { historial } = useGame();
  const [seleccion, setSeleccion] = useState<ResumenRun | null>(null);

  const runs = historial?.runs ?? [];

  return (
    <Panel titulo="Histórico de personajes" className="hub__ancho-completo">
      {runs.length > 0 ? (
        <ul className="lista-historial">
          {runs.map((run) => (
            <li key={run.runId}>
              <button
                type="button"
                className="run-item"
                onClick={() => setSeleccion(run)}
              >
                <span className="run-item__meta">
                  <span className="run-item__nombre">{run.nombre}</span>
                  <span className="texto-suave">
                    Nivel {run.nivel ?? '?'} · {run.oro} oro ·{' '}
                    {run.salasVisitadas} salas
                    {typeof run.plataBankeada === 'number'
                      ? ` · +${run.plataBankeada} plata`
                      : ''}
                  </span>
                </span>
                <span
                  className={`etiqueta-causa${
                    run.causa === 'muerte'
                      ? ' etiqueta-causa--muerte'
                      : run.causa === 'abandono'
                      ? ' etiqueta-causa--abandono'
                      : ''
                  }`}
                >
                  {run.causa ?? 'fin'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="texto-suave">
          Aún no tenés personajes en tu histórico. Creá una partida para empezar.
        </p>
      )}

      {seleccion ? (
        <DetalleRun
          runId={seleccion.runId}
          nombre={seleccion.nombre}
          onCerrar={() => setSeleccion(null)}
        />
      ) : null}
    </Panel>
  );
}

export default Historico;
