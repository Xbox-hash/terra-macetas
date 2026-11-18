import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, ScrollRestoration, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminBottomBar } from '../components/admin/AdminNav';
import { dashboardService } from '../services/orderService';
import { ShieldAlert } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar sesión y redirigir a la tienda de clientes tras 15 minutos de inactividad
  useInactivityLogout(15 * 60 * 1000);

  // Contador de pedidos pendientes junto a "Pedidos"
  const [pendingOrders, setPendingOrders] = useState(0);
  const perms = user?.permissions || ['all'];
  const canSeeOrders = perms.includes('all') || perms.includes('dashboard');
  useEffect(() => {
    if (!isAuthenticated || !canSeeOrders) return;
    let alive = true;
    const load = () =>
      dashboardService
        .getStats()
        .then((s) => alive && setPendingOrders(s.pendingOrders ?? 0))
        .catch(() => {});
    load();
    const t = window.setInterval(() => !document.hidden && load(), 60000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [isAuthenticated, canSeeOrders, location.pathname]);

  // Al cambiar de pantalla se cierra el menú del celular
  useEffect(() => setMobileSidebarOpen(false), [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1F2720] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-white/70">Cargando Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Permission verification for the active route
  const currentPath = location.pathname.toLowerCase();
  const userPermissions = user?.permissions || ['all'];
  const isSuperAdmin = userPermissions.includes('all');

  let hasPermission = true;
  if (!isSuperAdmin) {
    if (currentPath.includes('/admin/reportes') || currentPath.includes('/admin/analytics')) {
      hasPermission = userPermissions.includes('analytics');
    } else if (currentPath.includes('/admin/lineas')) {
      hasPermission = userPermissions.includes('lines');
    } else if (currentPath.includes('/admin/productos') || currentPath.includes('/admin/trabajos')) {
      hasPermission = userPermissions.includes('products');
    } else if (currentPath.includes('/admin/colores')) {
      hasPermission = userPermissions.includes('colors') || userPermissions.includes('products');
    } else if (currentPath.includes('/admin/empresa') || currentPath.includes('/admin/whatsapp')) {
      hasPermission = userPermissions.includes('company');
    } else if (currentPath.includes('/admin/usuarios')) {
      hasPermission = userPermissions.includes('users');
    } else if (currentPath === '/admin' || currentPath === '/admin/' || currentPath.includes('/admin/dashboard') || currentPath.includes('/admin/pedidos')) {
      hasPermission = userPermissions.includes('dashboard');
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F7F5F0] text-[#2C332A]">
      <ScrollRestoration />
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        pendingOrders={pendingOrders}
      />

      {/* En el celular se deja lugar para la barra de abajo */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pb-24 md:pb-0">
        {hasPermission ? (
          <Outlet context={{ openMobileSidebar: () => setMobileSidebarOpen(true) }} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#222A21] mb-2">Acceso Restringido</h2>
            <p className="text-sm text-[#6F7B6D] max-w-md mb-6">
              No disponés de permisos para acceder a esta sección. Solicitá al Administrador Principal que habilite tu acceso.
            </p>
          </div>
        )}
      </div>

      <AdminBottomBar pendingOrders={pendingOrders} onOpenMenu={() => setMobileSidebarOpen(true)} />
    </div>
  );
};
