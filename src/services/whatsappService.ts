import { API_BASE } from './apiConfig';

export interface WhatsAppStatus {
  isOnline: boolean;
  state: 'open' | 'connecting' | 'close' | 'offline' | string;
  instanceName?: string;
  message?: string;
  error?: string;
}

export interface WhatsAppQrResponse {
  base64?: string;
  pairingCode?: string;
  instanceName?: string;
}

export const whatsappService = {
  async getStatus(): Promise<WhatsAppStatus> {
    try {
      const res = await fetch(`${API_BASE}/whatsapp/status`);
      if (!res.ok) {
        return { isOnline: false, state: 'offline' };
      }
      return await res.json();
    } catch {
      return { isOnline: false, state: 'offline' };
    }
  },

  async getQr(): Promise<WhatsAppQrResponse> {
    const res = await fetch(`${API_BASE}/whatsapp/qr`);
    if (!res.ok) {
      throw new Error('No se pudo obtener el código QR');
    }
    return await res.json();
  },
};
