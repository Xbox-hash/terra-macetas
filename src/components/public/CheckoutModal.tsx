import React, { useState } from 'react';
import { ShoppingBag, Sparkles, CheckCircle2, MessageCircle, MapPin, User, Phone } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
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
  const [city, setCity] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  if (!isOpen) return null;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim()) return;

    setIsSubmitting(true);
    try {
      const fullNote = `Ciudad: ${city.trim()}`;

      // 1. Guardar el pedido en la base de datos SQL Server
      const createdOrder = await orderService.createOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        notes: fullNote,
        total: totalAmount,
        items,
      });

      const orderId = createdOrder.id || `ORD-${Date.now().toString().slice(-6)}`;
      setOrderNumber(orderId);

      // 2. Preparar el mensaje de WhatsApp estructurado con colores y tiempos
      let message = `✨ *¡Hola ${config.storeName || 'DONNA BOTANICA'}! Quiero realizar un pedido:*\n\n`;
      message += `👤 *Cliente:* ${name.trim()}\n`;
      message += `📱 *Teléfono / WhatsApp:* ${phone.trim()}\n`;
      message += `📍 *Ciudad de entrega:* ${city.trim()}\n\n`;
      message += `📦 *DETALLE DEL PEDIDO (#${orderId}):*\n`;

      items.forEach((item) => {
        const colorLabel = item.selectedColor ? ` [Color: ${item.selectedColor}]` : '';
        const timeLabel = item.product.manufacturingTime ? ` _(Fab: ${item.product.manufacturingTime})_` : '';
        message += `   • ${item.quantity}x *${item.product.name}*${colorLabel}${timeLabel} (${formatPrice(item.subtotal)})\n`;
      });

      message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      message += `💰 *TOTAL A ABONAR: ${formatPrice(totalAmount)}*\n\n`;
      message += `Quedo a la espera de su confirmación para coordinar el pago y el envío. ¡Muchas gracias!`;

      // 3. Limpiar carrito y mostrar confirmación automática
      setWhatsappMessage(message);
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
        /* Pantalla Elegante de Agradecimiento 100% Automática */
        <div className="text-center py-6 px-3 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#4A5D4E] bg-[#EAE4D7] px-4 py-1.5 rounded-full inline-block">
              ✓ PEDIDO REGISTRADO #{orderNumber}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#222A21] pt-1">
              ¡Muchas gracias por tu pedido!
            </h3>
            <p className="text-sm text-[#4A5748] max-w-sm mx-auto leading-relaxed pt-1">
              Tu pedido ya ingresó a nuestro sistema. En breve, el equipo de <strong>{config.storeName || 'DONNA BOTANICA'}</strong> se pondrá en contacto contigo para coordinar el pago y la entrega.
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E3DDD1] text-xs text-[#5C6A5A] text-left space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#3E5040] shrink-0" />
              <span>Tus productos, colores seleccionados y datos de entrega ya quedaron registrados.</span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            {config.whatsappNumber && (
              <a
                href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-[#25D366] hover:bg-[#1EBE5D] transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                Abrir WhatsApp y enviar pedido
              </a>
            )}

            <Button variant="outline" size="lg" className="w-full justify-center shadow-xs" onClick={handleFinish}>
              Volver a la tienda
            </Button>
          </div>
        </div>
      ) : (
        /* Formulario Estético y Perfectamente Alineado */
        <form onSubmit={handleCheckoutSubmit} className="space-y-5">
          {/* Header */}
          <div className="border-b border-[#EAE4D7] pb-4 text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5E725F] block">
              Coordinación de Entrega
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#222A21] mt-0.5">
              Datos para el Envío
            </h3>
            <p className="text-xs text-[#6F7B6D] mt-1">
              Completá tus datos para que podamos preparar y despachar tu pedido.
            </p>
          </div>

          {/* Resumen Compacto y Elegante del Carrito */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D6] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#4A5D4E]">
                <ShoppingBag className="w-4 h-4 text-[#3E5040]" />
                <span>
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu pedido
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-[#7C8879] block">Total</span>
                <span className="font-serif font-bold text-lg text-[#222A21]">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* Lista visual compacta de piezas con colores y tiempos */}
            <div className="pt-2 border-t border-[#ECE5D8] space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-[#3E4E40]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-[#2D3A2F]">{it.quantity}×</span>
                    <span className="truncate">{it.product.name}</span>
                    {it.selectedColor && (
                      <span className="text-[10px] bg-[#EAE4D7] text-[#4A5748] px-1.5 py-0.5 rounded-full shrink-0">
                        {it.selectedColor}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-[#5E725F] shrink-0 pl-2">
                    {formatPrice(it.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario con campos alineados verticalmente y estética cuidada */}
          <div className="space-y-4">
            {/* Honeypot invisible */}
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

            {/* Campo 1: Nombre */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="customer-name" className="block text-xs font-bold uppercase tracking-wider text-[#4A5748] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#5E725F]" />
                <span>Tu Nombre y Apellido *</span>
              </label>
              <input
                id="customer-name"
                type="text"
                required
                placeholder="Ej: Sofia Martínez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] placeholder-[#9AA598] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D3A2F] focus:border-transparent"
              />
            </div>

            {/* Campo 2: Teléfono / WhatsApp */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="customer-phone" className="block text-xs font-bold uppercase tracking-wider text-[#4A5748] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#5E725F]" />
                  <span>WhatsApp de Contacto *</span>
                </label>
                <span className="text-[10px] text-[#7A8677]">PY (+595) o BR (+55)</span>
              </div>
              <input
                id="customer-phone"
                type="tel"
                required
                placeholder="Ej: 0981 123 456 o +55 45 99988-7766"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s-()]/g, ''))}
                className="w-full px-3.5 py-3 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] placeholder-[#9AA598] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D3A2F] focus:border-transparent"
              />
            </div>

            {/* Campo 3: Ciudad / Localidad */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="customer-city" className="block text-xs font-bold uppercase tracking-wider text-[#4A5748] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#5E725F]" />
                <span>Ciudad / Localidad de Entrega *</span>
              </label>
              <input
                id="customer-city"
                type="text"
                required
                placeholder="Ej: Asunción, Ciudad del Este, Encarnación..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] placeholder-[#9AA598] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D3A2F] focus:border-transparent"
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-3 border-t border-[#EAE4D7] space-y-2.5">
            <Button
              type="submit"
              variant="whatsapp"
              size="lg"
              className="w-full justify-center shadow-md font-semibold cursor-pointer py-3.5 rounded-xl text-base"
              isLoading={isSubmitting}
              leftIcon={<MessageCircle className="w-5 h-5 fill-current" />}
            >
              Confirmar y Enviar Pedido
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs text-[#7A8677] hover:text-[#2D3A2F] transition-colors py-1 cursor-pointer"
            >
              ← Volver al carrito
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
