import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Layers, Package, Building2, Users, Settings, LogOut, Sprout, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { config } = useCompany();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const allNavItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { key: 'analytics', label: 'Reportes & BI', path: '/admin/reportes', icon: BarChart3 },
    { key: 'lines', label: 'Líneas', path: '/admin/lineas', icon: Layers },
    { key: 'products', label: 'Productos', path: '/admin/productos', icon: Package },
    { key: 'company', label: 'Datos Empresa', path: '/admin/empresa', icon: Building2 },
    { key: 'users', label: 'Usuarios / Accesos', path: '/admin/usuarios', icon: Users },
  ];

  const userPermissions = user?.permissions || ['all'];
  const hasAccess = (key: string) => {
    if (userPermissions.includes('all')) return true;
    return userPermissions.includes(key);
  };

  const navItems = allNavItems.filter((item) => hasAccess(item.key));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1F2720] text-[#E5ECE3] border-r border-[#2D392E]">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#2C382D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt={config.storeName} className="w-10 h-10 rounded-xl object-cover border border-[#3E4E40]" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#3E4E40] text-[#C4D1B8] flex items-center justify-center font-bold">
              <Sprout className="w-6 h-6 text-[#A7BA9F]" />
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="font-serif text-lg font-bold tracking-wider text-white leading-none truncate">
              {config.storeName || 'TERRA'}
            </h1>
            <span className="text-[10px] tracking-widest uppercase text-[#8CA08A] font-semibold">
              Panel Administrativo
            </span>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="md:hidden text-[#9FB09C] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#697966] px-3 mb-2 block">
          Catálogo & Gestión
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#374538] text-white shadow-xs font-semibold'
                    : 'text-[#9DB09B] hover:bg-[#28332A] hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#697966] px-3 mb-2 block">
            Acceso Rápido
          </span>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#9DB09B] hover:bg-[#28332A] hover:text-white transition-colors"
          >
            <span className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4" />
              Ver tienda pública
            </span>
          </a>
        </div>
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-[#2C382D] bg-[#1A211B]/60">
        <div className="flex items-center gap-3 mb-3 px-2">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-[#3E4E40]" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#374538] text-white font-bold flex items-center justify-center text-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrador'}</p>
            <p className="text-[11px] text-[#7E917C] truncate">{user?.email || `Rol: ${user?.role || 'Admin'}`}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors border border-rose-900/30 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
          <div className="relative w-4/5 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
