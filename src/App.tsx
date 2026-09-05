import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { AppRouter } from './routes';

export const App: React.FC = () => {
  return (
    <CompanyProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </CompanyProvider>
  );
};

export default App;
