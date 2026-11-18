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
  Menu,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { CanindevsCredit } from '../common/CanindevsCredit';

type Perm = 'dashboard' | 'analytics' | 'lines' | 'products' | 'colors' | 'company' | 'users';

interface Item {
  label: string;
  help?: string;
  path: string;
  icon: React.ElementType;
  perms: Perm[];
}

const HOME: Item = { label: 'Inicio', path: '/admin/dashboard', icon: Home, perms: ['dashboard'] };
const ORDERS: Item = { label: 'Pedidos', path: '/admin/pedidos', icon: ShoppingBag, perms: ['dashboard'] };
const WORKS: Item = { label: 'Trabajos', path: '/admin/trabajos', icon: Camera, perms: ['products'] };

/** Lo que se despliega en "Catálogo". */
const CATALOG_ITEMS: Item[] = [
  { label: 'Productos', help: 'Las macetas del catálogo', path: '/admin/productos', icon: Package, perms: ['products'] },
  { label: 'Líneas', help: 'Las colecciones', path: '/admin/lineas', icon: Layers, perms: ['lines'] },
  { label: 'Colores y acabados', help: 'La paleta de colores', path: '/admin/colores', icon: Palette, perms: ['colors', 'products'] },
];

/** Lo que se despliega en "Más". */
const MORE_ITEMS: Item[] = [
  { label: 'Reportes', help: 'Visitas y ventas', path: '/admin/reportes', icon: BarChart3, perms: ['analytics'] },
  { label: 'Datos de la empresa', help: 'Logo, portada y contacto', path: '/admin/empresa', icon: Building2, perms: ['company'] },
  { label: 'WhatsApp y pedidos', help: 'Conexión y mensajes', path: '/admin/whatsapp', icon: MessageCircle, perms: ['company'] },
  { label: 'Usuarios y accesos', help: 'Quién entra al panel', path: '/admin/usuarios', icon: Users, perms: ['users'] },
];

