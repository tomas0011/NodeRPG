import { useCallback, useEffect, useState } from 'react';
import Panel from '../common/Panel';
import Boton from '../common/Boton';
import { RequestManager } from '../../utils/RequestManager';
import { TiendaData } from '../../api/tipos';
import { useGame } from '../../context/GameContext';

const rm = RequestManager.getInstance();

function esTiendaData(data: unknown): data is TiendaData {
  return !!data && typeof data === 'object' && 'articulos' in data && 'moneda' in data;
}

/** Catálogo de mejoras del hub (plata). Al comprar refresca perfil + tienda. */
function TiendaMejoras() {
  const { ejecutar, ocupado } = useGame();
  const [tienda, setTienda] = useState<TiendaData | null>(null);

  const cargarTienda = useCallback(async () => {
    const resp = await rm.enviar('tienda');
    if (resp.ok && esTiendaData(resp.data)) {
      setTienda(resp.data);
    }
  }, []);

  useEffect(() => {
    void cargarTienda();
  }, [cargarTienda]);

  const comprar = useCallback(
    async (id: string) => {
      // `ejecutar` registra en consola y refresca perfil/historial; luego
      // recargamos la tienda para reflejar `puedePagar` actualizado.
      await ejecutar(`comprar:${id}`);
      await cargarTienda();
    },
    [ejecutar, cargarTienda]
  );

  return (
    <Panel titulo="Tienda de mejoras" className="hub__ancho-completo">
      {tienda && tienda.articulos.length > 0 ? (
        <div className="grilla-articulos">
          {tienda.articulos.map((articulo) => (
            <div className="tienda-articulo" key={articulo.id}>
              <div className="tienda-articulo__cabecera">
                <strong>{articulo.nombre}</strong>
                <span className="tienda-articulo__costo">
                  {articulo.costo} {articulo.moneda}
                </span>
              </div>
              <p className="texto-tenue" style={{ margin: 0, fontSize: '0.85rem' }}>
                {articulo.descripcion}
              </p>
              <Boton
                variante="primario"
                disabled={!articulo.puedePagar || ocupado}
                onClick={() => {
                  void comprar(articulo.id);
                }}
              >
                {articulo.puedePagar ? 'Comprar' : 'Plata insuficiente'}
              </Boton>
            </div>
          ))}
        </div>
      ) : (
        <p className="texto-suave">No hay mejoras disponibles ahora mismo.</p>
      )}
    </Panel>
  );
}

export default TiendaMejoras;
