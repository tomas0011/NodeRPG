import { ThemeProvider } from './context/ThemeContext';
import { GameProvider, useGame } from './context/GameContext';
import Hub from './components/hub/Hub';
import Run from './components/run/Run';

/** Conmuta Hub/Partida según `enHub`; muestra un estado de carga inicial. */
function Pantalla() {
  const { enHub, cargando } = useGame();

  if (cargando) {
    return (
      <div className="app-shell">
        <div className="cargando">Cargando NodeRPG…</div>
      </div>
    );
  }

  return enHub ? <Hub /> : <Run />;
}

function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <Pantalla />
      </GameProvider>
    </ThemeProvider>
  );
}

export default App;
