import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductLine } from '../../types';
import { ProductSlide, stableOffset } from '../../utils/productSlides';
import { ImageStack } from '../common/ImageStack';
import { useInView, useSlideshow } from '../../hooks/useSlideshow';

interface LineCardProps {
  line: ProductLine;
  productCount?: number;
  /** Fotos de los productos de la línea (una por color). Si hay, la tarjeta las va mostrando. */
  productSlides?: ProductSlide[];
}

const MAX_SLIDES = 6;

export const LineCard: React.FC<LineCardProps> = ({ line, productCount, productSlides = [] }) => {
  // Primero la foto de la línea, después las de sus productos y colores (sin repetidos)
  const slides = useMemo(() => {
    const seen = new Set<string>();
    return [{ src: line.image } as ProductSlide, ...productSlides]
      .filter((s) => !!s.src && !seen.has(s.src) && !!seen.add(s.src))
      .slice(0, MAX_SLIDES);
  }, [line.image, productSlides]);

  // Pasan solas mientras la tarjeta está en pantalla; más rápido con el mouse encima
  const [hovered, setHovered] = useState(false);
  const [cardRef, inView] = useInView<HTMLAnchorElement>(slides.length > 1);
  const [index] = useSlideshow({
    count: slides.length,
    intervalMs: hovered ? 1800 : 3500,
    playing: hovered || inView,
    initialDelayMs: hovered ? 500 : 1500 + stableOffset(line.id, 2000),
  });
  const active = slides[index] ?? slides[0];

  return (
    <Link
      ref={cardRef}
      to={`/catalogo?linea=${line.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative h-96 rounded-2xl overflow-hidden block border border-[#E5DFD4] hover:border-[#3E4E40]/40 card-hover"
    >
      {/* Fotos de la línea con fundido */}
      <ImageStack
        images={slides.map((s) => s.src)}
        activeIndex={index}
        alt={`${line.name}${active?.color ? ` - ${active.color.name}` : ''}`}
        className="transition-transform duration-700 ease-out group-hover:scale-110"
        fadeMs={900}
      />

      {/* Elegant Gradient Overlay with smooth opacity transition */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#1A221B]/95 via-[#1A221B]/45 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

      {/* Color que se está viendo + progreso */}
      {slides.length > 1 && (
        <div className="absolute top-4 inset-x-4 z-[3] flex items-center justify-between gap-2">
          {active?.color ? (
            <span
              key={active.src}
              className="bg-[#1E261F]/75 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-fade-in"
            >
              <span className="w-2.5 h-2.5 rounded-full border border-white/60" style={{ backgroundColor: active.color.hex }} />
              {active.color.name}
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-1">
            {slides.map((s, i) => (
              <span
                key={s.src}
                className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/55'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 z-[3] p-6 sm:p-7 flex flex-col justify-end text-white">
        <div className="transform transition-transform duration-500 ease-out group-hover:-translate-y-2">
          {productCount !== undefined && (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#CAD9C6] block mb-1 transition-colors duration-300 group-hover:text-white">
              {productCount} {productCount === 1 ? 'modelo' : 'modelos'}
            </span>
          )}
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 transition-transform duration-300">
            {line.name}
          </h3>
          <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 leading-relaxed opacity-90 mb-4 max-w-sm transition-opacity duration-300 group-hover:opacity-100">
            {line.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#D4DEC9] group-hover:text-white transition-colors duration-300">
          <span>Explorar colección</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
        </div>
      </div>
    </Link>
  );
};
