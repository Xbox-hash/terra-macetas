import { useEffect, useRef, useState } from 'react';

/** true si el sistema del visitante pide reducir animaciones. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** true en celulares/tablets (sin mouse para hacer hover). */
export function useIsTouchDevice(): boolean {
  const [touch] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(hover: none)').matches
  );
  return touch;
}

interface SlideshowOptions {
  /** Cantidad de fotos. */
  count: number;
  /** Cada cuánto pasa a la siguiente, en ms. */
  intervalMs: number;
  /** Si es false, se queda quieto. */
  playing: boolean;
  /** Demora antes del primer cambio (para que no cambien todas las tarjetas a la vez). */
  initialDelayMs?: number;
}

/**
 * Índice de la foto actual que avanza solo mientras `playing` sea true.
 * Se pausa con la pestaña oculta y si el visitante pidió menos movimiento.
 */
export function useSlideshow({ count, intervalMs, playing, initialDelayMs = 0 }: SlideshowOptions) {
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const timer = useRef<number | undefined>(undefined);

  // Si cambia la cantidad de fotos, no quedar apuntando a una que ya no existe
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (!playing || reducedMotion || count < 2) return;

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (!document.hidden) setIndex((i) => (i + 1) % count);
      timer.current = window.setTimeout(tick, intervalMs);
    };
    timer.current = window.setTimeout(tick, initialDelayMs || intervalMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
    };
  }, [playing, reducedMotion, count, intervalMs, initialDelayMs]);

  return [index, setIndex] as const;
}

/** true mientras el elemento esté (al menos a la mitad) en pantalla. */
export function useInView<T extends Element>(enabled = true) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled]);
  return [ref, inView] as const;
}
