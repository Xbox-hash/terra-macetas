import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, Camera, Menu, Plus, Layers, Palette, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Perm = 'dashboard' | 'analytics' | 'lines' | 'products' | 'colors' | 'company' | 'users';

export function useAdminAccess() {
  const { user } = useAuth();
  const perms = user?.permissions || ['all'];
  return (needed: Perm[]) => perms.includes('all') || needed.some((p) => perms.includes(p));
}

const CREATE_ITEMS: { label: string; help: string; path: string; icon: React.ElementType; perms: Perm[] }[] = [
  { label: 'Subir trabajo', help: 'Fotos de una instalación', path: '/admin/trabajos/nuevo', icon: Camera, perms: ['products'] },
  { label: 'Nuevo producto', help: 'Una maceta para el catálogo', path: '/admin/productos?nuevo=1', icon: Package, perms: ['products'] },
  { label: 'Nueva línea', help: 'Una colección', path: '/admin/lineas?nuevo=1', icon: Layers, perms: ['lines'] },
  { label: 'Nuevo color', help: 'Para la paleta de acabados', path: '/admin/colores?nuevo=1', icon: Palette, perms: ['colors', 'products'] },
];

const TABS: { label: string; path: string; icon: React.ElementType; perms: Perm[]; match: string[] }[] = [
  { label: 'Inicio', path: '/admin/dashboard', icon: Home, perms: ['dashboard'], match: ['/admin/dashboard'] },
  { label: 'Pedidos', path: '/admin/pedidos', icon: ShoppingBag, perms: ['dashboard'], match: ['/admin/pedidos'] },
  {
    label: 'Catálogo',
    path: '/admin/productos',
    icon: Package,
    perms: ['products'],
    match: ['/admin/productos', '/admin/lineas', '/admin/colores', '/admin/trabajos'],
  },
];

/**
 * Celular: barra de abajo con Inicio, Pedidos, "+" para crear, Catálogo y Menú
 * (Menú abre el mismo menú lateral de siempre).
 */
export const AdminBottomBar: React.FC<{ pendingOrders: number; onOpenMenu: () => void }> = ({ pendingOrders, onOpenMenu }) => {
  const { pathname } = useLocation();
  const can = useAdminAccess();
  const [sheetOpen, setSheetOpen] = useState(false);
  const createItems = CREATE_ITEMS.filter((i) => can(i.perms));
  const tabs = TABS.filter((t) => can(t.perms));

  useEffect(() => setSheetOpen(false), [pathname]);

  const tab = (t: (typeof TABS)[number]) => {
    const active = t.match.some((m) => pathname.startsWith(m)) || (t.path === '/admin/dashboard' && /^\/admin\/?$/.test(pathname));
    const Icon = t.icon;
    return (
      <NavLink
        key={t.path}
        to={t.path}
        aria-current={active ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center gap-1 h-full text-[10px] ${active ? 'text-[#2D3A2F] font-bold' : 'text-[#6F7B6D] font-medium'}`}
      >
        <Icon className="w-5 h-5" />
        {t.label}
        {t.path === '/admin/pedidos' && pendingOrders > 0 && (
          <span className="absolute top-1.5 left-1/2 ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold grid place-items-center tabular-nums">
            {pendingOrders > 99 ? '99+' : pendingOrders}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <>
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[#E8E2D6] grid grid-cols-5 h-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', boxSizing: 'content-box' }}
        aria-label="Accesos rápidos del panel"
      >
        {tabs.slice(0, 2).map(tab)}
        {tabs.length < 2 && <span />}
        <div className="flex items-center justify-center">
          {createItems.length > 0 && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="w-14 h-14 -mt-7 rounded-full bg-[#2D3A2F] text-white grid place-items-center shadow-[0_8px_20px_-4px_rgba(45,58,47,.5)] active:scale-95 transition-transform cursor-pointer"
              aria-label="Crear"
            >
              <Plus className="w-7 h-7" />
            </button>
          )}
        </div>
        {tabs.slice(2).map(tab)}
        {tabs.length < 3 && <span />}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center gap-1 h-full text-[10px] text-[#6F7B6D] font-medium cursor-pointer"
        >
          <Menu className="w-5 h-5" /> Menú
        </button>
      </nav>

      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Crear">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl animate-quickview" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-1">
              <span className="font-serif text-xl font-semibold text-[#222A21]">Crear</span>
              <button type="button" onClick={() => setSheetOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-[#F3EFE7]" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="py-1.5">
              {createItems.map((it) => {
                const Icon = it.icon;
                return (
                  <li key={it.path}>
                    <Link to={it.path} onClick={() => setSheetOpen(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F3EFE7]">
                      <span className="w-9 h-9 rounded-lg bg-[#EDE7DC] text-[#2D3A2F] grid place-items-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[#222A21]">{it.label}</span>
                        <span className="block text-[11px] text-[#6F7B6D]">{it.help}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
