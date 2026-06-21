import Panel from '../common/Panel';
import { useGame } from '../../context/GameContext';

/** Muestra la plata acumulada del perfil y las mejoras compradas. */
function PanelPerfil() {
  const { perfil } = useGame();

  return (
    <Panel titulo="Perfil">
      {perfil ? (
        <>
          <div className="perfil-cifra">
            <strong>{perfil.plata}</strong>
            <span className="texto-tenue">de plata</span>
          </div>
          {perfil.plataSinBancar > 0 ? (
            <p className="texto-suave">
              Plata sin bancar: {perfil.plataSinBancar}
            </p>
          ) : null}
          <h3 className="panel__titulo" style={{ marginTop: 16 }}>
            Mejoras
          </h3>
          {perfil.mejoras.length > 0 ? (
            <ul className="lista-mejoras">
              {perfil.mejoras.map((mejora) => (
                <li key={mejora}>{mejora}</li>
              ))}
            </ul>
          ) : (
            <p className="texto-suave">Todavía no compraste mejoras.</p>
          )}
        </>
      ) : (
        <p className="texto-suave">Cargando perfil…</p>
      )}
    </Panel>
  );
}

export default PanelPerfil;
