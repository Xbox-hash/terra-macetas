import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { CatalogPage } from '../pages/public/CatalogPage';
import { ProductDetailPage } from '../pages/public/ProductDetailPage';
import { CartPage } from '../pages/public/CartPage';
import { ContactPage } from '../pages/public/ContactPage';

// Admin Pages
import { LoginPage } from '../pages/admin/LoginPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { LinesAdminPage } from '../pages/admin/LinesAdminPage';
import { ProductsAdminPage } from '../pages/admin/ProductsAdminPage';
import { CompanyAdminPage } from '../pages/admin/CompanyAdminPage';

export const router = createBrowserRouter([
  // Public Site routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'producto/:id', element: <ProductDetailPage /> },
      { path: 'carrito', element: <CartPage /> },
      { path: 'contacto', element: <ContactPage /> },
    ],
  },
  // Admin Login route
  {
    path: '/admin/login',
    element: <LoginPage />,
  },
  // Admin Protected Area routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'lineas', element: <LinesAdminPage /> },
      { path: 'productos', element: <ProductsAdminPage /> },
      { path: 'empresa', element: <CompanyAdminPage /> },
    ],
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
