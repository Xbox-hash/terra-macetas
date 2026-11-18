import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ClientWork } from '../../types';
import { workTitle } from '../../services/workService';
import { usePrefersReducedMotion } from '../../hooks/useSlideshow';

/** Efecto con el que entra cada foto. */
export type WorksEffect = 'cortina' | 'circulo' | 'diagonal' | 'tiras';

interface WorksShowcaseProps {
  works: ClientWork[];
  effect?: WorksEffect;
  /** Tiempo que queda cada foto, en ms. */
  intervalMs?: number;
  /** Muestra el botón hacia la pieza usada (en la ficha de la pieza no hace falta). */
  showProduct?: boolean;
  /** Máximo de fotos por trabajo que entran al carrusel. */
  imagesPerWork?: number;
  className?: string;
}

interface Slide {
  src: string;
  work: ClientWork;
}

const EASE = 'cubic-bezier(.77,0,.18,1)';
const STRIPS = 6;

/** Palabras que suben una por una. */
const Words: React.FC<{ text: string; delay: number }> = ({ text, delay }) => (
  <>
    {text.split(' ').map((w, i) => (
      <React.Fragment key={i}>
        <span className="works-word">
          <span style={{ animationDelay: `${delay + i * 60}ms` }}>{w}</span>
        </span>{' '}
      </React.Fragment>
    ))}
  </>
);

const LayerContent: React.FC<{ slide: Slide; effect: WorksEffect; alt: string }> = ({ slide, effect, alt }) => (
  <div className="works-kb absolute inset-0">
    {effect === 'tiras' ? (
      Array.from({ length: STRIPS }, (_, i) => (
        <div
          key={i}
          data-strip
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{ left: `${(i * 100) / STRIPS}%`, width: `${100 / STRIPS + 0.2}%` }}
        >
          <img
            src={slide.src}
            alt={i === 0 ? alt : ''}
            draggable={false}
            className="absolute top-0 h-full max-w-none object-cover"
            style={{ left: `-${i * 100}%`, width: `${STRIPS * 100}%` }}
          />
        </div>
      ))
    ) : (
      <img src={slide.src} alt={alt} draggable={false} className="absolute inset-0 w-full h-full object-cover" />
    )}
  </div>
);

/**
 * Carrusel de trabajos realizados: cada foto entra con un efecto mientras la anterior se aleja,
 * con zoom lento y el texto que sube palabra por palabra.
 */
