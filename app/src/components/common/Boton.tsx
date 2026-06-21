import React from 'react';

type Variante = 'normal' | 'primario' | 'peligro' | 'chip';

interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const CLASE_POR_VARIANTE: Record<Variante, string> = {
  normal: 'boton',
  primario: 'boton boton--primario',
  peligro: 'boton boton--peligro',
  chip: 'boton boton--chip'
};

/** Botón estilizado medieval. Reenvía el resto de props nativas del <button>. */
function Boton({ variante = 'normal', className, children, ...resto }: BotonProps) {
  const clase = `${CLASE_POR_VARIANTE[variante]}${className ? ` ${className}` : ''}`;
  return (
    <button type="button" className={clase} {...resto}>
      {children}
    </button>
  );
}

export default Boton;
