import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface LineTab {
  id: string;
  name: string;
  count: number;
}

interface LineTabsProps {
  lines: LineTab[];
  totalCount: number;
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * "Línea Sea Stone - Piezas Orgánicas" → { title: "Sea Stone", subtitle: "Piezas Orgánicas" }.
 * Así el nombre propio de la línea se lee primero y grande.
 */
export function splitLineName(name: string): { title: string; subtitle?: string } {
  const withoutPrefix = name.replace(/^\s*l[ií]nea\s+/i, '').trim();
  const [title, ...rest] = withoutPrefix.split(/\s+[-–—]\s+/);
  return { title: title || name, subtitle: rest.join(' - ') || undefined };
}

/**
 * Selector de líneas del catálogo: botones grandes con el nombre de la línea y la cantidad de piezas.
 * El fondo de la línea elegida se desliza de una a otra.
 */
export const LineTabs: React.FC<LineTabsProps> = ({ lines, totalCount, selectedId, onSelect }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<{ left: number; width: number; height: number; top: number } | null>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const tabs = [{ id: 'todas', name: 'Todas las líneas', count: totalCount }, ...lines];

  const measure = useCallback(() => {
    const btn = buttonRefs.current.get(selectedId) ?? buttonRefs.current.get('todas');
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth, height: btn.offsetHeight, top: btn.offsetTop });
    const el = scrollerRef.current;
    if (el) setCanScroll({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, [selectedId]);

  // Mover el fondo a la línea elegida y dejarla a la vista (sin mover la página hacia arriba o abajo)
  useLayoutEffect(() => {
    measure();
    const el = scrollerRef.current;
    const btn = buttonRefs.current.get(selectedId);
    if (el && btn) {
      const target = btn.offsetLeft - (el.clientWidth - btn.offsetWidth) / 2;
      el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
  }, [selectedId, lines.length, measure]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setCanScroll({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    // Las fuentes pueden terminar de cargar después y cambiar los anchos
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  return (
    <div className="relative -mx-4 sm:mx-0">
      {canScroll.left && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className="hidden sm:grid absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 place-items-center rounded-full bg-white shadow-md border border-[#E5DFD4] text-[#2D3A2F] hover:bg-[#FAF8F5] cursor-pointer"
          aria-label="Ver líneas anteriores"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {canScroll.right && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          className="hidden sm:grid absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 place-items-center rounded-full bg-white shadow-md border border-[#E5DFD4] text-[#2D3A2F] hover:bg-[#FAF8F5] cursor-pointer"
          aria-label="Ver más líneas"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
        className="relative flex gap-2 overflow-x-auto scrollbar-none px-4 sm:px-0 py-1 scroll-smooth"
        style={{
          maskImage: `linear-gradient(90deg, ${canScroll.left ? 'transparent, #000 48px' : '#000, #000'}, #000 calc(100% - 48px), ${canScroll.right ? 'transparent' : '#000'})`,
          WebkitMaskImage: `linear-gradient(90deg, ${canScroll.left ? 'transparent, #000 48px' : '#000, #000'}, #000 calc(100% - 48px), ${canScroll.right ? 'transparent' : '#000'})`,
        }}
        role="tablist"
        aria-label="Líneas"
      >
        {/* Fondo que se desliza hasta la línea elegida */}
        {indicator && (
          <span
            aria-hidden="true"
            className="absolute rounded-2xl bg-[#2D3A2F] shadow-[0_8px_20px_-8px_rgba(45,58,47,.55)] transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
            style={{ left: indicator.left, width: indicator.width, height: indicator.height, top: indicator.top }}
          />
        )}

        {tabs.map((t) => {
          const active = t.id === selectedId;
          const { title, subtitle } = t.id === 'todas' ? { title: 'Todas', subtitle: 'las líneas' } : splitLineName(t.name);
          return (
            <button
              key={t.id}
              ref={(el) => {
                if (el) buttonRefs.current.set(t.id, el);
                else buttonRefs.current.delete(t.id);
              }}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(t.id)}
              title={t.name}
              className={`relative z-10 shrink-0 text-left rounded-2xl px-4 py-2.5 border transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3A2F] focus-visible:ring-offset-2 ${
                active ? 'border-transparent text-white' : 'border-[#E2DBD0] bg-white/70 text-[#222A21] hover:border-[#2D3A2F]/40 hover:bg-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-semibold leading-none whitespace-nowrap">{title}</span>
                <span
                  className={`text-[10px] font-bold tabular-nums rounded-full px-1.5 py-0.5 transition-colors duration-300 ${
                    active ? 'bg-white/20 text-white' : 'bg-[#EDE7DC] text-[#4A5748]'
                  }`}
                >
                  {t.count}
                </span>
              </span>
              {subtitle && (
                <span
                  className={`block mt-1 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap transition-colors duration-300 ${
                    active ? 'text-[#C4D1B8]' : 'text-[#7D8B7A]'
                  }`}
                >
                  {subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
