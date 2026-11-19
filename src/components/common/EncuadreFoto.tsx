import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, X } from 'lucide-react';
import { conFoco, Foco, FOCO_CENTRO, leerFoco, sinFoco } from '../../utils/encuadre';

interface EncuadreFotoProps {
  src: string;
  onCancel: () => void;
  /** Devuelve la URL con el encuadre elegido. */
  onSave: (nuevaSrc: string) => void;
}

/** Formatos en los que se recorta la foto en la tienda. */
const VISTAS = [
  { etiqueta: 'Carrusel en la computadora', aspecto: '2 / 1' },
  { etiqueta: 'Tarjeta del catálogo', aspecto: '4 / 5' },
  { etiqueta: 'Mosaico y miniaturas', aspecto: '1 / 1' },
];

/**
 * Elegir qué parte de la foto queda a la vista cuando se recorta.
 * Se toca o arrastra sobre la maceta; las vistas previas muestran cómo queda en cada formato.
 */
export const EncuadreFoto: React.FC<EncuadreFotoProps> = ({ src, onCancel, onSave }) => {
  const [foco, setFoco] = useState<Foco>(() => leerFoco(src) ?? FOCO_CENTRO);
  const areaRef = useRef<HTMLDivElement>(null);
  const arrastrando = useRef(false);
  const url = sinFoco(src);
  const posicion = `${foco.x}% ${foco.y}%`;

  const desdeEvento = (e: React.PointerEvent) => {
    const r = areaRef.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return;
    setFoco({
      x: Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))),
      y: Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))),
    });
  };

  // Teclado: flechas mueven el punto (Shift = más rápido), Enter guarda, Escape cancela
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const paso = e.shiftKey ? 10 : 2;
      const mover = (dx: number, dy: number) => {
        e.preventDefault();
        setFoco((f) => ({ x: Math.min(100, Math.max(0, f.x + dx)), y: Math.min(100, Math.max(0, f.y + dy)) }));
      };
      if (e.key === 'Escape') onCancel();
      else if (e.key === 'ArrowLeft') mover(-paso, 0);
      else if (e.key === 'ArrowRight') mover(paso, 0);
      else if (e.key === 'ArrowUp') mover(0, -paso);
      else if (e.key === 'ArrowDown') mover(0, paso);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Encuadre de la foto">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#EFE9DE]">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#222A21]">Encuadre de la foto</h2>
            <p className="text-xs text-[#6E7B6C] mt-0.5">
              Tocá o arrastrá sobre la maceta. Ese punto queda siempre a la vista cuando la foto se recorta.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="p-2 -mr-2 rounded-full hover:bg-[#F3EFE7] cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 p-5">
          {/* Foto completa: se toca o arrastra para elegir el punto */}
          <div className="flex items-center justify-center bg-[#1F2720] rounded-xl p-2 min-h-[260px]">
            <div
              ref={areaRef}
              className="relative inline-block cursor-crosshair touch-none select-none"
              onPointerDown={(e) => {
                arrastrando.current = true;
                (e.target as Element).setPointerCapture?.(e.pointerId);
                desdeEvento(e);
              }}
              onPointerMove={(e) => arrastrando.current && desdeEvento(e)}
              onPointerUp={() => (arrastrando.current = false)}
              onPointerCancel={() => (arrastrando.current = false)}
            >
              <img src={url} alt="" draggable={false} className="block max-h-[58vh] max-w-full rounded-lg" />
              {/* Punto elegido */}
              <span
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,.45)] grid place-items-center"
                style={{ left: `${foco.x}%`, top: `${foco.y}%` }}
                aria-hidden="true"
              >
                <Crosshair className="w-5 h-5 text-white drop-shadow" />
              </span>
            </div>
          </div>

          {/* Cómo queda en cada formato */}
          <div className="space-y-3">
            {VISTAS.map((v) => (
              <div key={v.etiqueta}>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#5E725F] mb-1">{v.etiqueta}</span>
                <div className="w-full overflow-hidden rounded-lg bg-[#F0ECE4]" style={{ aspectRatio: v.aspecto }}>
                  <img src={url} alt="" className="w-full h-full object-cover" style={{ objectPosition: posicion }} />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-[#7E8B7D]">También podés mover el punto con las flechas del teclado.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-[#EFE9DE]">
          <button
            type="button"
            onClick={() => setFoco(FOCO_CENTRO)}
            className="text-sm font-semibold text-[#2D3A2F] hover:underline cursor-pointer"
          >
            Volver al centro
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="h-10 px-4 rounded-xl border border-[#D9D3C7] text-sm font-semibold hover:bg-[#F3EFE7] cursor-pointer">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(conFoco(url, foco))}
              className="h-10 px-5 rounded-xl bg-[#2D3A2F] text-white text-sm font-semibold hover:bg-[#3E4E40] cursor-pointer"
            >
              Guardar encuadre
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
