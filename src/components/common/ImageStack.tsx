import React from 'react';

interface ImageStackProps {
  /** Todas las fotos que se pueden mostrar. Se apilan y solo la activa es visible. */
  images: string[];
  /** Índice de la foto visible. */
  activeIndex: number;
  alt: string;
  className?: string;
  /** Zoom lento sobre la foto visible (efecto "Ken Burns"), para la portada. */
  kenBurns?: boolean;
  /** Duración del fundido en ms. */
  fadeMs?: number;
  /** Marca la primera foto como prioritaria (portada, foto principal del detalle). */
  eager?: boolean;
}

/**
 * Fotos apiladas con fundido cruzado entre una y otra.
 * Se usa en la portada, en las tarjetas del catálogo y en el detalle del producto.
 */
export const ImageStack: React.FC<ImageStackProps> = ({
  images,
  activeIndex,
  alt,
  className = '',
  kenBurns = false,
  fadeMs = 700,
  eager = false,
}) => {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {images.map((src, idx) => {
        const isActive = idx === activeIndex;
        return (
          <img
            key={src}
            src={src}
            alt={isActive ? alt : ''}
            aria-hidden={!isActive}
            loading={eager && idx === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            style={{ transitionDuration: `${fadeMs}ms` }}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity ease-in-out ${
              isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
            } ${kenBurns && isActive ? 'animate-ken-burns' : ''}`}
          />
        );
      })}
    </div>
  );
};
