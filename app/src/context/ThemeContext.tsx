import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

export type Tema = 'oscuro' | 'claro';

interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
}

const ALMACEN_KEY = 'noderpg-tema';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Lee el tema persistido; default 'oscuro' (menos cansador para la vista). */
function leerTemaInicial(): Tema {
  const guardado = localStorage.getItem(ALMACEN_KEY);
  return guardado === 'claro' ? 'claro' : 'oscuro';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(leerTemaInicial);

  // Aplica el tema al <html> (data-theme) y lo persiste cuando cambia.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem(ALMACEN_KEY, tema);
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));
  }, []);

  const valor = useMemo<ThemeContextValue>(
    () => ({ tema, alternarTema }),
    [tema, alternarTema]
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  }
  return ctx;
}
