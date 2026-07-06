import Panel from '../common/Panel';
import Boton from '../common/Boton';
import { useGame } from '../../context/GameContext';

/**
 * Panel de inventario (de `status`): objetos del inventario con botones
 * contextuales (equipar / usar) y la lista de equipados.
 */
function PanelInventario() {
  const { status, ejecutar, ocupado } = useGame();

  if (!status) {
    return (
      <Panel titulo="Inventario">
        <p className="texto-suave">Cargando inventario…</p>
      </Panel>
    );
  }

  return (
    <Panel titulo="Inventario">
      {status.inventario.length > 0 ? (
        <ul className="lista-entidades">
          {status.inventario.map((obj, i) => (
            <li key={`${obj}-${i}`}>
              <span>{obj}</span>
              <span className="fila-acciones">
                {/* Con equipo por nombre, un duplicado de algo ya equipado no
                    puede re-equiparse: no se ofrece el botón. */}
                {!status.equipados.includes(obj) ? (
                  <Boton
                    variante="chip"
                    disabled={ocupado}
                    onClick={() => {
                      void ejecutar(`equipar:${obj}`);
                    }}
                  >
                    Equipar
                  </Boton>
                ) : null}
                <Boton
                  variante="chip"
                  disabled={ocupado}
                  onClick={() => {
                    void ejecutar(`usar:${obj}`);
                  }}
                >
                  Usar
                </Boton>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="texto-suave">Inventario vacío.</p>
      )}

      <h3 className="panel__titulo" style={{ marginTop: 14 }}>
        Equipados
      </h3>
      {status.equipados.length > 0 ? (
        <ul className="lista-entidades">
          {status.equipados.map((obj, i) => (
            <li key={`${obj}-${i}`}>
              <span>{obj}</span>
              <span className="fila-acciones">
                <Boton
                  variante="chip"
                  disabled={ocupado}
                  onClick={() => {
                    void ejecutar(`desequipar:${obj}`);
                  }}
                >
                  Desequipar
                </Boton>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="texto-suave">Sin equipo.</p>
      )}
    </Panel>
  );
}

export default PanelInventario;
