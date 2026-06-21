interface AutocompleteProps {
  sugerencias: string[];
  indiceActivo: number;
  onElegir: (sugerencia: string) => void;
}

/** Dropdown de sugerencias del autocompletado de la consola. */
function Autocomplete({ sugerencias, indiceActivo, onElegir }: AutocompleteProps) {
  if (sugerencias.length === 0) {
    return null;
  }
  return (
    <ul className="autocomplete">
      {sugerencias.map((sugerencia, i) => (
        <li
          key={sugerencia}
          className={`autocomplete__item${
            i === indiceActivo ? ' autocomplete__item--activo' : ''
          }`}
          // onMouseDown (no onClick) para que el click no robe el blur del input
          // antes de aplicarse.
          onMouseDown={(evento) => {
            evento.preventDefault();
            onElegir(sugerencia);
          }}
        >
          {sugerencia}
        </li>
      ))}
    </ul>
  );
}

export default Autocomplete;
