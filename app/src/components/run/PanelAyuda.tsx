import React from 'react';
import Panel from '../common/Panel';
import { useGame } from '../../context/GameContext';
import { comandosDeContexto } from '../../data/comandos';

/**
 * Ayuda contextual armada en el front: muestra solo los comandos válidos en el
 * contexto actual (filtrados por `enHub`) y, para los que aceptan argumento, las
 * opciones disponibles del momento desde `completions`.
 */
function PanelAyuda() {
  const { enHub, completions } = useGame();
  const comandos = comandosDeContexto(enHub);

  return (
    <Panel titulo="Ayuda" className="panel-ayuda">
      <p className="texto-suave" style={{ marginTop: 0 }}>
        Comandos disponibles ahora:
      </p>
      <dl>
        {comandos.map((comando) => {
          const opciones = comando.claveCompletions
            ? completions[comando.claveCompletions] ?? []
            : [];
          return (
            <React.Fragment key={comando.nombre}>
              <dt>{comando.nombre}</dt>
              <dd>
                {comando.descripcion}
                {opciones.length > 0 ? (
                  <span className="texto-suave"> Opciones: {opciones.join(', ')}.</span>
                ) : null}
              </dd>
            </React.Fragment>
          );
        })}
      </dl>
    </Panel>
  );
}

export default PanelAyuda;
