import ToggleTema from '../common/ToggleTema';
import PanelPerfil from './PanelPerfil';
import BotonNuevaPartida from './BotonNuevaPartida';
import Historico from './Historico';
import TiendaMejoras from './TiendaMejoras';
import Panel from '../common/Panel';

/** Pantalla principal del hub: perfil, crear partida, histórico y tienda. */
function Hub() {
  return (
    <div className="app-shell">
      <header className="cabecera-app">
        <h1 className="titulo-medieval">NodeRPG · El Hub</h1>
        <ToggleTema />
      </header>

      <main className="hub">
        <div className="hub__grid">
          <PanelPerfil />

          <Panel titulo="Aventura">
            <p className="texto-tenue">
              Comienza una nueva partida. Tu plata y mejoras del perfil te
              acompañan en cada run.
            </p>
            <div className="fila-acciones" style={{ marginTop: 12 }}>
              <BotonNuevaPartida />
            </div>
          </Panel>

          <TiendaMejoras />
          <Historico />
        </div>
      </main>
    </div>
  );
}

export default Hub;
