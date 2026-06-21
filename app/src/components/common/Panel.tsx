import React from 'react';

interface PanelProps {
  titulo?: string;
  className?: string;
  children: React.ReactNode;
}

/** Marco con borde sutil tipo pergamino, con título opcional. */
function Panel({ titulo, className, children }: PanelProps) {
  const clase = `panel${className ? ` ${className}` : ''}`;
  return (
    <section className={clase}>
      {titulo ? <h2 className="panel__titulo">{titulo}</h2> : null}
      {children}
    </section>
  );
}

export default Panel;
