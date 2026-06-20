import Sala from "./Sala";

/**
 * Sala de descanso: sin enemigos. Lugar seguro donde puede haber consumibles
 * (p. ej. una poción) para recuperarse. Su contenido sale del `MapaLayout`.
 *
 * Nota: la cura activa al entrar es una mejora posible para más adelante; en 3f
 * la sala sólo se declara sin enemigos y con su botín de descanso.
 */
export default class SalaDeDescanso extends Sala {}
