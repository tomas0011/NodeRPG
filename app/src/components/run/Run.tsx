import ToggleTema from '../common/ToggleTema';
import PanelUbicacion from './PanelUbicacion';
import PanelInventario from './PanelInventario';
import BarraEstado from './BarraEstado';
import Consola from './Consola';
import PanelAyuda from './PanelAyuda';
import BotonAbandonar from './BotonAbandonar';

/** Pantalla de partida: paneles (ubicación/inventario/estado) + consola. */
function Run() {
  return (
    <div className="app-shell">
      <header className="cabecera-app">
        <h1 className="titulo-medieval">NodeRPG · Partida</h1>
        <span className="fila-acciones">
          <BotonAbandonar />
          <ToggleTema />
        </span>
      </header>

      <main className="run">
        <div className="run__paneles">
          <BarraEstado />
          <PanelUbicacion />
          <PanelInventario />
        </div>

        <div className="run__consola">
          <Consola />
          <PanelAyuda />
        </div>
      </main>
    </div>
  );
}

export default Run;
