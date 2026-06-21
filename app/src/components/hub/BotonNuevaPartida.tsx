import Boton from '../common/Boton';
import { useGame } from '../../context/GameContext';

/** Ejecuta `crear`; el GameContext detecta enHub:false y entra a la partida. */
function BotonNuevaPartida() {
  const { ejecutar, ocupado } = useGame();

  return (
    <Boton
      variante="primario"
      onClick={() => {
        void ejecutar('crear');
      }}
      disabled={ocupado}
    >
      Nueva partida
    </Boton>
  );
}

export default BotonNuevaPartida;
