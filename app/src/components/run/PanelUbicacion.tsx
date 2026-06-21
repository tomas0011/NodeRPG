import Panel from '../common/Panel';
import Boton from '../common/Boton';
import { useGame } from '../../context/GameContext';

/**
 * Panel de ubicación (de `escenario`): nombre del lugar, NPCs vivos, objetos en
 * el suelo (con botón tomar) y salidas como botones (clic = mover:<dir>).
 */
function PanelUbicacion() {
  const { escenario, ejecutar, ocupado } = useGame();

  if (!escenario) {
    return (
      <Panel titulo="Ubicación">
        <p className="texto-suave">Cargando ubicación…</p>
      </Panel>
    );
  }

  const salidas = Object.keys(escenario.salidas);

  return (
    <Panel titulo={escenario.lugar}>
      <h3 className="panel__titulo">Enemigos</h3>
      {escenario.personajes.length > 0 ? (
        <ul className="lista-entidades">
          {escenario.personajes.map((npc, i) => (
            <li key={`${npc}-${i}`}>
              <span>{npc}</span>
              <Boton
                variante="chip"
                disabled={ocupado}
                onClick={() => {
                  void ejecutar(`atacar:${npc}`);
                }}
              >
                Atacar
              </Boton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="texto-suave">No hay enemigos aquí.</p>
      )}

      <h3 className="panel__titulo" style={{ marginTop: 14 }}>
        Objetos en el suelo
      </h3>
      {escenario.objetos.length > 0 ? (
        <ul className="lista-entidades">
          {escenario.objetos.map((obj, i) => (
            <li key={`${obj}-${i}`}>
              <span>{obj}</span>
              <Boton
                variante="chip"
                disabled={ocupado}
                onClick={() => {
                  void ejecutar(`tomar:${obj}`);
                }}
              >
                Tomar
              </Boton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="texto-suave">No hay objetos en el suelo.</p>
      )}

      <h3 className="panel__titulo" style={{ marginTop: 14 }}>
        Salidas
      </h3>
      {salidas.length > 0 ? (
        <div className="salidas">
          {salidas.map((dir) => (
            <Boton
              key={dir}
              disabled={ocupado}
              onClick={() => {
                void ejecutar(`mover:${dir}`);
              }}
            >
              {dir}
            </Boton>
          ))}
        </div>
      ) : (
        <p className="texto-suave">No hay salidas visibles.</p>
      )}
    </Panel>
  );
}

export default PanelUbicacion;
