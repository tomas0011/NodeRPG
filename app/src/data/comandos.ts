/**
 * Catálogo estático de comandos del front. Sirve para:
 *  - el autocompletado de nombres de comando (filtrado por contexto hub/run),
 *  - la ayuda contextual (descripciones + qué comandos valen ahora).
 *
 * El backend NO ofrece una ayuda contextual (su `help` lista todo sin filtrar),
 * así que la armamos acá usando `enHub` + las `completions` del momento.
 */

export type ContextoComando = 'hub' | 'run' | 'ambos';

export interface DefinicionComando {
  /** Clave base del comando (sin argumentos). */
  nombre: string;
  /** Texto de ayuda para el usuario. */
  descripcion: string;
  /** Dónde es válido el comando. */
  contexto: ContextoComando;
  /**
   * Si el comando admite argumento `comando:<arg>`, la clave de `completions`
   * que lo alimenta. Ausente = comando sin argumento.
   */
  claveCompletions?: string;
}

export const COMANDOS: DefinicionComando[] = [
  // --- Hub ---
  { nombre: 'crear', descripcion: 'Comienza una nueva partida.', contexto: 'hub' },
  { nombre: 'historial', descripcion: 'Muestra tu histórico de personajes.', contexto: 'hub' },
  {
    nombre: 'detalle',
    descripcion: 'Inspecciona una run del histórico: detalle:<runId>.',
    contexto: 'hub',
    claveCompletions: 'detalle'
  },
  // --- Run ---
  { nombre: 'escenario', descripcion: 'Describe el lugar actual.', contexto: 'run' },
  { nombre: 'status', descripcion: 'Muestra tu estado: vida, nivel, oro, equipo.', contexto: 'run' },
  {
    nombre: 'mover',
    descripcion: 'Te mueves a una salida: mover:<dirección>.',
    contexto: 'run',
    claveCompletions: 'mover'
  },
  {
    nombre: 'tomar',
    descripcion: 'Recoges un objeto del suelo: tomar:<objeto>.',
    contexto: 'run',
    claveCompletions: 'tomar'
  },
  {
    nombre: 'atacar',
    descripcion: 'Atacas a un enemigo: atacar:<enemigo>.',
    contexto: 'run',
    claveCompletions: 'atacar'
  },
  {
    nombre: 'equipar',
    descripcion: 'Equipas un objeto del inventario: equipar:<objeto>.',
    contexto: 'run',
    claveCompletions: 'equipar'
  },
  {
    nombre: 'usar',
    descripcion: 'Usas un consumible: usar:<objeto>.',
    contexto: 'run',
    claveCompletions: 'usar'
  },
  { nombre: 'abandonar', descripcion: 'Abandonas la partida y vuelves al hub.', contexto: 'run' },
  // --- Ambos ---
  {
    nombre: 'tienda',
    descripcion: 'Abre la tienda (mejoras con plata en el hub, equipo con oro en run).',
    contexto: 'ambos'
  },
  {
    nombre: 'comprar',
    descripcion: 'Compras un artículo: comprar:<id>.',
    contexto: 'ambos',
    claveCompletions: 'comprar'
  },
  { nombre: 'perfil', descripcion: 'Muestra tu perfil: plata y mejoras.', contexto: 'ambos' }
];

/** Comandos válidos en el contexto actual (hub o run). */
export function comandosDeContexto(enHub: boolean): DefinicionComando[] {
  const contexto: ContextoComando = enHub ? 'hub' : 'run';
  return COMANDOS.filter(
    (c) => c.contexto === contexto || c.contexto === 'ambos'
  );
}

/** Busca la definición de un comando por su nombre base. */
export function definicionDe(nombre: string): DefinicionComando | undefined {
  return COMANDOS.find((c) => c.nombre === nombre);
}
