import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  Package,
  Camera,
  MoreHorizontal,
  Plus,
  BarChart3,
  Building2,
  MessageCircle,
  Users,
  ExternalLink,
  LogOut,
  Layers,
  Palette,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { CanindevsCredit } from '../common/CanindevsCredit';

type Perm = 'dashboard' | 'analytics' | 'lines' | 'products' | 'colors' | 'company' | 'users';

interface Section {
  key: string;
  label: string;
  path: string;
  icon: React.ElementType;
  perms: Perm[];
  /** Rutas que también marcan la pestaña como activa. */
  match: string[];
}

/** Las mismas secciones en todas las pantallas: arriba en compu y tablet, abajo en el celular. */
const SECTIONS: Section[] = [
  { key: 'home', label: 'Inicio', path: '/admin/dashboard', icon: Home, perms: ['dashboard'], match: ['/admin/dashboard'] },
  { key: 'orders', label: 'Pedidos', path: '/admin/pedidos', icon: ShoppingBag, perms: ['dashboard'], match: ['/admin/pedidos'] },
  {
    key: 'catalog',
    label: 'Catálogo',
    path: '/admin/productos',
    icon: Package,
    perms: ['products', 'lines', 'colors'],
    match: ['/admin/productos', '/admin/lineas', '/admin/colores'],
  },
  { key: 'works', label: 'Trabajos', path: '/admin/trabajos', icon: Camera, perms: ['products'], match: ['/admin/trabajos'] },
];

/** Pestañas dentro de Catálogo. */
export const CATALOG_TABS: { label: string; path: string; icon: React.ElementType; perms: Perm[] }[] = [
  { label: 'Productos', path: '/admin/productos', icon: Package, perms: ['products'] },
  { label: 'Líneas', path: '/admin/lineas', icon: Layers, perms: ['lines'] },
  { label: 'Colores', path: '/admin/colores', icon: Palette, perms: ['colors', 'products'] },
];

const MORE_ITEMS: { label: string; path: string; icon: React.ElementType; perms: Perm[] }[] = [
  { label: 'Reportes', path: '/admin/reportes', icon: BarChart3, perms: ['analytics'] },
  { label: 'Datos de la empresa', path: '/admin/empresa', icon: Building2, perms: ['company'] },
  { label: 'WhatsApp y pedidos', path: '/admin/whatsapp', icon: MessageCircle, perms: ['company'] },
  { label: 'Usuarios y accesos', path: '/admin/usuarios', icon: Users, perms: ['users'] },
];

const CREATE_ITEMS: { label: string; help: string; path: string; icon: React.ElementType; perms: Perm[] }[] = [
  { label: 'Subir trabajo', help: 'Fotos de una instalación', path: '/admin/trabajos/nuevo', icon: Camera, perms: ['products'] },
  { label: 'Nuevo producto', help: 'Una maceta para el catálogo', path: '/admin/productos?nuevo=1', icon: Package, perms: ['products'] },
  { label: 'Nueva línea', help: 'Una colección', path: '/admin/lineas?nuevo=1', icon: Layers, perms: ['lines'] },
  { label: 'Nuevo color', help: 'Para la paleta de acabados', path: '/admin/colores?nuevo=1', icon: Palette, perms: ['colors', 'products'] },
];

export function useAdminAccess() {
  const { user } = useAuth();
  const perms = user?.permissions || ['all'];
  return (needed: Perm[]) => perms.includes('all') || needed.some((p) => perms.includes(p));
}

/** Cierra al tocar afuera o con Escape. */
function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

const isActive = (pathname: string, s: Section) =>
  s.match.some((m) => pathname === m || pathname.startsWith(`${m}/`)) || (s.key === 'home' && (pathname === '/admin' || pathname === '/admin/'));