export const WorksShowcase: React.FC<WorksShowcaseProps> = ({
  works,
  effect = 'cortina',
  intervalMs = 6000,
  showProduct = true,
  imagesPerWork = 2,
  className = '',
}) => {
  const slides = useMemo<Slide[]>(
    () => works.flatMap((work) => work.images.slice(0, imagesPerWork).map((src) => ({ src, work }))),
    [works, imagesPerWork]
  );

  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [layers, setLayers] = useState<{ key: number; idx: number }[]>([{ key: 0, idx: 0 }]);
  const nextKey = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  // Si cambian los trabajos (se cargaron del servidor), arrancar de cero
  useEffect(() => {
    setIndex(0);
    setLayers([{ key: nextKey.current++, idx: 0 }]);
  }, [slides.length]);

  const go = useCallback(
    (next: number) => {
      if (slides.length < 2) return;
      const idx = (next + slides.length) % slides.length;
      setIndex(idx);
      // Como mucho 3 capas apiladas aunque se toque muy rápido
      setLayers((prev) => [...prev.slice(-2), { key: nextKey.current++, idx }]);
    },
    [slides.length]
  );

  // Animación de entrada de la capa nueva y salida de la anterior
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || layers.length < 2) return;
    const nodes = el.querySelectorAll<HTMLElement>('[data-layer]');
    const incoming = nodes[nodes.length - 1];
    const outgoing = nodes[nodes.length - 2];
    if (!incoming || !outgoing || typeof incoming.animate !== 'function') return;

    const newestKey = layers[layers.length - 1].key;
    const cleanup = () => setLayers((prev) => prev.filter((l) => l.key >= newestKey));

    if (reducedMotion) {
      incoming.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600 }).onfinish = cleanup;
      return;
    }

    let last: Animation | undefined;
    if (effect === 'cortina') {
      last = incoming.animate([{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)' }], { duration: 1300, easing: EASE });
      outgoing.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-14%)' }], { duration: 1300, easing: EASE, fill: 'forwards' });
    } else if (effect === 'circulo') {
      const o = { duration: 1500, easing: 'cubic-bezier(.65,0,.35,1)' };
      last = incoming.animate([{ clipPath: 'circle(0% at 65% 60%)' }, { clipPath: 'circle(150% at 65% 60%)' }], o);
      outgoing.animate(
        [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(.88)', filter: 'brightness(.5)' }],
        { ...o, fill: 'forwards' }
      );
    } else if (effect === 'diagonal') {
      last = incoming.animate(
        [{ clipPath: 'polygon(120% 0,100% 0,100% 100%,140% 100%)' }, { clipPath: 'polygon(-40% 0,100% 0,100% 100%,-20% 100%)' }],
        { duration: 1400, easing: EASE }
      );
      outgoing.animate(
        [{ transform: 'translateX(0)', filter: 'brightness(1)' }, { transform: 'translateX(-10%)', filter: 'brightness(.6)' }],
        { duration: 1400, easing: EASE, fill: 'forwards' }
      );
    } else {
      incoming.querySelectorAll<HTMLElement>('[data-strip]').forEach((s, i) => {
        last = s.animate([{ transform: `translateY(${i % 2 ? '-100%' : '100%'})` }, { transform: 'none' }], {
          duration: 950,
          delay: i * 75,
          easing: EASE,
          fill: 'backwards',
        });
      });
      outgoing.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.45)' }], { duration: 1300, fill: 'forwards' });
    }
    if (last) last.onfinish = cleanup;
    else cleanup();
  }, [layers, effect, reducedMotion]);

  // Avance automático (se pausa con el mouse encima, con la pestaña oculta o si piden menos movimiento)
  useEffect(() => {
    if (paused || reducedMotion || slides.length < 2) return;
    const t = window.setTimeout(() => {
      if (!document.hidden) go(index + 1);
    }, intervalMs);
    return () => window.clearTimeout(t);
  }, [index, paused, reducedMotion, slides.length, intervalMs, go]);

  // Precarga la foto siguiente para que la transición no espere la descarga
  useEffect(() => {
    const next = slides[(index + 1) % Math.max(slides.length, 1)];
    if (next) new Image().src = next.src;
  }, [index, slides]);

  if (slides.length === 0) return null;

  const current = slides[index] ?? slides[0];
  const t = workTitle(current.work);
  const alt = `${t.title}${current.work.description ? ` - ${current.work.description}` : ''}`;
  const product = showProduct && current.work.productId && current.work.productName ? current.work : null;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl bg-[#1A221B] isolate select-none ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Trabajos realizados"
    >
      {layers.map((l) => (
        <div key={l.key} data-layer className="absolute inset-0 overflow-hidden will-change-transform">
          <LayerContent slide={slides[l.idx] ?? slides[0]} effect={effect} alt={l.idx === index ? alt : ''} />
        </div>
      ))}

      {/* Contador y progreso */}
      <div className="absolute inset-x-0 top-0 z-[3] p-4 sm:p-6 flex items-center justify-between pointer-events-none">
        <span className="font-serif text-white text-xl sm:text-2xl font-semibold flex items-baseline gap-1.5">
          <span className="works-word">
            <span key={index}>{String(index + 1).padStart(2, '0')}</span>
          </span>
          <span className="font-sans text-[10px] sm:text-xs opacity-70">/ {String(slides.length).padStart(2, '0')}</span>
        </span>
        {slides.length > 1 && (
          <div className="flex gap-1" aria-hidden="true">
            {slides.map((_, i) => (
              <span key={i} className="relative h-0.5 w-4 sm:w-6 rounded-full bg-white/35 overflow-hidden">
                {i < index && <span className="absolute inset-0 bg-white" />}
                {i === index && (
                  <span
                    key={`run-${index}-${paused}`}
                    className="works-bar absolute inset-0 bg-white"
                    style={{ animationDuration: `${intervalMs}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                  />
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Texto del trabajo: se vuelve a montar con cada foto para repetir la animación */}
      <div
        key={index}
        className="absolute inset-x-0 bottom-0 z-[2] px-5 sm:px-8 pb-5 sm:pb-7 pt-24 bg-gradient-to-t from-[#1A221B]/90 via-[#1A221B]/40 to-transparent text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3"
        aria-live="polite"
      >
        <div className="max-w-xl">
          <span className="works-fade block text-[10px] sm:text-xs font-medium uppercase tracking-widest opacity-80 mb-1" style={{ animationDelay: '150ms' }}>
            {t.eyebrow}
          </span>
          <h3 className="font-serif text-2xl sm:text-4xl font-semibold leading-tight">
            <Words text={t.title} delay={250} />
          </h3>
          {current.work.description && (
            <p
              className="works-fade text-xs sm:text-sm opacity-90 mt-2 leading-relaxed line-clamp-2"
              style={{ animationDelay: `${480 + t.title.split(' ').length * 60}ms` }}
            >
              {current.work.description}
            </p>
          )}
        </div>
        {product && (
          <Link
            to={`/producto/${product.productId}`}
            className="works-chip shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 bg-white/95 text-[#222A21] text-xs font-semibold px-3.5 py-2 rounded-full hover:bg-white"
            style={{ animationDelay: '750ms' }}
          >
            {product.productName} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-[3] p-2 rounded-full bg-white/80 text-[#2D3A2F] shadow-md hover:bg-white hidden sm:inline-flex cursor-pointer"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-[3] p-2 rounded-full bg-white/80 text-[#2D3A2F] shadow-md hover:bg-white hidden sm:inline-flex cursor-pointer"
            aria-label="Foto siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};
