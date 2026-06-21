import Panel from '../common/Panel';
import { useGame } from '../../context/GameContext';

/** Porcentaje acotado a [0, 100] para las barras. */
function porcentaje(actual: number, maximo: number): number {
  if (maximo <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (actual / maximo) * 100));
}

/** Barra de vida, nivel/xp, oro, destreza, CA y dado de golpe (de `status`). */
function BarraEstado() {
  const { status } = useGame();

  if (!status) {
    return (
      <Panel titulo="Estado">
        <p className="texto-suave">Cargando estado…</p>
      </Panel>
    );
  }

  return (
    <Panel titulo={status.nombre}>
      <div className="barra-estado">
        <div>
          <div className="fila-acciones" style={{ justifyContent: 'space-between' }}>
            <span className="texto-tenue">Vida</span>
            <span className="mono">
              {status.vidaActual}/{status.vidaMaxima}
            </span>
          </div>
          <div className="barra-vida">
            <div
              className="barra-vida__relleno"
              style={{ width: `${porcentaje(status.vidaActual, status.vidaMaxima)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="fila-acciones" style={{ justifyContent: 'space-between' }}>
            <span className="texto-tenue">Nivel {status.nivel}</span>
            <span className="mono">
              {status.xp}/{status.xpParaSiguiente} XP
            </span>
          </div>
          <div className="barra-xp">
            <div
              className="barra-xp__relleno"
              style={{ width: `${porcentaje(status.xp, status.xpParaSiguiente)}%` }}
            />
          </div>
        </div>

        <div className="stats-grid">
          <span>Oro</span>
          <span className="mono">{status.oro}</span>
          <span>Clase de armadura</span>
          <span className="mono">{status.claseDeArmadura}</span>
          <span>Dado de golpe</span>
          <span className="mono">{status.dadoDeGolpe}</span>
        </div>
      </div>
    </Panel>
  );
}

export default BarraEstado;
