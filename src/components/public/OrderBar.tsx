import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../utils';

/** Barra fija abajo con el pedido en curso. Abre el carrito, donde se envía por WhatsApp. */
export const OrderBar: React.FC = () => {
  const { totalItems, totalAmount, openCartDrawer, isCartDrawerOpen } = useCart();
  if (totalItems === 0 || isCartDrawerOpen) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 px-3 sm:px-6 pointer-events-none"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
    >
      <button
        type="button"
        onClick={openCartDrawer}
        className="pointer-events-auto animate-fade-in-up mx-auto w-full max-w-3xl flex items-center justify-between gap-3 rounded-2xl bg-[#2D3A2F] text-[#FAF8F5] pl-4 pr-2 py-2 shadow-[0_12px_30px_-8px_rgba(34,42,33,.45)] cursor-pointer hover:bg-[#33433A] transition-colors"
      >
        <span className="inline-flex items-center gap-2.5 text-sm font-semibold min-w-0">
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {totalItems} {totalItems === 1 ? 'pieza' : 'piezas'} · <span className="tabular-nums">{formatPrice(totalAmount)}</span>
          </span>
        </span>
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] text-[#10301A] text-xs font-bold px-3.5 py-2.5">
          Ver pedido <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>
    </div>
  );
};
