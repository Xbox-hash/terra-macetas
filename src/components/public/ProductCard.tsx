import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../utils';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';

interface ProductCardProps {
  product: Product;
  lineName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, lineName }) => {
  const { addToCart, openCartDrawer } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    showToast(`¡Agregaste "${product.name}" al carrito!`);
    openCartDrawer();
  };

  const mainImage = product.images[0] || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80';
  const secondImage = product.images[1] || mainImage;

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E9E4DB] hover:border-[#D1C9BC] transition-all duration-300 hover:shadow-xl hover:shadow-stone-200/50">
      {/* Image Container with Hover zoom and secondary image reveal */}
      <Link to={`/producto/${product.id}`} className="relative aspect-4/5 overflow-hidden bg-[#F3EFE9] block">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {secondImage !== mainImage && (
          <img
            src={secondImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
            loading="lazy"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="bg-[#2D3A2F]/90 backdrop-blur-xs text-[#FAF8F5] text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-xs">
              Destacado
            </span>
          )}
          {!product.active && (
            <span className="bg-neutral-800/90 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
              Pausado
            </span>
          )}
        </div>

        {/* Quick View Floating button on Desktop hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
          <span className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/95 backdrop-blur-xs text-[#2D3A2F] text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg inline-flex items-center gap-1.5 hover:bg-white">
            <Eye className="w-3.5 h-3.5" /> Ver detalle
          </span>
        </div>
      </Link>

      {/* Info Container */}
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
          <p className="text-xs text-[#6F7B6D] line-clamp-2 mt-1.5 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-4 mt-3 border-t border-[#F2ECE3] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#8C988A] block">Precio</span>
            <span className="text-base font-bold text-[#2D3A2F]">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="p-2.5 rounded-xl bg-[#F0EBE1] text-[#2D3A2F] hover:bg-[#2D3A2F] hover:text-[#FAF8F5] active:scale-95 transition-all duration-200 cursor-pointer shadow-2xs"
            title="Agregar al carrito"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
