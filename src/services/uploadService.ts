import { API_BASE } from './apiConfig';

const UPLOAD_API_URL = `${API_BASE}/upload`;

export const uploadService = {
  /**
   * Sube un archivo físico de imagen (File) al servidor y devuelve la ruta relativa (/uploads/...)
   */
  async uploadFile(file: File, folder: 'products' | 'lines' | 'colors' | 'company' = 'products'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch(UPLOAD_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al subir la imagen al servidor');
    }

    const data = await res.json();
    return data.url;
  },

  /**
   * Sube una imagen procesada o comprimida en Base64 (data:image/...) al servidor,
   * la guarda físicamente en el disco y devuelve la ruta relativa (/uploads/...)
   */
  async uploadBase64(base64: string, folder: 'products' | 'lines' | 'colors' | 'company' = 'products'): Promise<string> {
    // Si ya es una URL o ruta relativa (no base64), devolver tal cual
    if (!base64.startsWith('data:image/')) {
      return base64;
    }

    const res = await fetch(`${UPLOAD_API_URL}/base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64,
        folder,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al guardar la imagen en el servidor');
    }

    const data = await res.json();
    return data.url;
  },
};
