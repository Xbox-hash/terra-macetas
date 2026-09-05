import React, { useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Header } from '../components/public/Header';
import { Footer } from '../components/public/Footer';
import { CartDrawer } from '../components/public/CartDrawer';
import { dashboardService } from '../services/orderService';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Record visit metrics automatically on route change
    dashboardService.recordVisit(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2C332A]">
      <ScrollRestoration />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};
