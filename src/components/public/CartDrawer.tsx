import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCompany } from '../../contexts/CompanyContext';
import { QuantitySelector } from '../common/QuantitySelector';
import { Button } from '../common/Button';
import { formatPrice } from '../../utils';
import { CheckoutModal } from './CheckoutModal';

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

  if (!isCartDrawerOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
        <div
          className="fixed inset-0 bg-[#161D17]/50 backdrop-blur-xs transition-opacity"
          onClick={closeCartDrawer}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-[#E3DDD1]">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#EBE5DA] flex items-center justify-between bg-[#F4EFE6]">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#4A5D4E]" />
                <h2 className="font-serif text-xl font-bold text-[#2D3A2F]">
                  Tu Carrito ({totalItems})
                </h2>
              </div>
              <button
                onClick={closeCartDrawer}
                className="p-1.5 rounded-lg text-[#5B6758] hover:text-[#2D3A2F] hover:bg-[#E8E1D4] transition-colors cursor-pointer"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7B8878]">
                  <div className="w-16 h-16 rounded-full bg-[#EAE4D7] flex items-center justify-center mb-4 text-[#4A5D4E]">
                    <ShoppingBag className="w-8 h-8 opacity-60" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#2D3A2F] mb-1">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-xs text-[#6F7B6D] max-w-xs mb-6">
                    Descubrí nuestras colecciones de autor y sumá diseño botánico a tus espacios.
                  </p>
                  <Link to="/catalogo" onClick={closeCartDrawer}>
                    <Button variant="primary" size="sm">
                      Explorar Catálogo
                    </Button>
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-3.5 bg-white rounded-xl border border-[#E9E4DB] shadow-2xs"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-lg object-cover bg-[#F3EFE9] shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-serif font-semibold text-sm text-[#2D3A2F] line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[#9CA799] hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-[#5D6A5A]">
                        Unit: {formatPrice(item.product.price)}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <QuantitySelector
                          size="sm"
                          quantity={item.quantity}
                          onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
                          onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
                        />
                        <span className="text-sm font-bold text-[#2D3A2F]">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer & Checkout Action */}
            {items.length > 0 && (
              <div className="p-5 sm:p-6 border-t border-[#EBE5DA] bg-[#F7F4EE] space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#6F7B6D]">
                    <span>Subtotal ({totalItems} productos)</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#6F7B6D]">
                    <span>Envío</span>
                    <span className="text-[#3F5041] font-medium">A coordinar por WhatsApp</span>
                  </div>
                  <div className="border-t border-[#E4DDD0] pt-2 flex justify-between text-base font-bold text-[#2D3A2F]">
                    <span>Total estimado</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="whatsapp"
                    className="w-full justify-center"
                    size="md"
                    onClick={() => setIsCheckoutOpen(true)}
                    leftIcon={<MessageCircle className="w-5 h-5 fill-current" />}
                  >
                    Continuar y Enviar por WhatsApp
                  </Button>

                  <div className="flex gap-2">
                    <Link to="/carrito" onClick={closeCartDrawer} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Ver carrito completo
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-xs text-rose-700 hover:bg-rose-50"
                    >
                      Vaciar
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-center text-[#7F8B7D]">
                  🔒 Coordinás con {config.storeName} por transferencia o contra entrega.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
};
