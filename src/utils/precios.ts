import { Product, ProductColor } from '../types';

/**
 * Precio por color: cada color de un producto puede tener su propio precio.
 * Si un color no tiene precio cargado, usa el precio general del producto.
 * El servidor aplica la misma regla al guardar el pedido (OrderPricing.UnitPrice).
 */

const tienePrecio = (c?: ProductColor | null): c is ProductColor & { price: number } =>
  !!c && typeof c.price === 'number' && c.price > 0;

const mismoNombre = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Precio de un color del producto (por objeto, id o nombre). */
export function precioDeColor(product: Product, color?: ProductColor | string | null): number {
  if (!color) return product.price;
  const c =
    typeof color === 'string'
      ? product.colors?.find((x) => x.id === color || mismoNombre(x.name, color))
      : product.colors?.find((x) => x.id === color.id) ?? color;
  return tienePrecio(c) ? c.price : product.price;
}

/** Precio menor y mayor entre el general y los de cada color. */
export function rangoPrecios(product: Product): { min: number; max: number; varia: boolean } {
  const precios = [product.price, ...(product.colors ?? []).filter(tienePrecio).map((c) => c.price)];
  // Si todos los colores tienen su propio precio, el general no se usa para ninguno
  const colores = product.colors ?? [];
  const todosConPrecio = colores.length > 0 && colores.every(tienePrecio);
  const usados = todosConPrecio ? precios.slice(1) : precios;
  const min = Math.min(...usados);
  const max = Math.max(...usados);
  return { min, max, varia: min !== max };
}

/** Precio para ordenar el catálogo: el menor. */
export const precioMinimo = (product: Product) => rangoPrecios(product).min;
