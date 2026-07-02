/**
 * Tipos del contrato del backend NodeRPG que consume el frontend.
 *
 * El endpoint `GET /command?command=<cmd>&sessionId=<id>` devuelve siempre un
 * `CommandResponse`. El campo `data` cambia de forma según el comando: se modela
 * como `unknown` en la respuesta genérica y se refina con type guards cuando un
 * componente necesita una forma concreta.
 */

/** Respuesta cruda del backend (forma estable para todos los comandos). */
export interface CommandResponse {
  command: string;
  sessionId: string;
  content: string;
  ok: boolean;
  enHub?: boolean;
  data?: unknown;
  completions?: Record<string, string[]>;
}

/** Forma de error que puede devolver el backend (status 400). */
export interface ErrorResponse {
  error: string;
}

// --- Shapes de `data` por comando -----------------------------------------

/** `perfil` */
export interface PerfilData {
  plata: number;
  mejoras: string[];
  enHub: boolean;
  plataSinBancar: number;
}

/** Resumen de una run terminada (item del histórico). */
export interface ResumenRun {
  runId: string;
  sessionId?: string;
  nombre: string;
  salasVisitadas: number;
  oro: number;
  nivel?: number;
  vidaActual?: number;
  plataBankeada?: number;
  causa?: string;
  terminadaEn: string;
}

/** `historial` */
export interface HistorialData {
  runs: ResumenRun[];
}

/** Jugador dentro del snapshot de una run (detalle). */
export interface JugadorDetalle {
  nombre: string;
  vidaMaxima: number;
  vidaActual: number;
  destreza: number;
  oro: number;
  xp: number;
  nivel: number;
  inventario: string[];
  equipados: string[];
}

/** Escenario dentro del snapshot de una run (detalle). */
export interface EscenarioDetalle {
  lugarId: string;
  salasVisitadas: string[];
}

/** Snapshot completo de una run (detalle). */
export interface RunDetalle {
  runId: string;
  sessionId: string;
  semilla: number;
  plataAcumulada: number;
  jugador: JugadorDetalle;
  escenario: EscenarioDetalle;
}

/** `detalle:<runId>` */
export interface DetalleData {
  resumen: ResumenRun;
  detalle: RunDetalle;
}

/** Artículo de la tienda (hub o run). */
export interface ArticuloTienda {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  moneda: string;
  puedePagar: boolean;
}

/** `tienda` */
export interface TiendaData {
  enHub: boolean;
  moneda: 'plata' | 'oro';
  plata?: number;
  oro?: number;
  articulos: ArticuloTienda[];
}

/** `crear` */
export interface CrearData {
  enHub: boolean;
  runId: string;
  semilla: number;
  nombre: string;
  vidaActual: number;
  lugar: string;
}

/** `status` */
export interface StatusData {
  nombre: string;
  nivel: number;
  xp: number;
  xpParaSiguiente: number;
  vidaActual: number;
  vidaMaxima: number;
  claseDeArmadura: number;
  dadoDeGolpe: string;
  oro: number;
  inventario: string[];
  equipados: string[];
}

/** `escenario` y `mover` (mover añade `salasVisitadas`). */
export interface EscenarioData {
  lugar: string;
  lugarId: string;
  personajes: string[];
  objetos: string[];
  salidas: Record<string, string>;
  salasVisitadas?: string[];
}

/** `atacar` */
export interface AtacarData {
  objetivo: string;
  daño: number;
  vidaRestante: number;
  murio: boolean;
  dañoRecibido: number;
  vidaJugador: number;
  murioJugador: boolean;
  oroGanado: number;
  plataGanada: number;
  botin: string[];
  xpGanada: number;
  subioNivel: boolean;
  nivel: number;
  terminada: boolean;
  causaFin?: string;
}

/** `equipar` */
export interface EquiparData {
  equipados: string[];
}

/** `usar` */
export interface UsarData {
  objeto: string;
  vidaActual: number;
  vidaMaxima: number;
  destreza: number;
}

/** `abandonar` */
export interface AbandonarData {
  terminada: boolean;
  causaFin?: string;
}

// --- Type guards ----------------------------------------------------------

/** Indica si `data` parece terminar la run (vuelta al hub). */
export function runTerminada(data: unknown): boolean {
  if (data && typeof data === 'object' && 'terminada' in data) {
    return Boolean((data as { terminada?: unknown }).terminada);
  }
  return false;
}
