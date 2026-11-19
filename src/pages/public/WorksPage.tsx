import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { ClientWork } from '../../types';
import { workService, workTitle } from '../../services/workService';
import { usePrefersReducedMotion } from '../../hooks/useSlideshow';
import { posicionFoco } from '../../utils/encuadre';

const CACHE_KEY = 'terra_cached_works';

const getCached = (): ClientWork[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

// Tamaños del mosaico: se repiten en este orden para que la grilla quede armada
const TILE_CLASSES = [
  'row-span-2',
  'sm:col-span-2 row-span-2',
  '',
  'row-span-2',
  '',
  'sm:col-span-2',
  'row-span-2',
  '',
];

interface Opened {
  work: ClientWork;
  image: number;
  from: HTMLElement;
}

const OPEN_EASE = 'cubic-bezier(.2,.8,.2,1)';

export const WorksPage: React.FC = () => {
  const [works, setWorks] = useState<ClientWork[]>(getCached);
  const [loading, setLoading] = useState(() => getCached().length === 0);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [closing, setClosing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    workService.getAll().then((list) => {
      setWorks(list);
      setLoading(false);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      } catch {}
    });
  }, []);

  /** Transformación que lleva la tarjeta ampliada al lugar y tamaño de la foto del mosaico. */
  const tileTransform = (from: HTMLElement) => {
    const card = cardRef.current!.getBoundingClientRect();
    const photo = photoRef.current!.getBoundingClientRect();
    const tile = from.getBoundingClientRect();
    return `translate(${tile.left - card.left}px, ${tile.top - card.top}px) scale(${tile.width / card.width}, ${tile.height / photo.height})`;
  };

  // Al abrir: la foto crece desde su lugar en el mosaico
  useLayoutEffect(() => {
    if (!opened || closing || !cardRef.current || !photoRef.current) return;
    closeBtnRef.current?.focus({ preventScroll: true });
    if (reducedMotion || typeof cardRef.current.animate !== 'function') return;
    opened.from.style.visibility = 'hidden';
    cardRef.current.animate([{ transform: tileTransform(opened.from), borderRadius: '12px' }, { transform: 'none', borderRadius: '24px' }], {
      duration: 700,
      easing: OPEN_EASE,
    });
    textRef.current?.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], {
      duration: 450,
      delay: 420,
      easing: 'ease-out',
      fill: 'backwards',
    });
    // Solo al abrir un trabajo distinto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened?.work.id]);

  const close = useCallback(() => {
    if (!opened || closing) return;
    const finish = () => {
      opened.from.style.visibility = '';
      opened.from.focus({ preventScroll: true });
      setOpened(null);
      setClosing(false);
    };
    if (reducedMotion || !cardRef.current || typeof cardRef.current.animate !== 'function') {
      finish();
      return;
    }
    setClosing(true);
    textRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
    cardRef.current.animate([{ transform: 'none', borderRadius: '24px' }, { transform: tileTransform(opened.from), borderRadius: '12px' }], {
      duration: 520,
      easing: 'cubic-bezier(.4,0,.2,1)',
      fill: 'forwards',
    }).onfinish = finish;
  }, [opened, closing, reducedMotion]);

  const showImage = useCallback(
    (delta: number) => {
      setOpened((o) => (o ? { ...o, image: (o.image + delta + o.work.images.length) % o.work.images.length } : o));
    },
    []
  );

  // Teclado y bloqueo del scroll de fondo mientras está abierta
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') showImage(1);
      if (e.key === 'ArrowLeft') showImage(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [opened, close, showImage]);

  const current = opened ? workTitle(opened.work) : null;

  return (
    <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-10 sm:py-14 space-y-10">
      <div className="border-b border-[#E8E2D6] pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F] block mb-2">Portafolio</span>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#222A21] mb-3">Trabajos realizados</h1>
          <p className="text-sm sm:text-base text-[#657363] max-w-2xl">
            Proyectos realizados para casas, negocios y oficinas. Tocá una foto para verla en detalle.
          </p>
        </div>
        <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D3A2F] hover:text-[#4A5D4E] shrink-0">
          Ver el catálogo <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[140px] sm:auto-rows-[180px] gap-3 sm:gap-4">
          {TILE_CLASSES.map((c, i) => (
            <div key={i} className={`animate-pulse bg-[#EBE5DA] rounded-xl ${c}`} />
          ))}
        </div>
      ) : works.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#EAE4D7] flex items-center justify-center mx-auto text-[#4A5D4E]">
            <Camera className="w-8 h-8 opacity-60" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-[#222A21]">Pronto vas a ver acá nuestros trabajos</h2>
          <p className="text-xs text-[#6F7B6D] leading-relaxed">Mientras tanto, mirá todas las piezas disponibles en el catálogo.</p>
        </div>
      ) : (
        <div className="group/mosaic grid grid-cols-2 sm:grid-cols-4 auto-rows-[140px] sm:auto-rows-[180px] gap-3 sm:gap-4 grid-flow-dense">
          {works.map((w, i) => {
            const t = workTitle(w);
            return (
              <button
                key={w.id}
                type="button"
                onClick={(e) => setOpened({ work: w, image: 0, from: e.currentTarget })}
                className={`group relative overflow-hidden rounded-xl bg-[#EBE5DA] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3A2F] focus-visible:ring-offset-2 transition-[filter] duration-500 group-hover/mosaic:[&:not(:hover)]:brightness-[.85] ${TILE_CLASSES[i % TILE_CLASSES.length]}`}
                aria-label={`Ver trabajo: ${t.title}`}
              >
                <img
                  src={w.images[0]}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={posicionFoco(w.images[0])}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.08] group-focus-visible:scale-[1.08]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#1A221B]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-500" />
                <span className="absolute left-3 right-3 bottom-3 text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 transition-all duration-500">
                  <span className="block text-[9px] uppercase tracking-widest opacity-80">{t.eyebrow}</span>
                  <span className="block font-serif text-base sm:text-lg font-semibold leading-tight">{t.title}</span>
                </span>
                {w.images.length > 1 && (
                  <span className="absolute top-2.5 right-2.5 bg-black/55 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Camera className="w-3 h-3" /> {w.images.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Foto ampliada */}
      {opened && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={current.title}>
          <div
            className={`absolute inset-0 bg-[#121612]/85 backdrop-blur-sm transition-opacity duration-500 ${closing ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}
            onClick={close}
          />
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-[2] p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div ref={cardRef} className="relative z-[1] w-full max-w-4xl bg-[#FAF8F5] rounded-3xl overflow-hidden shadow-2xl origin-top-left">
            <div ref={photoRef} className="relative aspect-4/3 sm:aspect-16/10 bg-[#1A221B]">
              {opened.work.images.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={i === opened.image ? current.title : ''}
                  style={posicionFoco(src)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === opened.image ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              {opened.work.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => showImage(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 text-[#2D3A2F] shadow-md hover:bg-white cursor-pointer"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showImage(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 text-[#2D3A2F] shadow-md hover:bg-white cursor-pointer"
                    aria-label="Foto siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                    {opened.work.images.map((_, i) => (
                      <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === opened.image ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div ref={textRef} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#7D8B7A]">{current.eyebrow}</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#222A21] leading-tight">{current.title}</h2>
                {opened.work.city && opened.work.clientName && (
                  <p className="text-xs text-[#6F7B6D] inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {opened.work.city}
                  </p>
                )}
                {opened.work.description && <p className="text-sm text-[#4A5748] leading-relaxed max-w-xl">{opened.work.description}</p>}
              </div>
              {opened.work.productId && opened.work.productName && (
                <Link
                  to={`/producto/${opened.work.productId}`}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-[#2D3A2F] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#3E4E40]"
                >
                  {opened.work.productName} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
