import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Ruler, ArrowRight } from 'lucide-react';
import { Product, ProductColor } from '../../types';
import { formatPrice } from '../../utils';
import { buildProductSlides } from '../../utils/productSlides';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { ImageStack } from '../common/ImageStack';
import { QuantitySelector } from '../common/QuantitySelector';

interface QuickViewProps {
  product: Product;
  lineName?: string;
  /** Color con el que abre (por ejemplo, el que se filtró en el catálogo). */
  initialColorId?: string;
  onClose: () => void;
  /** Si es true, al agregar se abre el carrito. En el catálogo queda la barra de pedido abajo. */
  openCartAfterAdd?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80';

/**
 * Vista rápida: elegir color y cantidad sin salir del catálogo.
 * Panel lateral en computadora y hoja que sube desde abajo en el celular.
 */
export const QuickView: React.FC<QuickViewProps> = ({ product, lineName, initialColorId, onClose, openCartAfterAdd = true }) => {
  const { addToCart, openCartDrawer } = useCart();
  const { showToast } = useToast();
  const colors = product.colors ?? [];
  const [color, setColor] = useState<ProductColor | null>(
    () => colors.find((c) => c.id === initialColorId) ?? colors[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);

  const slides = useMemo(() => {
    const s = buildProductSlides(product);
    return s.length > 0 ? s : [{ src: FALLBACK_IMAGE }];
  }, [product]);
  const colorSlide = color ? slides.findIndex((s) => s.color?.id === color.id) : -1;
  const imageIndex = colorSlide >= 0 ? colorSlide : 0;

  // onClose puede cambiar en cada render del padre: se guarda en una ref para montar esto una sola vez
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  const handleAdd = () => {
    addToCart(product, quantity, color?.name);
    showToast(`Agregaste ${quantity} × "${product.name}"${color ? ` en ${color.name}` : ''} al pedido.`);
    onClose();
    if (openCartAfterAdd) openCartDrawer();
  };

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Vista rápida: ${product.name}`}>
      <div className="absolute inset-0 bg-[#121612]/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />

      <div
        className="absolute inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl sm:rounded-none sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] bg-[#FAF8F5] shadow-2xl flex flex-col overflow-y-auto animate-quickview"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-[#D9D2C5] mx-auto mt-2.5" aria-hidden="true" />

        <div className="flex items-center justify-between px-5 pt-3 sm:pt-5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#7D8B7A]">{lineName || 'Vista rápida'}</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-[#4A5748] hover:bg-[#EDE7DC] cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="flex sm:block gap-4">
            <div className="relative w-28 sm:w-full shrink-0 aspect-square rounded-2xl overflow-hidden bg-[#F1ECE3]">
              <ImageStack
                images={slides.map((s) => s.src)}
                activeIndex={imageIndex}
                alt={`${product.name}${color ? ` - ${color.name}` : ''}`}
                fadeMs={500}
              />
            </div>
            <div className="sm:mt-4 space-y-1 min-w-0">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#222A21] leading-tight">{product.name}</h2>
              <p className="text-lg font-bold text-[#2D3A2F] tabular-nums">{formatPrice(product.price)}</p>
              {product.dimensions && (
                <p className="inline-flex items-center gap-1.5 text-xs text-[#5A6757]">
                  <Ruler className="w-3.5 h-3.5 text-[#7D8B7A]" /> {product.dimensions}
                </p>
              )}
            </div>
          </div>

          {colors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[#5A6757]">
                Color: <span className="font-semibold text-[#222A21]">{color?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
                {colors.map((c) => {
                  const active = color?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={c.name}
                      title={c.name}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3A2F] focus-visible:ring-offset-2 ${
                        active ? 'ring-2 ring-[#2D3A2F] ring-offset-2 ring-offset-[#FAF8F5] scale-105' : 'ring-1 ring-black/15 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity((q) => Math.min(99, q + 1))}
              onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D3A2F] text-[#FAF8F5] text-sm font-semibold hover:bg-[#3E4E40] active:scale-[.98] transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> Agregar al pedido
            </button>
          </div>

          <Link
            to={`/producto/${product.id}`}
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#2D3A2F] hover:underline"
          >
            Ver ficha completa <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
};
