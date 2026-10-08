/**
 * Utilidad de compresión y redimensionamiento automático de imágenes en el navegador.
 * Evita el envío y almacenamiento de imágenes pesadas sin procesar (de 5MB - 15MB de cámaras de celular)
 * reduciéndolas a un tamaño óptimo para catálogo web (~70KB - 150KB en formato JPEG/WebP).
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    // Si no es un archivo de imagen, rechazar
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('No se pudo obtener el contenido de la imagen.'));
        return;
      }

      // Si es SVG, no redimensionar con canvas para preservar vectores
      if (file.type === 'image/svg+xml') {
        resolve(src);
        return;
      }

      compressBase64Image(src, { maxWidth, maxHeight, quality })
        .then(resolve)
        .catch(reject);
    };

    reader.readAsDataURL(file);
  });
}

export async function compressBase64Image(
  dataUrl: string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.82 } = options;

  // Si no es un dataUrl base64 (ej: url externa http), devolver tal cual
  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  // Si ya es un SVG, devolver sin tocar
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calcular proporción máxima
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback: devolver la original si canvas no está disponible
        resolve(dataUrl);
        return;
      }

      // Relleno blanco para preservar transparencia en caso de convertir a JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Exportar en JPEG optimizado (calidad 82%)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      // Fallback si la imagen no pudo ser cargada en el elemento Image
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
