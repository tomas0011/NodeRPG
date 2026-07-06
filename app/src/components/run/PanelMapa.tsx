import Panel from '../common/Panel';
import { useGame } from '../../context/GameContext';
import { SalaDeMapa } from '../../api/tipos';

/**
 * Minimapa de la run (estilo Binding of Isaac): grilla de salas descubiertas
 * con niebla de guerra. Solo visual — el movimiento sigue siendo por el
 * comando `mover` o los botones de salidas del PanelUbicacion.
 */

/** Ícono por tipo de sala; las no visitadas son incógnitas. */
function iconoDeSala(sala: SalaDeMapa): string {
  if (!sala.visitada) {
    return '?';
  }
  switch (sala.tipo) {
    case 'bar':
      return 'B';
    case 'combate':
      return '⚔';
    case 'tienda':
      return '$';
    case 'jefe':
      return '☠';
    default:
      // pasillo / descanso / desconocido
      return '~';
  }
}

function etiquetaDeSala(sala: SalaDeMapa, esActual: boolean): string {
  if (!sala.visitada) {
    return 'Sala sin explorar';
  }
  const nombre = sala.nombre || sala.id;
  return esActual ? `Sala actual: ${nombre}` : nombre;
}

function PanelMapa() {
  const { mapa } = useGame();

  if (!mapa || mapa.salas.length === 0) {
    return (
      <Panel titulo="Mapa">
        <p className="texto-suave">Explorando el mapa…</p>
      </Panel>
    );
  }

  const columnas = Math.max(...mapa.salas.map((sala) => sala.x)) + 1;
  const filas = Math.max(...mapa.salas.map((sala) => sala.y)) + 1;

  return (
    <Panel titulo="Mapa">
      <div
        className="mapa"
        role="img"
        aria-label="Minimapa de las salas descubiertas"
        style={{
          gridTemplateColumns: `repeat(${columnas}, var(--mapa-celda))`,
          gridTemplateRows: `repeat(${filas}, var(--mapa-celda))`
        }}
      >
        {mapa.salas.map((sala) => {
          const esActual = sala.id === mapa.lugarActual;
          const etiqueta = etiquetaDeSala(sala, esActual);
          const clases = [
            'mapa__celda',
            sala.visitada ? 'mapa__celda--visitada' : 'mapa__celda--incognita',
            esActual ? 'mapa__celda--actual' : ''
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div
              key={sala.id}
              className={clases}
              style={{ gridColumn: sala.x + 1, gridRow: sala.y + 1 }}
              title={etiqueta}
              aria-label={etiqueta}
            >
              {iconoDeSala(sala)}
              {sala.salidas.map((direccion) => (
                <span key={direccion} className={`mapa__tick mapa__tick--${direccion}`} />
              ))}
            </div>
          );
        })}
      </div>
      <p className="mapa__leyenda texto-suave">
        B bar · ⚔ combate · $ tienda · ☠ jefe · ~ sala · ? sin explorar
      </p>
    </Panel>
  );
}

export default PanelMapa;
