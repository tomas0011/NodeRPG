import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PanelMapa from './PanelMapa';
import { useGame } from '../../context/GameContext';
import { MapaData } from '../../api/tipos';

jest.mock('../../context/GameContext', () => ({
  useGame: jest.fn()
}));

const mockUseGame = useGame as jest.MockedFunction<typeof useGame>;

function contextoConMapa(mapa: MapaData | null) {
  return {
    enHub: false,
    cargando: false,
    ocupado: false,
    perfil: null,
    historial: null,
    status: null,
    escenario: null,
    mapa,
    mensajes: [],
    completions: {},
    ejecutar: jest.fn()
  };
}

function mapaDeMuestra(): MapaData {
  return {
    lugarActual: 'pasillo',
    salas: [
      { id: 'bar', x: 0, y: 1, visitada: true, salidas: ['este'], nombre: 'Bar Puerco Verde', tipo: 'bar' },
      { id: 'pasillo', x: 1, y: 1, visitada: true, salidas: ['oeste', 'norte'], nombre: 'Pasillo lúgubre', tipo: 'pasillo' },
      { id: 'sala-combate', x: 1, y: 0, visitada: false, salidas: [] }
    ]
  };
}

describe('PanelMapa', () => {
  it('muestra el placeholder cuando todavía no hay mapa', () => {
    mockUseGame.mockReturnValue(contextoConMapa(null));
    render(<PanelMapa />);
    expect(screen.getByText('Explorando el mapa…')).toBeInTheDocument();
  });

  it('renderiza una celda por sala con su ícono por tipo', () => {
    mockUseGame.mockReturnValue(contextoConMapa(mapaDeMuestra()));
    render(<PanelMapa />);

    const bar = screen.getByLabelText('Bar Puerco Verde');
    expect(bar).toHaveTextContent('B');
    expect(bar).toHaveClass('mapa__celda--visitada');

    const incognita = screen.getByLabelText('Sala sin explorar');
    expect(incognita).toHaveTextContent('?');
    expect(incognita).toHaveClass('mapa__celda--incognita');
  });

  it('resalta la sala actual', () => {
    mockUseGame.mockReturnValue(contextoConMapa(mapaDeMuestra()));
    render(<PanelMapa />);

    const actual = screen.getByLabelText('Sala actual: Pasillo lúgubre');
    expect(actual).toHaveClass('mapa__celda--actual');
    expect(actual).toHaveTextContent('~');
  });

  it('posiciona cada sala en su celda de la grilla', () => {
    mockUseGame.mockReturnValue(contextoConMapa(mapaDeMuestra()));
    render(<PanelMapa />);

    const bar = screen.getByLabelText('Bar Puerco Verde');
    expect(bar).toHaveStyle({ gridColumn: '1', gridRow: '2' });
    const incognita = screen.getByLabelText('Sala sin explorar');
    expect(incognita).toHaveStyle({ gridColumn: '2', gridRow: '1' });
  });
});
