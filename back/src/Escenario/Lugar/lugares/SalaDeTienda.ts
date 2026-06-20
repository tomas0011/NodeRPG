import Sala from "./Sala";

/**
 * Sala de tienda en-run: sin enemigos. Marca la ubicación donde se puede
 * comprar equipo/consumibles con oro (comando `comprar`, 3d).
 *
 * La integración "comprar sólo en `SalaDeTienda`" se deja para más adelante: en
 * 3f la sala se crea y conecta en el mapa, pero `comprar` sigue disponible como
 * en 3d para no romper sus tests. Cuando se ate la restricción, este tipo de
 * sala es el punto de anclaje.
 */
export default class SalaDeTienda extends Sala {}
