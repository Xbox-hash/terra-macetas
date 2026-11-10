import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, ShoppingBag, MessageCircle, Clock, Lock, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCompany } from '../../contexts/CompanyContext';
import { QuantitySelector } from '../common/QuantitySelector';
import { Button } from '../common/Button';
import { formatPrice } from '../../utils';
import { CartItem } from '../../types';
import { CheckoutModal } from './CheckoutModal';

/** Foto y color del ítem: si eligió un color con foto propia, se muestra esa. */
function itemVisuals(item: CartItem) {
  const color = item.selectedColor
    ? item.product.colors?.find((c) => c.name === item.selectedColor)
    : undefined;
  const colorImage = color?.image && color.image !== 'has-photo' ? color.image : undefined;
  return { color, image: colorImage || item.product.images[0] };
}

export const CartDrawer: React.FC = () => {
  const {
    items,
    totalItems,
    totalAmount,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { config } = useCompany();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <>
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-[#161D17]/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={closeCartDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-[#E3DDD1] animate-slide-in-right">
              {/* Encabezado */}
              <div className="px-6 py-5 border-b border-[#EBE5DA] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-2xl font-semibold text-[#2D3A2F]">Tu pedido</h2>
                  {totalItems > 0 && (
                    <span className="min-w-6 h-6 px-2 rounded-full bg-[#2D3A2F] text-[#FAF8F5] text-xs font-bold flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </div>
                <button
                  onClick={closeCartDrawer}
                  className="p-2 rounded-full text-[#5B6758] hover:text-[#2D3A2F] hover:bg-[#EFEAE1] transition-colors duration-200 cursor-pointer"
                  aria-label="Cerrar carrito"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Productos */}
              <div className="flex-1 overflow-y-auto px-6 py-2">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7B8878]">
                    <div className="w-16 h-16 rounded-full bg-[#EAE4D7] flex items-center justify-center mb-4 text-[#4A5D4E]">
                      <ShoppingBag className="w-8 h-8 opacity-60" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-[#2D3A2F] mb-1">
                      Tu carrito está vacío
                    </h3>
                    <p className="text-xs text-[#6F7B6D] max-w-xs mb-6">
                      Descubrí nuestras colecciones de autor y sumá diseño y distinción a tus espacios.
                    </p>
                    <Link to="/catalogo" onClick={closeCartDrawer}>
                      <Button variant="primary" size="sm">
                        Explorar Catálogo
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#EBE5DA]">
                    {items.map((item) => {
                      const { color, image } = itemVisuals(item);
                      return (
                        <li
                          key={`${item.product.id}_${item.selectedColor || 'default'}`}
                          className="flex gap-4 py-5 animate-fade-in"
                        >
                          {/* Foto */}
                          <Link
                            to={`/producto/${item.product.id}`}
                            onClick={closeCartDrawer}
                            className="w-24 h-28 rounded-xl overflow-hidden bg-[#F1EDE5] border border-[#ECE6DB] shrink-0"
                          >
                            <img src={image} alt={item.product.name} className="w-full h-full object-cover" />
                          </Link>

                          {/* Datos */}
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <Link
                                to={`/producto/${item.product.id}`}
                                onClick={closeCartDrawer}
                                className="font-serif text-lg leading-snug font-semibold text-[#2D3A2F] hover:text-[#4A5D4E] line-clamp-2"
                              >
                                {item.product.name}
                              </Link>
                              <button
                                onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                                className="-mr-1.5 -mt-0.5 p-1.5 rounded-full text-[#A3AD9F] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                aria-label={`Quitar ${item.product.name}`}
                                title="Quitar del pedido"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="mt-1.5 space-y-1 text-xs text-[#6F7B6D]">
                              {item.selectedColor && (
                                <p className="flex items-center gap-1.5">
                                  <span
                                    className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                                    style={{ backgroundColor: color?.hex || '#C9BFAE' }}
                                  />
                                  {item.selectedColor}
                                </p>
                              )}
                              {item.product.manufacturingTime && (
                                <p className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  Se fabrica en {item.product.manufacturingTime}
                                </p>
                              )}
                            </div>

                            <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                              <QuantitySelector
                                size="sm"
                                quantity={item.quantity}
                                onIncrease={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor)}
                                onDecrease={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor)}
                              />
                              <div className="text-right">
                                <span className="block text-base font-bold text-[#2D3A2F]">
                                  {formatPrice(item.subtotal)}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="block text-[11px] text-[#8C988A]">
                                    {formatPrice(item.product.price)} c/u
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Resumen y acciones */}
              {items.length > 0 && (
                <div className="px-6 pt-5 pb-6 border-t border-[#EBE5DA] bg-[#F4EFE6] space-y-5">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between text-[#6F7B6D]">
                      <dt>Subtotal · {totalItems} {totalItems === 1 ? 'pieza' : 'piezas'}</dt>
                      <dd>{formatPrice(totalAmount)}</dd>
                    </div>
                    <div className="flex justify-between text-[#6F7B6D]">
                      <dt>Envío</dt>
                      <dd className="text-[#3F5041]">A coordinar</dd>
                    </div>
                    <div className="pt-3 mt-1 border-t border-[#E0D8CA] flex justify-between items-baseline text-[#2D3A2F]">
                      <dt className="font-semibold">Total estimado</dt>
                      <dd className="text-xl font-bold">{formatPrice(totalAmount)}</dd>
                    </div>
                  </dl>

                  <Button
                    variant="whatsapp"
                    className="w-full justify-center shadow-md"
                    size="lg"
                    onClick={() => setIsCheckoutOpen(true)}
                    leftIcon={<MessageCircle className="w-5 h-5 fill-current" />}
                  >
                    Enviar pedido por WhatsApp
                  </Button>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <Link
                      to="/carrito"
                      onClick={closeCartDrawer}
                      className="inline-flex items-center gap-1 text-[#2D3A2F] hover:text-[#4A5D4E] group"
                    >
                      Ver carrito completo
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[#8C988A] hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      Vaciar pedido
                    </button>
                  </div>

                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#7F8B7D]">
                    <Lock className="w-3 h-3" />
                    Pagás a {config.storeName} por transferencia o contra entrega.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
};
