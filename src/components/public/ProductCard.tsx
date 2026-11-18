import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Ruler } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../utils';
import { buildProductSlides } from '../../utils/productSlides';
import { ImageStack } from '../common/ImageStack';
import { useSlideshow } from '../../hooks/useSlideshow';
import { QuickView } from './QuickView';

interface ProductCardProps {
  product: Product;
  lineName?: string;
  /** Tarjeta grande (la destacada del catálogo, ocupa 2×2). */
  large?: boolean;
  /** Color a mostrar primero (por ejemplo, el filtrado en el catálogo). */
  preferredColorId?: string;
  /** En el catálogo hay barra de pedido, así que al agregar no hace falta abrir el carrito. */
  openCartAfterAdd?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80';
const MAX_SWATCHES = 5;

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lineName,
  large = false,
  preferredColorId,
  openCartAfterAdd = true,
}) => {
  const [quickOpen, setQuickOpen] = useState(false);

  const slides = useMemo(() => {
    const s = buildProductSlides(product);
    return s.length > 0 ? s : [{ src: FALLBACK_IMAGE }];
  }, [product]);

  const restIndex = useMemo(() => {
    if (!preferredColorId) return 0;
    const i = slides.findIndex((s) => s.color?.id === preferredColorId);
    return i >= 0 ? i : 0;
  }, [slides, preferredColorId]);

  // Las fotos pasan solo con el mouse encima: el catálogo queda quieto y se ve cada pieza
  const [hovered, setHovered] = useState(false);
  const [index, setIndex] = useSlideshow({
    count: slides.length,
    intervalMs: 1500,
    playing: hovered,
    initialDelayMs: 400,
  });

  useEffect(() => {
    if (!hovered) setIndex(restIndex);
  }, [restIndex, hovered, setIndex]);

  const colors = product.colors ?? [];
  const activeSlide = slides[index] ?? slides[0];

  const showColor = (colorId: string) => {
    const i = slides.findIndex((s) => s.color?.id === colorId);
    if (i >= 0) setIndex(i);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex flex-col gap-3 ${large ? 'h-full' : ''}`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-[#F1ECE3] ${large ? 'aspect-4/5 sm:aspect-auto sm:flex-1 sm:min-h-[420px]' : 'aspect-4/5'}`}
      >
        <Link to={`/producto/${product.id}`} className="absolute inset-0 block" aria-label={product.name}>
          <ImageStack
            images={slides.map((s) => s.src)}
            activeIndex={index}
            alt={`${product.name}${activeSlide.color ? ` - ${activeSlide.color.name}` : ''}`}
            className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
            fadeMs={600}
            eager={large}
          />
        </Link>

        {product.featured && (
          <span className="absolute top-3 left-3 z-10 bg-[#2D3A2F]/90 backdrop-blur-xs text-[#FAF8F5] text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full pointer-events-none">
            Destacado
          </span>
        )}

        {activeSlide.color && hovered && (
          <span
            key={activeSlide.color.id}
            className="absolute bottom-3 left-3 z-10 bg-[#1E261F]/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-fade-in pointer-events-none"
          >
            <span className="w-2.5 h-2.5 rounded-full border border-white/60" style={{ backgroundColor: activeSlide.color.hex }} />
            {activeSlide.color.name}
          </span>
        )}

        {/* Vista rápida: elegir color y cantidad sin salir */}
        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-[#FAF8F5]/95 text-[#2D3A2F] shadow-md inline-flex items-center justify-center hover:bg-[#2D3A2F] hover:text-[#FAF8F5] active:scale-95 transition-all duration-200 cursor-pointer sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3A2F]"
          aria-label={`Agregar ${product.name} al pedido`}
          title="Agregar al pedido"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        {lineName && (
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-[#7D8B7A] line-clamp-1">{lineName}</span>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <Link to={`/producto/${product.id}`} className="min-w-0">
            <h3
              className={`font-serif font-semibold text-[#2D3A2F] group-hover:text-[#4A5D4E] transition-colors line-clamp-2 leading-tight ${
                large ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
              }`}
            >
              {product.name}
            </h3>
          </Link>
          <span className="hidden sm:inline text-sm font-bold text-[#2D3A2F] tabular-nums shrink-0">{formatPrice(product.price)}</span>
        </div>
        <span className="sm:hidden text-sm font-bold text-[#2D3A2F] tabular-nums">{formatPrice(product.price)}</span>

        <div className="flex items-center justify-between gap-2 min-h-5">
          {product.dimensions ? (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#5A6757] min-w-0">
              <Ruler className="w-3.5 h-3.5 text-[#7D8B7A] shrink-0" />
              <span className="line-clamp-1">{product.dimensions}</span>
            </span>
          ) : (
            <span />
          )}
          {colors.length > 1 && (
            <span className="flex items-center gap-1 shrink-0" role="group" aria-label="Colores disponibles">
              {colors.slice(0, MAX_SWATCHES).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  aria-label={`Ver en ${c.name}`}
                  onMouseEnter={() => showColor(c.id)}
                  onClick={() => showColor(c.id)}
                  className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-125 ${
                    activeSlide.color?.id === c.id ? 'ring-2 ring-[#2D3A2F] ring-offset-1 ring-offset-[#FAF8F5]' : 'ring-1 ring-black/15'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {colors.length > MAX_SWATCHES && (
                <span className="text-[10px] font-semibold text-[#7D8B7A]">+{colors.length - MAX_SWATCHES}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {quickOpen && (
        <QuickView
          product={product}
          lineName={lineName}
          initialColorId={preferredColorId}
          openCartAfterAdd={openCartAfterAdd}
          onClose={() => setQuickOpen(false)}
        />
      )}
    </div>
  );
};