const Badge: React.FC<{ count: number; className?: string }> = ({ count, className = '' }) =>
  count > 0 ? (
    <span
      className={`inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#9A5B14] text-white text-[10px] font-bold tabular-nums ${className}`}
      aria-label={`${count} pendientes`}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

/** Lista de opciones de un menú desplegable. */
const MenuList: React.FC<{
  items: { label: string; help?: string; path: string; icon: React.ElementType }[];
  onPick: () => void;
}> = ({ items, onPick }) => (
  <ul className="py-1.5">
    {items.map((it) => {
      const Icon = it.icon;
      return (
        <li key={it.path}>
          <Link
            to={it.path}
            onClick={onPick}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F3EFE7] focus-visible:bg-[#F3EFE7] focus-visible:outline-none"
          >
            <span className="w-8 h-8 rounded-lg bg-[#EDE7DC] text-[#2D3A2F] grid place-items-center shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[#222A21]">{it.label}</span>
              {it.help && <span className="block text-[11px] text-[#6F7B6D]">{it.help}</span>}
            </span>
          </Link>
        </li>
      );
    })}
  </ul>
);

/** Menú de "Más" y de la cuenta (ajustes, ver tienda, cerrar sesión). */
const AccountMenu: React.FC<{ onPick: () => void }> = ({ onPick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const can = useAdminAccess();
  const items = MORE_ITEMS.filter((i) => can(i.perms));

  return (
    <div>
      <div className="px-4 py-3 border-b border-[#EFE9DE] flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-[#2D3A2F] text-white font-bold grid place-items-center text-sm shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#222A21] truncate">{user?.name || 'Administrador'}</span>
          <span className="block text-[11px] text-[#6F7B6D] truncate">{user?.email}</span>
        </span>
      </div>
      {items.length > 0 && <MenuList items={items} onPick={onPick} />}
      <div className="border-t border-[#EFE9DE] py-1.5">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          onClick={onPick}
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#2D3A2F] hover:bg-[#F3EFE7]"
        >
          <ExternalLink className="w-4 h-4" /> Ver la tienda
        </a>
        <button
          type="button"
          onClick={async () => {
            onPick();
            await logout();
            navigate('/admin/login');
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
      <div className="px-4 py-2.5 border-t border-[#EFE9DE] bg-[#1F2720] rounded-b-2xl">
        <CanindevsCredit className="w-full" />
      </div>
    </div>
  );
};

const Dropdown: React.FC<{
  open: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
  trigger: React.ReactNode;
}> = ({ open, onClose, align = 'right', className = '', children, trigger }) => {
  const ref = useDismiss(open, onClose);
  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div
          className={`absolute top-full mt-2 z-50 w-72 bg-white rounded-2xl border border-[#E5DFD4] shadow-[0_20px_40px_-12px_rgba(34,42,33,.25)] animate-scale-up ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          } ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/** Barra superior: logo, pestañas, Crear y cuenta. En tablet las pestañas pasan a una segunda fila. */
export const AdminTopBar: React.FC<{ pendingOrders: number }> = ({ pendingOrders }) => {
  const { config } = useCompany();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const can = useAdminAccess();
  const [createOpen, setCreateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const sections = SECTIONS.filter((s) => can(s.perms));
  const createItems = CREATE_ITEMS.filter((i) => can(i.perms));
  const moreItems = MORE_ITEMS.filter((i) => can(i.perms));

  useEffect(() => {
    setCreateOpen(false);
    setMoreOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const tabs = (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none" aria-label="Secciones del panel">
      {sections.map((s) => {
        const active = isActive(pathname, s);
        const Icon = s.icon;
        return (
          <NavLink
            key={s.key}
            to={s.path}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              active ? 'bg-[#2D3A2F] text-white font-semibold' : 'text-[#4A5748] hover:bg-[#EDE7DC] font-medium'
            }`}
          >
            <Icon className="w-4 h-4" />
            {s.label}
            {s.key === 'orders' && <Badge count={pendingOrders} />}
          </NavLink>
        );
      })}
      {moreItems.length > 0 && (
        <Dropdown
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          align="left"
          trigger={
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap font-medium cursor-pointer transition-colors ${
                moreItems.some((i) => pathname.startsWith(i.path)) ? 'bg-[#2D3A2F] text-white' : 'text-[#4A5748] hover:bg-[#EDE7DC]'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" /> Más <ChevronDown className="w-3.5 h-3.5" />
            </button>
          }
        >
          <MenuList items={moreItems} onPick={() => setMoreOpen(false)} />
        </Dropdown>
      )}
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E2D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 shrink-0">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-[#E5DFD4]" />
            ) : (
              <span className="w-9 h-9 rounded-xl bg-[#2D3A2F] text-[#C4D1B8] grid place-items-center">
                <Sparkles className="w-5 h-5" />
              </span>
            )}
            <span className="font-serif text-lg font-bold tracking-[0.18em] text-[#222A21]">{config.storeName || 'TERRA'}</span>
          </Link>

          {/* Pestañas en la misma fila solo en pantallas anchas */}
          <div className="hidden lg:block min-w-0">{tabs}</div>

          <div className="flex items-center gap-2">
            {createItems.length > 0 && (
              <div className="hidden md:block">
                <Dropdown
                  open={createOpen}
                  onClose={() => setCreateOpen(false)}
                  trigger={
                    <button
                      type="button"
                      onClick={() => setCreateOpen((o) => !o)}
                      aria-expanded={createOpen}
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#2D3A2F] text-white text-sm font-semibold hover:bg-[#3E4E40] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Crear
                    </button>
                  }
                >
                  <MenuList items={createItems} onPick={() => setCreateOpen(false)} />
                </Dropdown>
              </div>
            )}
            <Dropdown
              open={accountOpen}
              onClose={() => setAccountOpen(false)}
              trigger={
                <button
                  type="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-expanded={accountOpen}
                  aria-label="Cuenta y ajustes"
                  className="w-10 h-10 rounded-full bg-[#2D3A2F] text-white font-bold grid place-items-center text-sm cursor-pointer hover:ring-4 hover:ring-[#EDE7DC]"
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </button>
              }
            >
              <AccountMenu onPick={() => setAccountOpen(false)} />
            </Dropdown>
          </div>
        </div>

        {/* Tablet: las mismas pestañas en una segunda fila */}
        <div className="hidden md:block lg:hidden pb-2.5">{tabs}</div>
      </div>
    </header>
  );
};

