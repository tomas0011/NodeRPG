import { useState } from 'react';
import Boton from '../common/Boton';
import ToggleTema from '../common/ToggleTema';
import PanelUbicacion from './PanelUbicacion';
import PanelInventario from './PanelInventario';
import BarraEstado from './BarraEstado';
import Consola from './Consola';
import PanelAyuda from './PanelAyuda';
import BotonAbandonar from './BotonAbandonar';

/** Pantalla de partida: paneles (ubicación/inventario/estado) + consola. */
function Run() {
  const [mostrarTui, setMostrarTui] = useState(false);

  return (
    <div className="app-shell">
      <header className="cabecera-app">
        <h1 className="titulo-medieval">NodeRPG · Partida</h1>
        <span className="fila-acciones">
          <Boton
            variante={mostrarTui ? 'normal' : 'primario'}
            aria-expanded={mostrarTui}
            aria-controls="run-tui"
            onClick={() => {
              setMostrarTui((actual) => !actual);
            }}
          >
            {mostrarTui ? 'Minimizar TUI' : 'Desplegar TUI'}
          </Boton>
          <BotonAbandonar />
          <ToggleTema />
        </span>
      </header>

      <main className={`run${mostrarTui ? '' : ' run--tui-oculto'}`}>
        {mostrarTui ? (
          <div className="run__paneles" id="run-tui">
            <BarraEstado />
            <PanelUbicacion />
            <PanelInventario />
          </div>
        ) : null}

        <div className="run__consola">
          <Consola />
          {mostrarTui ? <PanelAyuda /> : null}
        </div>
      </main>
    </div>
  );
}

export default Run;
