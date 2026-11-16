import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Nombre de lo que se lista, en plural (ej: "pedidos") */
  itemLabel?: string;
}

/** Números de página a mostrar: 1 … 4 5 6 … 12 */
function getPageNumbers(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'resultados',
}) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const navButton =
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-[#475546] hover:bg-[#EFE9DE] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent';

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#EFE9DE] text-xs text-[#6F7B6D]"
    >
      <p>
        Mostrando <span className="font-semibold text-[#2D3A2F]">{from}–{to}</span> de{' '}
        <span className="font-semibold text-[#2D3A2F]">{totalItems}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={navButton}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} className="px-1.5 text-[#9AA598]">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-8 h-8 px-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                p === page ? 'bg-[#2D3A2F] text-white shadow-xs' : 'text-[#475546] hover:bg-[#EFE9DE]'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={navButton}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
};
