import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { RequestManager } from '../utils/RequestManager';
import {
  CommandResponse,
  EscenarioData,
  HistorialData,
  PerfilData,
  StatusData,
  runTerminada
} from '../api/tipos';

/** Una línea del log de la consola. */
export interface MensajeConsola {
  id: number;
  tipo: 'comando' | 'respuesta' | 'error' | 'sistema';
  texto: string;
}

interface GameContextValue {
  /** true = hub (sin run activa); false = partida. */
  enHub: boolean;
  /** true mientras se resuelve la carga inicial. */
  cargando: boolean;
  /** true mientras hay un comando en vuelo. */
  ocupado: boolean;
  perfil: PerfilData | null;
  historial: HistorialData | null;
  status: StatusData | null;
  escenario: EscenarioData | null;
  mensajes: MensajeConsola[];
  /** Últimas completions recibidas, acumuladas por clave. */
  completions: Record<string, string[]>;
  /** Ejecuta un comando: actualiza estado + refresca paneles. */
  ejecutar: (comando: string) => Promise<CommandResponse>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const rm = RequestManager.getInstance();

function esStatusData(data: unknown): data is StatusData {
  return !!data && typeof data === 'object' && 'vidaMaxima' in data && 'inventario' in data;
}

function esEscenarioData(data: unknown): data is EscenarioData {
  return !!data && typeof data === 'object' && 'salidas' in data && 'lugar' in data;
}

function esPerfilData(data: unknown): data is PerfilData {
  return !!data && typeof data === 'object' && 'plata' in data && 'mejoras' in data;
}

function esHistorialData(data: unknown): data is HistorialData {
  return !!data && typeof data === 'object' && 'runs' in data;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [enHub, setEnHub] = useState<boolean>(true);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ocupado, setOcupado] = useState<boolean>(false);
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [historial, setHistorial] = useState<HistorialData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [escenario, setEscenario] = useState<EscenarioData | null>(null);
  const [mensajes, setMensajes] = useState<MensajeConsola[]>([]);
  const [completions, setCompletions] = useState<Record<string, string[]>>({});

  // Contador para keys estables de los mensajes (evita usar índice como key).
  const contadorMensaje = useRef(0);

  const agregarMensaje = useCallback((tipo: MensajeConsola['tipo'], texto: string) => {
    if (!texto) {
      return;
    }
    contadorMensaje.current += 1;
    const id = contadorMensaje.current;
    setMensajes((previos) => [...previos, { id, tipo, texto: texto.trim() }]);
  }, []);

  /** Fusiona las completions nuevas en el acumulado (las claves nuevas pisan). */
  const fusionarCompletions = useCallback((nuevas?: Record<string, string[]>) => {
    if (!nuevas) {
      return;
    }
    setCompletions((previas) => ({ ...previas, ...nuevas }));
  }, []);

  /** Aplica el `data` de una respuesta a los paneles que correspondan. */
  const aplicarData = useCallback((resp: CommandResponse) => {
    const { data } = resp;
    if (esStatusData(data)) {
      setStatus(data);
    }
    if (esEscenarioData(data)) {
      setEscenario(data);
    }
    if (esPerfilData(data)) {
      setPerfil(data);
    }
    if (esHistorialData(data)) {
      setHistorial(data);
    }
  }, []);

  // Petición silenciosa (sin loguear en consola) para refrescar paneles.
  const refrescarSilencioso = useCallback(
    async (comando: string) => {
      const resp = await rm.enviar(comando);
      if (resp.ok) {
        aplicarData(resp);
        fusionarCompletions(resp.completions);
      }
      return resp;
    },
    [aplicarData, fusionarCompletions]
  );

  /** Refresca el contexto del hub (perfil + historial) sin loguear. */
  const refrescarHub = useCallback(async () => {
    await Promise.all([
      refrescarSilencioso('perfil'),
      refrescarSilencioso('historial')
    ]);
  }, [refrescarSilencioso]);

  /** Refresca los paneles de la partida (status + escenario) sin loguear. */
  const refrescarRun = useCallback(async () => {
    await Promise.all([
      refrescarSilencioso('status'),
      refrescarSilencioso('escenario')
    ]);
  }, [refrescarSilencioso]);

  const ejecutar = useCallback(
    async (comando: string): Promise<CommandResponse> => {
      const limpio = comando.trim();
      if (!limpio) {
        return {
          command: '',
          sessionId: '',
          content: '',
          ok: false,
          enHub
        };
      }
      setOcupado(true);
      agregarMensaje('comando', `> ${limpio}`);
      try {
        const resp = await rm.enviar(limpio);
        const proximoEnHub = typeof resp.enHub === 'boolean' ? resp.enHub : enHub;
        agregarMensaje(resp.ok ? 'respuesta' : 'error', resp.content);
        aplicarData(resp);
        fusionarCompletions(resp.completions);
        if (typeof resp.enHub === 'boolean') {
          setEnHub(resp.enHub);
        }

        // Refresco automático de paneles tras cada comando:
        //  - si la run terminó o caímos al hub, refrescamos el hub;
        //  - si seguimos en partida, re-pedimos status + escenario.
        if (resp.ok && (resp.enHub || runTerminada(resp.data))) {
          await refrescarHub();
        } else if (resp.ok && !proximoEnHub) {
          await refrescarRun();
        }
        return resp;
      } finally {
        setOcupado(false);
      }
    },
    [enHub, agregarMensaje, aplicarData, fusionarCompletions, refrescarHub, refrescarRun]
  );

  // Carga inicial: `perfil` nos dice si estamos en hub o en run. Luego cargamos
  // el contexto correspondiente. Sin dependencias externas mutables para evitar
  // warnings de exhaustive-deps (las callbacks son estables vía useCallback).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const resp = await rm.enviar('perfil');
      if (cancelado) {
        return;
      }
      aplicarData(resp);
      fusionarCompletions(resp.completions);
      if (typeof resp.enHub === 'boolean') {
        setEnHub(resp.enHub);
      }
      if (!resp.ok) {
        agregarMensaje('error', resp.content);
        setCargando(false);
        return;
      }
      if (resp.enHub) {
        agregarMensaje('sistema', 'Bienvenido al hub. Crea una partida para empezar.');
        await refrescarSilencioso('historial');
      } else {
        agregarMensaje('sistema', 'Retomas tu partida en curso.');
        await refrescarRun();
      }
      if (!cancelado) {
        setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [aplicarData, fusionarCompletions, agregarMensaje, refrescarSilencioso, refrescarRun]);

  const valor = useMemo<GameContextValue>(
    () => ({
      enHub,
      cargando,
      ocupado,
      perfil,
      historial,
      status,
      escenario,
      mensajes,
      completions,
      ejecutar
    }),
    [
      enHub,
      cargando,
      ocupado,
      perfil,
      historial,
      status,
      escenario,
      mensajes,
      completions,
      ejecutar
    ]
  );

  return <GameContext.Provider value={valor}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame debe usarse dentro de <GameProvider>.');
  }
  return ctx;
}