/** Lo que se despliega en "Crear". */
const CREATE_ITEMS: Item[] = [
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

const onPath = (pathname: string, path: string) => {
  const base = path.split('?')[0];
  return pathname === base || pathname.startsWith(`${base}/`) || (base === '/admin/dashboard' && /^\/admin\/?$/.test(pathname));
};

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

const Badge: React.FC<{ count: number; className?: string }> = ({ count, className = '' }) =>
  count > 0 ? (
    <span
      className={`inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#9A5B14] text-white text-[10px] font-bold tabular-nums ${className}`}
      aria-label={`${count} pendientes`}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

/** Opciones de un menú desplegable (con ícono y ayuda). */
const MenuList: React.FC<{ items: Item[]; onPick: () => void }> = ({ items, onPick }) => {
  const { pathname } = useLocation();
  return (
    <ul className="p-1.5">
      {items.map((it) => {
        const Icon = it.icon;
        const active = !it.path.includes('?') && onPath(pathname, it.path);
        return (
          <li key={it.path}>
            <Link
              to={it.path}
              onClick={onPick}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-xl focus-visible:outline-none focus-visible:bg-[#F3EFE7] ${
                active ? 'bg-[#F3EFE7]' : 'hover:bg-[#F3EFE7]'
              }`}
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
};

/** Botón con un menú que se despliega debajo. */
const Dropdown: React.FC<{
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  align?: 'left' | 'right';
  button: (props: { open: boolean; onClick: () => void }) => React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onToggle, onClose, align = 'left', button, children }) => {
  const ref = useDismiss(open, onClose);
  return (
    <div ref={ref} className="relative">
      {button({ open, onClick: onToggle })}
      {open && (
        <div
          className={`absolute top-full mt-2 z-50 w-72 bg-white rounded-2xl border border-[#E5DFD4] shadow-[0_20px_40px_-12px_rgba(34,42,33,.25)] animate-scale-up ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/** Datos de la cuenta, ver la tienda y cerrar sesión. */
const AccountBlock: React.FC<{ onPick: () => void }> = ({ onPick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
      <div className="p-1.5">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          onClick={onPick}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-[#2D3A2F] hover:bg-[#F3EFE7]"
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
          className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
      <div className="px-4 py-2.5 bg-[#1F2720] rounded-b-2xl">
        <CanindevsCredit className="w-full" />
      </div>
    </div>
  );
};

/** Grupo que se abre y cierra dentro del menú ☰ (tablet y celular). */
const AccordionGroup: React.FC<{
  label: string;
  icon: React.ElementType;
  items: Item[];
  defaultOpen: boolean;
  onPick: () => void;
}> = ({ label, icon: Icon, items, defaultOpen, onPick }) => {
  const [open, setOpen] = useState(defaultOpen);
  const { pathname } = useLocation();
  if (items.length === 0) return null;
  return (
    <div className="border-b border-[#F2ECE2]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-2 py-3.5 text-sm font-semibold text-[#222A21] cursor-pointer"
      >
        <span className="inline-flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#4A5748]" /> {label}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#6F7B6D] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-2 pl-10 flex flex-col">
          {items.map((it) => (
            <Link
              key={it.path}
              to={it.path}
              onClick={onPick}
              className={`py-2.5 px-2 rounded-lg text-sm ${
                onPath(pathname, it.path) ? 'font-semibold text-[#222A21] bg-[#F3EFE7]' : 'text-[#4A5748] hover:bg-[#F3EFE7]'
              }`}
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Barra superior.
 * Computadora: pestañas; Catálogo, Más y Crear se despliegan.
 * Tablet y celular: botón ☰ que despliega todo el menú desde arriba.
 */
export const AdminTopBar: React.FC<{ pendingOrders: number }> = ({ pendingOrders }) => {
  const { config } = useCompany();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const can = useAdminAccess();
  const [openMenu, setOpenMenu] = useState<null | 'catalog' | 'more' | 'create' | 'account'>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const catalog = CATALOG_ITEMS.filter((i) => can(i.perms));
  const more = MORE_ITEMS.filter((i) => can(i.perms));
  const create = CREATE_ITEMS.filter((i) => can(i.perms));
  const inCatalog = catalog.some((i) => onPath(pathname, i.path));
  const inMore = more.some((i) => onPath(pathname, i.path));

  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
  }, [pathname]);

  // Con el menú ☰ abierto no se desplaza la página de fondo
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const toggle = (m: 'catalog' | 'more' | 'create' | 'account') => setOpenMenu((cur) => (cur === m ? null : m));
  const close = () => setOpenMenu(null);

  const tabClass = (active: boolean, expanded = false) =>
    `inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors cursor-pointer ${
      active
        ? 'bg-[#2D3A2F] text-white font-semibold'
        : expanded
        ? 'bg-[#EDE7DC] text-[#222A21] font-medium'
        : 'text-[#4A5748] hover:bg-[#EDE7DC] font-medium'
    }`;

  const simpleTab = (it: Item, badge?: number) => {
    if (!can(it.perms)) return null;
    const active = onPath(pathname, it.path);
    const Icon = it.icon;
    return (
      <NavLink key={it.path} to={it.path} className={tabClass(active)} aria-current={active ? 'page' : undefined}>
        <Icon className="w-4 h-4" />
        {it.label}
        {badge !== undefined && <Badge count={badge} />}
      </NavLink>
    );
  };

  const drawerLink = (it: Item, badge?: number) => {
    if (!can(it.perms)) return null;
    const active = onPath(pathname, it.path);
    const Icon = it.icon;
    return (
      <Link
        key={it.path}
        to={it.path}
        onClick={() => setDrawerOpen(false)}
        aria-current={active ? 'page' : undefined}
        className="flex items-center justify-between px-2 py-3.5 border-b border-[#F2ECE2] text-sm font-semibold text-[#222A21]"
      >
        <span className="inline-flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#4A5748]" />
          <span className={active ? 'underline underline-offset-4 decoration-2' : ''}>{it.label}</span>
        </span>
        {badge !== undefined && <Badge count={badge} />}
      </Link>
    );
  };

  const chevron = (open: boolean) => <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E2D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* ☰ en tablet y celular */}
            <button
              type="button"
              onClick={() => setDrawerOpen((o) => !o)}
              aria-expanded={drawerOpen}
              aria-controls="admin-drawer"
              className={`lg:hidden inline-flex items-center gap-2 h-10 px-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
                drawerOpen ? 'bg-[#2D3A2F] text-white' : 'bg-[#F3EFE7] text-[#2D3A2F]'
              }`}
            >
              {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="hidden sm:inline">Menú</span>
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 shrink-0">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-[#E5DFD4]" />
              ) : (
                <span className="w-9 h-9 rounded-xl bg-[#2D3A2F] text-[#C4D1B8] hidden sm:grid place-items-center">
                  <Sparkles className="w-5 h-5" />
                </span>
              )}
              <span className="font-serif text-lg font-bold tracking-[0.18em] text-[#222A21]">{config.storeName || 'TERRA'}</span>
            </Link>
          </div>

          {/* Pestañas (computadora) */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Secciones del panel">
            {simpleTab(HOME)}
            {simpleTab(ORDERS, pendingOrders)}
            {catalog.length > 0 && (
              <Dropdown
                open={openMenu === 'catalog'}
                onToggle={() => toggle('catalog')}
                onClose={close}
                button={({ open, onClick }) => (
                  <button type="button" onClick={onClick} aria-expanded={open} className={tabClass(inCatalog, open)}>
                    <Package className="w-4 h-4" /> Catálogo {chevron(open)}
                  </button>
                )}
              >
                <MenuList items={catalog} onPick={close} />
              </Dropdown>
            )}
            {simpleTab(WORKS)}
            {more.length > 0 && (
              <Dropdown
                open={openMenu === 'more'}
                onToggle={() => toggle('more')}
                onClose={close}
                button={({ open, onClick }) => (
                  <button type="button" onClick={onClick} aria-expanded={open} className={tabClass(inMore, open)}>
                    <MoreHorizontal className="w-4 h-4" /> Más {chevron(open)}
                  </button>
                )}
              >
                <MenuList items={more} onPick={close} />
              </Dropdown>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {create.length > 0 && (
              <div className="hidden md:block">
                <Dropdown
                  open={openMenu === 'create'}
                  onToggle={() => toggle('create')}
                  onClose={close}
                  align="right"
                  button={({ open, onClick }) => (
                    <button
                      type="button"
                      onClick={onClick}
                      aria-expanded={open}
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#2D3A2F] text-white text-sm font-semibold hover:bg-[#3E4E40] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Crear {chevron(open)}
                    </button>
                  )}
                >
                  <MenuList items={create} onPick={close} />
                </Dropdown>
              </div>
            )}
            <Dropdown
              open={openMenu === 'account'}
              onToggle={() => toggle('account')}
              onClose={close}
              align="right"
              button={({ open, onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  aria-expanded={open}
                  aria-label="Cuenta"
                  className="w-10 h-10 rounded-full bg-[#2D3A2F] text-white font-bold grid place-items-center text-sm cursor-pointer hover:ring-4 hover:ring-[#EDE7DC]"
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </button>
              )}
            >
              <AccountBlock onPick={close} />
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Menú ☰ desplegado (tablet y celular) */}
      {drawerOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-16 z-30 bg-[#141814]/35 animate-fade-in" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <nav
            id="admin-drawer"
            aria-label="Menú del panel"
            className="lg:hidden absolute inset-x-0 top-full z-40 bg-white border-b border-[#E8E2D6] shadow-[0_24px_40px_-20px_rgba(0,0,0,.35)] max-h-[calc(100dvh-4rem)] overflow-y-auto animate-admin-drop"
          >
            <div className="max-w-3xl mx-auto px-4 sm:px-8 pb-4">
              {drawerLink(HOME)}
              {drawerLink(ORDERS, pendingOrders)}
              <AccordionGroup label="Catálogo" icon={Package} items={catalog} defaultOpen={inCatalog || !inMore} onPick={() => setDrawerOpen(false)} />
              {drawerLink(WORKS)}
              <AccordionGroup label="Más" icon={MoreHorizontal} items={more} defaultOpen={inMore} onPick={() => setDrawerOpen(false)} />
              {create.length > 0 && (
                <div className="md:hidden pt-4">
                  <span className="block px-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-[#7D8B7A]">Crear</span>
                  <MenuList items={create} onPick={() => setDrawerOpen(false)} />
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
};

/** Celular: barra de abajo con Inicio, Pedidos, "+" para crear, Catálogo y Trabajos. */
export const AdminBottomBar: React.FC<{ pendingOrders: number }> = ({ pendingOrders }) => {
  const { pathname } = useLocation();
  const can = useAdminAccess();
  const [sheetOpen, setSheetOpen] = useState(false);
  const create = CREATE_ITEMS.filter((i) => can(i.perms));
  const catalogTab: Item = { ...CATALOG_ITEMS[0], label: 'Catálogo' };

  useEffect(() => setSheetOpen(false), [pathname]);

  const tab = (it: Item, badge?: number, extraMatch: string[] = []) => {
    if (!can(it.perms)) return <span key={it.path} />;
    const active = onPath(pathname, it.path) || extraMatch.some((p) => onPath(pathname, p));
    const Icon = it.icon;
    return (
      <NavLink
        key={it.path}
        to={it.path}
        aria-current={active ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center gap-1 h-full text-[10px] ${active ? 'text-[#2D3A2F] font-bold' : 'text-[#6F7B6D] font-medium'}`}
      >
        <Icon className="w-5 h-5" />
        {it.label}
        {badge !== undefined && <Badge count={badge} className="absolute top-1.5 left-1/2 ml-1" />}
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
        {tab(HOME)}
        {tab(ORDERS, pendingOrders)}
        <div className="flex items-center justify-center">
          {create.length > 0 && (
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
        {tab(catalogTab, undefined, ['/admin/lineas', '/admin/colores'])}
        {tab(WORKS)}
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
            <MenuList items={create} onPick={() => setSheetOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
