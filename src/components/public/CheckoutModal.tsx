import React, { useState } from 'react';
import { ShoppingBag, Sparkles, CheckCircle2, MessageCircle, MapPin, User, Phone, Building, ArrowRight, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FormInput } from '../common/FormInput';
import { useCompany } from '../../contexts/CompanyContext';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../utils';
import { orderService } from '../../services/orderService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { config } = useCompany();
  const { items, totalAmount, clearCart, closeCartDrawer } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(config.city || 'Asunción');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  if (!isOpen) return null;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim()) return;

    setIsSubmitting(true);
    try {
      const fullNote = `Ciudad: ${city.trim()}`;

      // 1. Guardar el pedido en SQL Server
      const createdOrder = await orderService.createOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        notes: fullNote,
        total: totalAmount,
        items,
      });

      const orderId = createdOrder.id || `ORD-${Date.now().toString().slice(-6)}`;
      setOrderNumber(orderId);

      // 2. Preparar el mensaje de WhatsApp estructurado (sin el campo de aclaración)
      let message = `🌿 *¡Hola ${config.storeName}! Quiero realizar un pedido:*\n\n`;
      message += `👤 *Cliente:* ${name.trim()}\n`;
      message += `📱 *Teléfono / WhatsApp:* ${phone.trim()}\n`;
      message += `📍 *Ciudad de entrega:* ${city.trim()}\n\n`;
      message += `📦 *DETALLE DEL PEDIDO (#${orderId}):*\n`;
      
      items.forEach((item) => {
        message += `   • ${item.quantity}x *${item.product.name}* (${formatPrice(item.subtotal)})\n`;
      });

      message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      message += `💰 *TOTAL A ABONAR: ${formatPrice(totalAmount)}*\n\n`;
      message += `Quedo a la espera de su confirmación para coordinar el pago y el envío. ¡Muchas gracias!`;

      // 3. Limpiar carrito y mostrar pantalla de éxito directo (sin abrir ventana de WhatsApp web)
      clearCart();
      if (closeCartDrawer) closeCartDrawer();
      setOrderSuccess(true);
    } catch (error) {
      console.error('Error al procesar pedido', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setOrderSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={orderSuccess ? handleFinish : onClose} maxWidth="md">
      {orderSuccess ? (
        /* Pantalla Elegante de Agradecimiento */
        <div className="text-center py-6 px-2 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#4A5D4E] bg-[#EAE4D7] px-4 py-1.5 rounded-full inline-block">
              ✓ PEDIDO REGISTRADO #{orderNumber}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#222A21] pt-1">
              ¡Muchas gracias por realizar su pedido!
            </h3>
            <p className="text-base text-[#3E4E3F] max-w-md mx-auto leading-relaxed font-medium pt-1">
              En breve, alguien de <strong>{config.storeName}</strong> se estará contactando con usted a su WhatsApp o teléfono para coordinar el pago y la entrega.
            </p>
          </div>

          <div className="p-4 bg-[#F4EFE6] rounded-2xl border border-[#E3DDD1] text-xs text-[#5C6A5A] text-left space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#3E5040] shrink-0" />
              <span>Sus datos y piezas seleccionadas ya ingresaron a nuestro sistema de pedidos.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>La notificación fue despachada automáticamente a nuestro equipo por WhatsApp.</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" size="lg" className="w-full justify-center" onClick={handleFinish}>
              Volver a la tienda
            </Button>
          </div>
        </div>
      ) : (
        /* Formulario Sutil de Datos de Entrega */
        <form onSubmit={handleCheckoutSubmit} className="space-y-5">
          <div className="border-b border-[#E8E2D6] pb-3 text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5E725F] block">
              Coordinación de Entrega
            </span>
            <h3 className="font-serif text-xl font-bold text-[#222A21] mt-0.5">
              ¿A quién enviamos el pedido?
            </h3>
            <p className="text-xs text-[#6F7B6D] mt-0.5">
              Completá tus datos para que el equipo de <strong>{config.storeName}</strong> pueda contactarte.
            </p>
          </div>

          {/* Resumen sutil del carrito */}
          <div className="p-3.5 bg-[#F4EFE6] rounded-2xl border border-[#E3DDD1] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#3E4E40] font-medium">
              <ShoppingBag className="w-4 h-4 text-[#4A5D4E]" />
              <span>{items.length} {items.length === 1 ? 'modelo' : 'modelos'} en tu pedido</span>
            </div>
            <span className="font-serif font-bold text-base text-[#222A21]">
              {formatPrice(totalAmount)}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* 🛡️ Honeypot invisible para atrapar bots */}
            <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value=""
                onChange={() => {}}
              />
            </div>

            <FormInput
              label="Tu Nombre Completo"
              required
              placeholder="Ej: Sofia Martínez"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FormInput
                label="WhatsApp / Teléfono de Contacto"
                type="tel"
                required
                placeholder="Ej: 0981 123 456 o +55 45 99988-7766"
                helperText="Acepta números de Paraguay (098...) y Brasil (+55...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s-()]/g, ''))}
              />

              <FormInput
                label="Ciudad / Localidad"
                required
                placeholder="Ej: Asunción, Luque, Lambaré..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E2D6] flex flex-col gap-2">
            <Button
              type="submit"
              variant="whatsapp"
              size="lg"
              className="w-full justify-center shadow-md font-semibold cursor-pointer"
              isLoading={isSubmitting}
              leftIcon={<MessageCircle className="w-5 h-5 fill-current" />}
            >
              Confirmar y Enviar Pedido
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs text-[#6F7B6D]">
              Volver al carrito
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
