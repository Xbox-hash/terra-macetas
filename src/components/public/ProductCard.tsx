import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Ruler } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../utils';
import { buildProductSlides, stableOffset } from '../../utils/productSlides';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { ImageStack } from '../common/ImageStack';
import { useInView, useSlideshow } from '../../hooks/useSlideshow';

interface ProductCardProps {
  product: Product;
  lineName?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80';
const MAX_SWATCHES = 5;

export const ProductCard: React.FC<ProductCardProps> = ({ product, lineName }) => {
  const { addToCart, openCartDrawer } = useCart();
  const { showToast } = useToast();

  const slides = useMemo(() => {
    const s = buildProductSlides(product);
    return s.length > 0 ? s : [{ src: FALLBACK_IMAGE }];
  }, [product]);

  // Las fotos pasan solas mientras la tarjeta está en pantalla (cada tarjeta con su desfase
  // para que no cambien todas juntas) y más rápido con el mouse encima
  const [hovered, setHovered] = useState(false);
  const [cardRef, inView] = useInView<HTMLDivElement>(slides.length > 1);
  const [index, setIndex] = useSlideshow({
    count: slides.length,
    intervalMs: hovered ? 1500 : 3200,
    playing: hovered || inView,
    initialDelayMs: hovered ? 400 : 1200 + stableOffset(product.id, 2000),
  });

  const colorsWithPhoto = (product.colors ?? []).filter((c) => slides.some((s) => s.color?.id === c.id));
  const activeSlide = slides[index] ?? slides[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    showToast(`¡Agregaste "${product.name}" al pedido!`);
    openCartDrawer();
  };

  const showColor = (colorId: string) => {
    const i = slides.findIndex((s) => s.color?.id === colorId);
    if (i >= 0) setIndex(i);
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setIndex(0);
      }}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E9E4DB] hover:border-[#4A5D4E]/30 card-hover"
    >
      {/* Fotos con fundido entre la principal y cada color */}
      <Link to={`/producto/${product.id}`} className="relative aspect-4/5 overflow-hidden bg-[#F3EFE9] block">
        <ImageStack
          images={slides.map((s) => s.src)}
          activeIndex={index}
          alt={`${product.name}${activeSlide.color ? ` - ${activeSlide.color.name}` : ''}`}
          className="transition-transform duration-700 ease-out group-hover:scale-105"
          fadeMs={600}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="bg-[#2D3A2F]/90 backdrop-blur-xs text-[#FAF8F5] text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-xs transition-transform duration-300 group-hover:translate-x-0.5">
              Destacado
            </span>
          )}
          {!product.active && (
            <span className="bg-neutral-800/90 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
              Pausado
            </span>
          )}
        </div>

        {/* Nombre del color que se está viendo */}
        {activeSlide.color && (
          <span
            key={activeSlide.color.id}
            className="absolute bottom-3 left-3 z-10 bg-[#1E261F]/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-fade-in"
          >
            <span className="w-2.5 h-2.5 rounded-full border border-white/60" style={{ backgroundColor: activeSlide.color.hex }} />
            {activeSlide.color.name}
          </span>
        )}

        {/* Indicador de cuántas fotos hay */}
        {slides.length > 1 && (
          <div className="absolute bottom-3.5 right-3 z-10 flex gap-1">
            {slides.map((s, i) => (
              <span
                key={s.src}
                className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/55'}`}
              />
            ))}
          </div>
        )}

        {/* Ver detalle (solo compu, al pasar el mouse) */}
        <div className="absolute inset-0 z-[5] bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center p-4 pointer-events-none">
          <span className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/95 backdrop-blur-xs text-[#2D3A2F] text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg inline-flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Ver detalle
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {lineName && (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#7D8B7A] block mb-1">
              {lineName}
            </span>
          )}
          <Link to={`/producto/${product.id}`} className="block">
            <h3 className="font-serif text-lg font-semibold text-[#2D3A2F] group-hover:text-[#4A5D4E] transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Pedido del cliente: en la tarjeta va la medida; la descripción queda para el detalle */}
          {product.dimensions && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5748]">
              <Ruler className="w-3.5 h-3.5 text-[#7D8B7A] shrink-0" />
              <span className="line-clamp-1">{product.dimensions}</span>
            </p>
          )}

          {/* Muestras de color: al tocarlas se ve la maceta en ese color */}
          {colorsWithPhoto.length > 1 && (
            <div className="mt-3 flex items-center gap-1.5" role="group" aria-label="Colores disponibles">
              {colorsWithPhoto.slice(0, MAX_SWATCHES).map((c) => {
                const active = activeSlide.color?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    aria-label={`Ver en ${c.name}`}
                    aria-pressed={active}
                    onMouseEnter={() => showColor(c.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      showColor(c.id);
                    }}
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                      active ? 'border-[#2D3A2F] scale-110' : 'border-white ring-1 ring-[#DCD5C8] hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
              {colorsWithPhoto.length > MAX_SWATCHES && (
                <span className="text-[10px] font-semibold text-[#7D8B7A]">+{colorsWithPhoto.length - MAX_SWATCHES}</span>
              )}
            </div>
          )}
        </div>

        {/* Precio y acción */}
        <div className="pt-4 mt-3 border-t border-[#F2ECE3] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#8C988A] block">Precio</span>
            <span className="text-base font-bold text-[#2D3A2F]">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0EBE1] text-[#2D3A2F] hover:bg-[#2D3A2F] hover:text-[#FAF8F5] active:scale-95 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md text-xs font-semibold shrink-0"
            title="Agregar pedido"
            aria-label={`Agregar ${product.name} al pedido`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Agregar pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
};
