import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CartItem } from '../types';
import { STORE_CONFIG } from '../data/mockData';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `${STORE_CONFIG.currencySymbol} ${amount.toLocaleString('es-PY')}`;
}

export function generateWhatsAppMessage(items: CartItem[], total: number, customerNote?: string): string {
  let message = `🌿 *¡Hola ${STORE_CONFIG.storeName}! Quiero realizar el siguiente pedido:*\n\n`;
  
  items.forEach((item, index) => {
    message += `🪴 *${item.product.name}*\n`;
    message += `   • Cantidad: ${item.quantity}\n`;
    message += `   • Precio Unit: ${formatPrice(item.product.price)}\n`;
    message += `   • Subtotal: ${formatPrice(item.subtotal)}\n\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *TOTAL ESTIMADO: ${formatPrice(total)}*\n\n`;

  if (customerNote && customerNote.trim()) {
    message += `📝 *Nota adicional:* ${customerNote.trim()}\n\n`;
  }

  message += `¿Tienen disponibilidad y cómo coordinamos la entrega/envío? ¡Muchas gracias!`;

  return encodeURIComponent(message);
}

export function getWhatsAppUrl(items: CartItem[], total: number, note?: string): string {
  const text = generateWhatsAppMessage(items, total, note);
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${text}`;
}
