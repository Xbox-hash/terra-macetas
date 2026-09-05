import React, { useState } from 'react';
import { Outlet, Navigate, ScrollRestoration, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { ShieldAlert } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

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
    } else if (currentPath.includes('/admin/productos')) {
      hasPermission = userPermissions.includes('products');
    } else if (currentPath.includes('/admin/empresa')) {
      hasPermission = userPermissions.includes('company');
    } else if (currentPath.includes('/admin/usuarios')) {
      hasPermission = userPermissions.includes('users');
    } else if (currentPath === '/admin' || currentPath === '/admin/' || currentPath.includes('/admin/dashboard')) {
      hasPermission = userPermissions.includes('dashboard');
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F7F5F0] text-[#2C332A]">
      <ScrollRestoration />
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
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
    </div>
  );
};
