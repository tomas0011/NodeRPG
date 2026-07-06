import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CommandResponse } from '../api/tipos';

const mockEnviar = jest.fn<Promise<CommandResponse>, [string]>();
const mockRequestManager = { enviar: mockEnviar };

jest.mock('../utils/RequestManager', () => ({
  RequestManager: {
    getInstance: () => mockRequestManager
  }
}));

const { GameProvider, useGame } = require('./GameContext') as typeof import('./GameContext');

function respuestaBase(
  command: string,
  overrides: Partial<CommandResponse> = {}
): CommandResponse {
  return {
    command,
    sessionId: 'sesion-test',
    content: '',
    ok: true,
    enHub: true,
    completions: {},
    ...overrides
  };
}

function perfilHub() {
  return { plata: 10, mejoras: [], enHub: true, plataSinBancar: 0 };
}

function perfilRun() {
  return { plata: 10, mejoras: [], enHub: false, plataSinBancar: 0 };
}

function statusRun() {
  return {
    nombre: 'Heroe',
    nivel: 1,
    xp: 0,
    xpParaSiguiente: 100,
    vidaActual: 10,
    vidaMaxima: 10,
    claseDeArmadura: 10,
    dadoDeGolpe: '1d6',
    oro: 0,
    inventario: [],
    equipados: []
  };
}

function escenarioRun() {
  return {
    lugar: 'Taberna',
    lugarId: 'taberna',
    personajes: [],
    objetos: [],
    salidas: {}
  };
}

function mapaRun() {
  return {
    lugarActual: 'taberna',
    salas: [
      { id: 'taberna', x: 0, y: 0, visitada: true, salidas: ['este'], nombre: 'Taberna', tipo: 'bar' }
    ]
  };
}

function historialVacio() {
  return { runs: [] };
}

function Sonda() {
  const { cargando, enHub, mensajes, ejecutar } = useGame();

  if (cargando) {
    return <div data-testid="estado">cargando</div>;
  }

  return (
    <div>
      <div data-testid="estado">{enHub ? 'hub' : 'run'}</div>
      <div data-testid="mensajes">{mensajes.map((mensaje) => mensaje.texto).join(' | ')}</div>
      <button
        type="button"
        onClick={() => {
          void ejecutar('foo');
        }}
      >
        Ejecutar invalido
      </button>
      <button
        type="button"
        onClick={() => {
          void ejecutar('abandonar');
        }}
      >
        Abandonar
      </button>
      <button
        type="button"
        onClick={() => {
          void ejecutar('atacar:rata');
        }}
      >
        Atacar
      </button>
    </div>
  );
}

describe('GameProvider', () => {
  beforeEach(() => {
    mockEnviar.mockReset();
  });

  it('mantiene la run actual cuando un comando invalido falla', async () => {
    mockEnviar.mockImplementation(async (command: string) => {
      switch (command) {
        case 'perfil':
          return respuestaBase(command, { enHub: false, data: perfilRun() });
        case 'status':
          return respuestaBase(command, { enHub: false, data: statusRun() });
        case 'escenario':
          return respuestaBase(command, { enHub: false, data: escenarioRun() });
        case 'mapa':
          return respuestaBase(command, { enHub: false, data: mapaRun() });
        case 'foo':
          return respuestaBase(command, {
            ok: false,
            enHub: undefined,
            content: 'Comando inválido.'
          });
        default:
          throw new Error(`Comando inesperado en test: ${command}`);
      }
    });

    render(
      <GameProvider>
        <Sonda />
      </GameProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('run');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar invalido' }));

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('run');
      expect(screen.getByTestId('mensajes')).toHaveTextContent('Comando inválido.');
      expect(mockEnviar).toHaveBeenCalledTimes(5);
    });

    expect(mockEnviar.mock.calls.map(([command]) => command)).toEqual([
      'perfil',
      'status',
      'escenario',
      'mapa',
      'foo'
    ]);
  });

  it('mantiene el hub actual cuando un comando invalido falla', async () => {
    mockEnviar.mockImplementation(async (command: string) => {
      switch (command) {
        case 'perfil':
          return respuestaBase(command, { enHub: true, data: perfilHub() });
        case 'historial':
          return respuestaBase(command, { enHub: true, data: historialVacio() });
        case 'foo':
          return respuestaBase(command, {
            ok: false,
            enHub: undefined,
            content: 'Comando inválido.'
          });
        default:
          throw new Error(`Comando inesperado en test: ${command}`);
      }
    });

    render(
      <GameProvider>
        <Sonda />
      </GameProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('hub');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar invalido' }));

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('hub');
      expect(screen.getByTestId('mensajes')).toHaveTextContent('Comando inválido.');
      expect(mockEnviar).toHaveBeenCalledTimes(3);
    });

    expect(mockEnviar.mock.calls.map(([command]) => command)).toEqual([
      'perfil',
      'historial',
      'foo'
    ]);
  });

  it('refresca el hub cuando un comando falla porque la run ya no existe (ok:false + enHub:true)', async () => {
    mockEnviar.mockImplementation(async (command: string) => {
      switch (command) {
        case 'perfil':
          return respuestaBase(command, { enHub: false, data: perfilRun() });
        case 'status':
          return respuestaBase(command, { enHub: false, data: statusRun() });
        case 'escenario':
          return respuestaBase(command, { enHub: false, data: escenarioRun() });
        case 'mapa':
          return respuestaBase(command, { enHub: false, data: mapaRun() });
        case 'atacar:rata':
          return respuestaBase(command, {
            ok: false,
            enHub: true,
            content: 'Estás en el hub: no hay run activa.'
          });
        case 'historial':
          return respuestaBase(command, { enHub: true, data: historialVacio() });
        default:
          throw new Error(`Comando inesperado en test: ${command}`);
      }
    });

    render(
      <GameProvider>
        <Sonda />
      </GameProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('run');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Atacar' }));

    // Cambia al hub Y re-pide perfil + historial (aunque el comando falló).
    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('hub');
      expect(mockEnviar).toHaveBeenCalledTimes(7);
    });

    expect(mockEnviar.mock.calls.map(([command]) => command)).toEqual([
      'perfil',
      'status',
      'escenario',
      'mapa',
      'atacar:rata',
      'perfil',
      'historial'
    ]);
  });

  it('sigue refrescando el hub cuando la respuesta valida termina la run', async () => {
    mockEnviar.mockImplementation(async (command: string) => {
      switch (command) {
        case 'perfil':
          return respuestaBase(command, { enHub: false, data: perfilRun() });
        case 'status':
          return respuestaBase(command, { enHub: false, data: statusRun() });
        case 'escenario':
          return respuestaBase(command, { enHub: false, data: escenarioRun() });
        case 'mapa':
          return respuestaBase(command, { enHub: false, data: mapaRun() });
        case 'abandonar':
          return respuestaBase(command, {
            enHub: true,
            content: 'La run terminó.',
            data: { terminada: true }
          });
        case 'historial':
          return respuestaBase(command, { enHub: true, data: historialVacio() });
        default:
          throw new Error(`Comando inesperado en test: ${command}`);
      }
    });

    render(
      <GameProvider>
        <Sonda />
      </GameProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('run');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Abandonar' }));

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('hub');
      expect(mockEnviar).toHaveBeenCalledTimes(7);
    });

    expect(mockEnviar.mock.calls.map(([command]) => command)).toEqual([
      'perfil',
      'status',
      'escenario',
      'mapa',
      'abandonar',
      'perfil',
      'historial'
    ]);
  });
});