/** Pestañas de Catálogo (Productos, Líneas, Colores), debajo de la barra superior. */
export const CatalogTabs: React.FC = () => {
  const can = useAdminAccess();
  const tabs = CATALOG_TABS.filter((t) => can(t.perms));
  if (tabs.length < 2) return null;
  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-4">
      <nav className="inline-flex p-1 rounded-xl bg-[#EDE7DC] gap-1 max-w-full overflow-x-auto scrollbar-none" aria-label="Catálogo">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <NavLink
              key={t.path}
              to={t.path}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'bg-white text-[#222A21] shadow-xs' : 'text-[#5A6757] hover:text-[#222A21]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

/** Celular: las mismas secciones abajo, con "+" al centro para crear. */
export const AdminBottomBar: React.FC<{ pendingOrders: number }> = ({ pendingOrders }) => {
  const { pathname } = useLocation();
  const can = useAdminAccess();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sections = SECTIONS.filter((s) => can(s.perms));
  const createItems = CREATE_ITEMS.filter((i) => can(i.perms));

  useEffect(() => setSheetOpen(false), [pathname]);

  // Con el "+" al centro: dos secciones a cada lado
  const left = sections.slice(0, 2);
  const right = sections.slice(2, 4);

  const item = (s: Section) => {
    const active = isActive(pathname, s);
    const Icon = s.icon;
    return (
      <NavLink
        key={s.key}
        to={s.path}
        aria-current={active ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center gap-1 h-full text-[10px] ${
          active ? 'text-[#2D3A2F] font-bold' : 'text-[#6F7B6D] font-medium'
        }`}
      >
        <Icon className="w-5 h-5" />
        {s.label}
        {s.key === 'orders' && <Badge count={pendingOrders} className="absolute top-1.5 left-1/2 ml-1" />}
      </NavLink>
    );
  };

  return (
    <>
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[#E8E2D6] grid grid-cols-5 h-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', boxSizing: 'content-box' }}
        aria-label="Secciones del panel"
      >
        {left.map(item)}
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
        {right.map(item)}
      </nav>

      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Crear">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setSheetOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl animate-quickview"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-1">
              <span className="font-serif text-xl font-semibold text-[#222A21]">Crear</span>
              <button type="button" onClick={() => setSheetOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-[#F3EFE7]" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <MenuList items={createItems} onPick={() => setSheetOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
