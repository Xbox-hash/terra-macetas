import React, { useState } from 'react';
import { Outlet, Navigate, ScrollRestoration } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminSidebar } from '../components/admin/AdminSidebar';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex bg-[#F7F5F0] text-[#2C332A]">
      <ScrollRestoration />
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Outlet context={{ openMobileSidebar: () => setMobileSidebarOpen(true) }} />
      </div>
    </div>
  );
};
