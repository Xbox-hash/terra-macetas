import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Product } from '../../types';
import { posicionFoco } from '../../utils/encuadre';

interface SelectorPiezaProps {
  id?: string;
  products: Product[];
  /** ID de la pieza elegida, o vacío/null si ninguna. */
  value?: string | null;
  onChange: (productId: string) => void;
}

const SIN_LINEA = 'Sin línea';

/** Normaliza para buscar sin importar tildes ni mayúsculas. */
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const Miniatura: React.FC<{ src?: string }> = ({ src }) =>
  src ? (
    <img src={src} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#F0ECE4] shrink-0" style={posicionFoco(src)} loading="lazy" />
  ) : (
    <span className="w-10 h-10 rounded-lg bg-[#F0ECE4] shrink-0" />
  );

/**
 * Selector de la pieza usada en un trabajo. Muestra foto, línea y medida, y permite buscar,
 * porque hay muchas piezas con el mismo nombre en distintas líneas (ej. "Vaso Botija").
 */
export const SelectorPieza: React.FC<SelectorPiezaProps> = ({ id, products, value, onChange }) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const contenedorRef = useRef<HTMLDivElement>(null);
  const buscadorRef = useRef<HTMLInputElement>(null);
  const elegido = products.find((p) => p.id === value);

  // Agrupadas por línea; dentro de cada línea, por nombre y medida
  const grupos = useMemo(() => {
    const q = normalizar(busqueda.trim());
    const filtrados = products.filter((p) => {
      if (!q) return true;
      return normalizar(`${p.name} ${p.lineName ?? ''} ${p.dimensions ?? ''}`).includes(q);
    });
    const porLinea = new Map<string, Product[]>();
    for (const p of filtrados) {
      const linea = p.lineName?.trim() || SIN_LINEA;
      porLinea.set(linea, [...(porLinea.get(linea) ?? []), p]);
    }
    return [...porLinea.entries()]
      .sort(([a], [b]) => (a === SIN_LINEA ? 1 : b === SIN_LINEA ? -1 : a.localeCompare(b)))
      .map(([linea, items]) => ({
        linea,
        items: items.sort((a, b) => a.name.localeCompare(b.name) || (a.dimensions ?? '').localeCompare(b.dimensions ?? '')),
      }));
  }, [products, busqueda]);
  const totalVisibles = grupos.reduce((n, g) => n + g.items.length, 0);

  useEffect(() => {
    if (!abierto) return;
    buscadorRef.current?.focus();
    const fuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const elegir = (productId: string) => {
    onChange(productId);
    setAbierto(false);
    setBusqueda('');
  };

  return (
    <div ref={contenedorRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="w-full flex items-center gap-3 px-3 py-2 bg-white border border-[#D9D3C7] rounded-xl text-left text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3A2F] cursor-pointer"
      >
        {elegido ? (
          <>
            <Miniatura src={elegido.images?.[0]} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[#222A21] truncate">
                {elegido.name}
                {!elegido.active && <span className="ml-1 text-xs font-normal text-[#9A5B14]">(pausado)</span>}
              </span>
              <span className="block text-xs text-[#6E7B6C] truncate">
                {elegido.lineName || SIN_LINEA}
                {elegido.dimensions ? ` · ${elegido.dimensions}` : ''}
              </span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-[#7E8B7D] py-2">Ninguna</span>
        )}
        <ChevronDown className={`w-4 h-4 text-[#6E7B6C] shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[300px] bg-white border border-[#E5DFD4] rounded-xl shadow-[0_20px_40px_-12px_rgba(34,42,33,.3)] overflow-hidden">
          <div className="p-2 border-b border-[#EFE9DE] relative">
            <Search className="w-4 h-4 text-[#7A8878] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={buscadorRef}
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (totalVisibles === 1) elegir(grupos[0].items[0].id);
                }
              }}
              placeholder="Buscar por nombre, línea o medida"
              aria-label="Buscar pieza"
              className="w-full pl-8 pr-3 py-2 bg-[#FAF8F5] border border-[#E5DFD4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
            />
          </div>
          <ul role="listbox" className="max-h-[340px] overflow-y-auto py-1">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => elegir('')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#F3EFE7] cursor-pointer ${!value ? 'font-semibold' : 'text-[#5A6757]'}`}
              >
                <X className="w-4 h-4" /> Ninguna
              </button>
            </li>
            {grupos.map((g) => (
              <li key={g.linea}>
                <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#5E725F] sticky top-0 bg-white">
                  {g.linea} <span className="font-normal text-[#9AA597]">· {g.items.length}</span>
                </div>
                <ul>
                  {g.items.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={p.id === value}
                        onClick={() => elegir(p.id)}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 text-left hover:bg-[#F3EFE7] cursor-pointer ${p.id === value ? 'bg-[#EDE7DC]' : ''}`}
                      >
                        <Miniatura src={p.images?.[0]} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#222A21] truncate">
                            {p.name}
                            {!p.active && <span className="ml-1 text-xs font-normal text-[#9A5B14]">(pausado)</span>}
                          </span>
                          <span className="block text-xs text-[#6E7B6C] truncate">{p.dimensions || 'Sin medida'}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {totalVisibles === 0 && <li className="px-3 py-6 text-center text-sm text-[#7E8B7D]">No hay piezas que coincidan.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};
