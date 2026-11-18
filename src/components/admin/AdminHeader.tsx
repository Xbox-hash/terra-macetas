import React from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  /** Ya no se usa: la navegación está en la barra superior / inferior. Se mantiene para no romper las páginas. */
  onOpenMobileSidebar?: () => void;
  actions?: React.ReactNode;
}

/** Título de cada pantalla del panel, con sus acciones a la derecha. */
export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6 sm:pt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#222A21] leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-[#6F7D6D] mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
