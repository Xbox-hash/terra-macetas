import { useEffect, useMemo, useState } from 'react';

/**
 * Paginación en el navegador para listas que ya están cargadas completas.
 * `resetKey` cambia cuando cambian filtros/búsqueda: en ese caso vuelve a la página 1.
 */
export function usePagination<T>(items: T[], pageSize: number, resetKey?: unknown) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Filtros nuevos → primera página
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  // Si se borra el último elemento de la última página, no quedar en una página vacía
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize]
  );

  return { page: currentPage, setPage, totalPages, pageItems, totalItems: items.length, pageSize };
}
