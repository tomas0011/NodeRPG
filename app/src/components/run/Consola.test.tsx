import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Consola from './Consola';
import { useGame } from '../../context/GameContext';

jest.mock('../../context/GameContext', () => ({
  useGame: jest.fn()
}));

const mockUseGame = useGame as jest.MockedFunction<typeof useGame>;
const mockEjecutar = jest.fn().mockResolvedValue({
  command: '',
  sessionId: 'test',
  content: '',
  ok: true,
  enHub: false
});

function crearContextoParcial() {
  return {
    enHub: false,
    cargando: false,
    ocupado: false,
    perfil: null,
    historial: null,
    status: null,
    escenario: null,
    mensajes: [],
    completions: {
      mover: ['norte', 'sur'],
      usar: ['pocion de curacion', 'mapa del bosque']
    },
    ejecutar: mockEjecutar
  };
}

describe('Consola', () => {
  beforeEach(() => {
    mockEjecutar.mockClear();
    mockUseGame.mockReset();
    mockUseGame.mockReturnValue(crearContextoParcial());
  });

  it('no muestra sugerencias al enfocar con el input vacio y las oculta al limpiar el prefijo', () => {
    render(<Consola />);

    const input = screen.getByRole('textbox');

    fireEvent.focus(input);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'mo' } });
    expect(screen.getByText('mover')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('mover')).not.toBeInTheDocument();
  });

  it('filtra comandos ignorando mayusculas y no lista otros no coincidentes', () => {
    render(<Consola />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'MO' } });

    expect(screen.getByText('mover')).toBeInTheDocument();
    expect(screen.queryByText('tomar')).not.toBeInTheDocument();
    expect(screen.queryByText('usar')).not.toBeInTheDocument();
  });

  it('filtra argumentos ignorando mayusculas y tildes', () => {
    render(<Consola />);

    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'usar:po' } });
    expect(screen.getByText('pocion de curacion')).toBeInTheDocument();
    expect(screen.queryByText('mapa del bosque')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'USAR:P\u00f3' } });
    expect(screen.getByText('pocion de curacion')).toBeInTheDocument();
    expect(screen.queryByText('mapa del bosque')).not.toBeInTheDocument();
  });

  it('no lista todos los argumentos cuando el prefijo tras ":" esta vacio', () => {
    render(<Consola />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'usar:' } });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('pocion de curacion')).not.toBeInTheDocument();
    expect(screen.queryByText('mapa del bosque')).not.toBeInTheDocument();
  });

  it('recupera el foco al re-habilitar el input despues de enviar con Enter', () => {
    const estado = crearContextoParcial();
    mockUseGame.mockImplementation(() => estado);

    const { rerender } = render(<Consola />);
    const input = screen.getByRole('textbox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'status' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockEjecutar).toHaveBeenCalledWith('status');
    expect(input).toHaveValue('');

    estado.ocupado = true;
    rerender(<Consola />);
    expect(input).toBeDisabled();

    estado.ocupado = false;
    rerender(<Consola />);
    expect(input).toBeEnabled();
    expect(input).toHaveFocus();
  });
});
