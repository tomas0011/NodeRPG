import { useState } from 'react';
import Boton from '../common/Boton';
import { useGame } from '../../context/GameContext';

/** Abandona la partida (con confirmación) y vuelve al hub. */
function BotonAbandonar() {
  const { ejecutar, ocupado } = useGame();
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <span className="fila-acciones">
        <span className="texto-tenue">¿Seguro?</span>
        <Boton
          variante="peligro"
          disabled={ocupado}
          onClick={() => {
            setConfirmando(false);
            void ejecutar('abandonar');
          }}
        >
          Sí, abandonar
        </Boton>
        <Boton variante="chip" onClick={() => setConfirmando(false)}>
          Cancelar
        </Boton>
      </span>
    );
  }

  return (
    <Boton variante="peligro" disabled={ocupado} onClick={() => setConfirmando(true)}>
      Abandonar
    </Boton>
  );
}

export default BotonAbandonar;
