import { useTheme } from '../../context/ThemeContext';

/** Conmuta entre tema claro y oscuro (sol/luna). Persiste en localStorage. */
function ToggleTema() {
  const { tema, alternarTema } = useTheme();
  const esOscuro = tema === 'oscuro';
  return (
    <button
      type="button"
      className="toggle-tema"
      onClick={alternarTema}
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={esOscuro ? 'Tema claro' : 'Tema oscuro'}
    >
      {esOscuro ? '☀' : '☾'}
    </button>
  );
}

export default ToggleTema;
