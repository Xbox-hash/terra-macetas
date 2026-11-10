import { Product, ProductColor } from '../types';

export interface ProductSlide {
  src: string;
  /** Color al que pertenece la foto (si es una foto de variante de color). */
  color?: ProductColor;
}

const isUsableImage = (src?: string): src is string => !!src && src !== 'has-photo';

/**
 * Fotos de un producto en el orden en que se muestran:
 * 1) la foto principal, 2) una foto por cada color que tenga foto cargada, 3) el resto de la galería.
 * Sin repetidos.
 */
export function buildProductSlides(product: Product): ProductSlide[] {
  const slides: ProductSlide[] = [];
  const seen = new Set<string>();
  const push = (src: string | undefined, color?: ProductColor) => {
    if (!isUsableImage(src) || seen.has(src)) return;
    seen.add(src);
    slides.push({ src, color });
  };

  push(product.images?.[0]);
  for (const color of product.colors ?? []) push(color.image, color);
  for (const img of product.images?.slice(1) ?? []) push(img);

  return slides;
}

/** Número estable a partir de un texto, para desfasar los carruseles de cada tarjeta. */
export function stableOffset(text: string, max: number): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}
