import type { CSSProperties } from 'react';

/**
 * Encuadre de fotos: el punto (en %) que tiene que quedar a la vista cuando la foto
 * se recorta para llenar un recuadro (tarjeta, carrusel, mosaico).
 *
 * Se guarda en la misma URL como "#foco=X,Y" (ej. "/uploads/works/a.jpg#foco=50,72").
 * El navegador ignora el "#..." al descargar la imagen, así que no hace falta cambiar
 * la base de datos, y las fotos sin encuadre siguen centradas como siempre.
 */
export interface Foco {
  x: number;
  y: number;
}

export const FOCO_CENTRO: Foco = { x: 50, y: 50 };

const PATRON = /#foco=(\d{1,3}(?:\.\d+)?),(\d{1,3}(?:\.\d+)?)$/;

const limitar = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

/** El encuadre guardado en la URL, o null si no tiene. */
export function leerFoco(src?: string | null): Foco | null {
  const m = src ? PATRON.exec(src) : null;
  return m ? { x: limitar(Number(m[1])), y: limitar(Number(m[2])) } : null;
}

/** La URL sin el encuadre. */
export function sinFoco(src: string): string {
  return src.replace(PATRON, '');
}

/** La URL con el encuadre (si es el centro, se guarda sin "#foco"). */
export function conFoco(src: string, foco: Foco | null): string {
  const base = sinFoco(src);
  if (!foco) return base;
  const x = limitar(foco.x);
  const y = limitar(foco.y);
  return x === 50 && y === 50 ? base : `${base}#foco=${x},${y}`;
}

/** Estilo para un <img> con object-cover: deja a la vista el punto elegido. */
export function posicionFoco(src?: string | null): CSSProperties | undefined {
  const f = leerFoco(src);
  return f ? { objectPosition: `${f.x}% ${f.y}%` } : undefined;
}
