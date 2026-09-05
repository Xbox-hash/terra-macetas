import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, MessageCircle, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCompany } from '../../contexts/CompanyContext';
import { QuantitySelector } from '../../components/common/QuantitySelector';
import { Button } from '../../components/common/Button';
import { formatPrice } from '../../utils';
import { CheckoutModal } from '../../components/public/CheckoutModal';

export const CartPage: React.FC = () => {
  const { items, totalItems, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { config } = useCompany();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (items.length === 0 && !isCheckoutOpen) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#EAE4D7] text-[#4A5D4E] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10 opacity-60" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#222A21]">
          Tu carrito de compras está vacío
        </h1>
        <p className="text-sm text-[#677565] max-w-md mx-auto leading-relaxed">
          Todavía no agregaste ninguna maceta. Explorá nuestro catálogo de piezas de autor y encontrá el diseño ideal para tus plantas.
        </p>
        <div className="pt-2">
          <Link to="/catalogo">
            <Button size="lg" className="shadow-md">
              Explorar Catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F] block mb-1">
              Revisión de Pedido
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#222A21]">
              Tu Carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
            </h1>
          </div>
          <Link
            to="/catalogo"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#586656] hover:text-[#222A21]"
          >
            <ArrowLeft className="w-4 h-4" /> Seguir comprando
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E9E4DB] overflow-hidden shadow-xs divide-y divide-[#F0EAE0]">
              {items.map((item) => (
                <div key={item.product.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  <Link to={`/producto/${item.product.id}`} className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#F3EFE9] border border-[#EBE5DB]">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="flex-1 w-full flex flex-col justify-between h-full gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/producto/${item.product.id}`}>
                          <h3 className="font-serif text-lg font-semibold text-[#222A21] hover:text-[#4A5D4E] transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#6F7B6D] mt-0.5">
                          Precio Unitario: <span className="font-medium text-[#2D3A2F]">{formatPrice(item.product.price)}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[#9CA799] hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
                        onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
                      />
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#8C988A] block">Subtotal</span>
                        <span className="text-base font-bold text-[#222A21]">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-2">
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-xs text-rose-700 hover:bg-rose-50 cursor-pointer">
                Vaciar carrito
              </Button>
              <Link to="/catalogo" className="sm:hidden text-xs font-semibold text-[#2D3A2F] underline">
                Seguir comprando
              </Link>
            </div>
          </div>

          {/* Right: Summary and WhatsApp Order Action */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-7 border border-[#E5DFD4] shadow-sm space-y-6">
              <h2 className="font-serif text-xl font-bold text-[#222A21]">Resumen del Pedido</h2>

              <div className="space-y-3 text-sm text-[#5B6858]">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} piezas)</span>
                  <span className="font-semibold text-[#222A21]">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío / Retiro</span>
                  <span className="text-[#3E5040] font-medium text-xs">A coordinar por WhatsApp</span>
                </div>
                <div className="border-t border-[#E3DDD1] pt-3 flex justify-between text-lg font-bold text-[#222A21]">
                  <span>Total Estimado</span>
                  <span className="text-[#2D3A2F]">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Main Action WhatsApp Button */}
              <Button
                variant="whatsapp"
                size="lg"
                className="w-full justify-center shadow-lg hover:shadow-xl group"
                onClick={() => setIsCheckoutOpen(true)}
                leftIcon={<MessageCircle className="w-5 h-5 fill-current" />}
              >
                Completar y Enviar Pedido
              </Button>

              {/* Info and guarantee */}
              <div className="space-y-2 pt-2 text-[11px] text-[#6E7B6C] leading-relaxed border-t border-[#E8E2D6]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Te responderemos al instante desde <strong>{config.storeName}</strong> al {config.whatsappDisplay || config.whatsappNumber}.</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Garantía de embalaje seguro para piezas de cerámica y hormigón.</span>
                </div>
              </div>
            </div>
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
