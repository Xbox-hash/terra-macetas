import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CartItem } from '../types';
import { STORE_CONFIG } from '../data/mockData';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `${STORE_CONFIG.currencySymbol} ${rounded.toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return phone;

  // Paraguay format: 595 9xx xxx xxx or 09xx xxx xxx
  if (clean.startsWith('595') && clean.length >= 11) {
    const prefix = clean.substring(0, 3); // 595
    const code = clean.substring(3, 6);   // 981
    const part1 = clean.substring(6, 9);  // 234
    const rest = clean.substring(9);      // 567...
    return `+${prefix} ${code} ${part1} ${rest}`.trim();
  }
  if (clean.startsWith('09') && clean.length === 10) {
    return `${clean.substring(0, 4)} ${clean.substring(4, 7)} ${clean.substring(7)}`;
  }

  // Brazil format: 55 45 9xxxx-xxxx or 55 45 xxxx-xxxx
  if (clean.startsWith('55') && clean.length >= 12) {
    const prefix = clean.substring(0, 2); // 55
    const ddd = clean.substring(2, 4);    // 45
    const rest = clean.substring(4);
    if (rest.length === 9) {
      return `+${prefix} (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    } else if (rest.length === 8) {
      return `+${prefix} (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
    return `+${prefix} (${ddd}) ${rest}`;
  }

  // Argentina format: 54 9 11 xxxx xxxx
  if (clean.startsWith('54') && clean.length >= 11) {
    return `+54 ${clean.substring(2)}`;
  }

  // Generic international fallback: +<digits>
  return `+${clean}`;
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

