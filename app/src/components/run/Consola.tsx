import React, { useEffect, useRef, useState } from 'react';
import Autocomplete from './Autocomplete';
import { useGame } from '../../context/GameContext';
import { useAutocomplete } from '../../hooks/useAutocomplete';

/**
 * Consola: log de mensajes con auto-scroll + input con autocompletado contextual
 * e histórico de comandos (↑/↓ cuando hay/no hay sugerencias).
 */
function Consola() {
  const { mensajes, completions, enHub, ejecutar, ocupado } = useGame();
  const [valor, setValor] = useState('');
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Histórico de comandos enviados (para navegar con ↑/↓ con input vacío).
  const historial = useRef<string[]>([]);
  const indiceHistorial = useRef<number>(-1);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debeRecuperarFoco = useRef(false);

  const { sugerencias, aplicar } = useAutocomplete({ valor, enHub, completions });

  // Auto-scroll al fondo cuando llegan mensajes nuevos.
  useEffect(() => {
    const nodo = logRef.current;
    if (nodo) {
      nodo.scrollTop = nodo.scrollHeight;
    }
  }, [mensajes]);

  // Mantener el índice activo dentro de rango cuando cambian las sugerencias.
  useEffect(() => {
    setIndiceActivo((actual) =>
      sugerencias.length === 0 ? 0 : Math.min(actual, sugerencias.length - 1)
    );
  }, [sugerencias]);

  useEffect(() => {
    if (!ocupado && debeRecuperarFoco.current && inputRef.current) {
      const input = inputRef.current;
      input.focus();
      const longitud = input.value.length;
      input.setSelectionRange(longitud, longitud);
      debeRecuperarFoco.current = false;
    }
  }, [ocupado]);

  const enviar = (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || ocupado) {
      return;
    }
    debeRecuperarFoco.current = true;
    historial.current = [...historial.current, limpio];
    indiceHistorial.current = -1;
    setValor('');
    setMostrarSugerencias(false);
    void ejecutar(limpio);
  };

  const elegirSugerencia = (sugerencia: string) => {
    setValor(aplicar(sugerencia));
    setMostrarSugerencias(false);
  };

  const haySugerencias = mostrarSugerencias && sugerencias.length > 0;

  const onKeyDown = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (haySugerencias && (evento.key === 'ArrowDown' || evento.key === 'ArrowUp')) {
      evento.preventDefault();
      setIndiceActivo((actual) => {
        const total = sugerencias.length;
        const delta = evento.key === 'ArrowDown' ? 1 : -1;
        return (actual + delta + total) % total;
      });
      return;
    }

    if (evento.key === 'Tab') {
      if (haySugerencias) {
        evento.preventDefault();
        elegirSugerencia(sugerencias[indiceActivo]);
      }
      return;
    }

    if (evento.key === 'Enter') {
      if (haySugerencias && valor.trim() && sugerencias[indiceActivo]) {
        // Si hay una sugerencia resaltada y el texto aún no la completa, primero
        // completa; si ya coincide, envía.
        const completada = aplicar(sugerencias[indiceActivo]);
        if (completada !== valor) {
          evento.preventDefault();
          setValor(completada);
          setMostrarSugerencias(false);
          return;
        }
      }
      enviar(valor);
      return;
    }

    if (evento.key === 'Escape') {
      setMostrarSugerencias(false);
      return;
    }

    // Navegación del histórico de comandos cuando NO hay sugerencias visibles.
    if (!haySugerencias && (evento.key === 'ArrowUp' || evento.key === 'ArrowDown')) {
      const hist = historial.current;
      if (hist.length === 0) {
        return;
      }
      evento.preventDefault();
      if (evento.key === 'ArrowUp') {
        const nuevoIndice =
          indiceHistorial.current === -1
            ? hist.length - 1
            : Math.max(0, indiceHistorial.current - 1);
        indiceHistorial.current = nuevoIndice;
        setValor(hist[nuevoIndice]);
      } else {
        if (indiceHistorial.current === -1) {
          return;
        }
        const nuevoIndice = indiceHistorial.current + 1;
        if (nuevoIndice >= hist.length) {
          indiceHistorial.current = -1;
          setValor('');
        } else {
          indiceHistorial.current = nuevoIndice;
          setValor(hist[nuevoIndice]);
        }
      }
    }
  };

  return (
    <div className="consola">
      <div className="consola__log" ref={logRef}>
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`consola__linea consola__linea--${mensaje.tipo}`}
          >
            {mensaje.texto}
          </div>
        ))}
      </div>

      <div className="consola__entrada">
        {haySugerencias ? (
          <Autocomplete
            sugerencias={sugerencias}
            indiceActivo={indiceActivo}
            onElegir={elegirSugerencia}
          />
        ) : null}
        <span className="consola__prompt">&gt;</span>
        <input
          ref={inputRef}
          className="consola__input"
          value={valor}
          placeholder="Escribe un comando…"
          spellCheck={false}
          autoComplete="off"
          disabled={ocupado}
          onChange={(evento) => {
            setValor(evento.target.value);
            setMostrarSugerencias(true);
            indiceHistorial.current = -1;
          }}
          onFocus={() => setMostrarSugerencias(true)}
          onBlur={() => setMostrarSugerencias(false)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}

export default Consola;
