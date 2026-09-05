import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Sprout } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCompany } from '../../contexts/CompanyContext';

export const Header: React.FC = () => {
  const { totalItems, openCartDrawer } = useCart();
  const { config } = useCompany();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Líneas', path: '/#lineas' },
    { name: 'Catálogo', path: '/catalogo' },
    { name: 'Contacto', path: '/contacto' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF8F5]/90 backdrop-blur-md shadow-xs border-b border-[#EDE7DC]'
          : 'bg-[#FAF8F5] border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.storeName} className="w-10 h-10 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2D3A2F] text-[#FAF8F5] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-xs">
                <Sprout className="w-5 h-5 text-[#C4D1B8]" />
              </div>
            )}
            <div>
              <span className="font-serif text-2xl font-bold tracking-wider text-[#2D3A2F] block leading-none">
                {config.storeName || 'TERRA'}
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#6C7969] font-medium block mt-0.5">
                {config.tagline || 'Macetas & Botánica'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors py-1 relative ${
                    isActive && link.path !== '/#lineas'
                      ? 'text-[#2D3A2F] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#2D3A2F]'
                      : 'text-[#546151] hover:text-[#2D3A2F]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={openCartDrawer}
              className="relative p-2.5 rounded-full text-[#2D3A2F] hover:bg-[#EAE4D7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D3A2F] cursor-pointer"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-[#4A5D4E] text-white text-[11px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-in zoom-in shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-[#2D3A2F] hover:bg-[#EAE4D7] transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EDE7DC] bg-[#FAF8F5] px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-base font-medium text-[#2D3A2F] hover:bg-[#F0EBE0] transition-colors"
            >
              {link.name}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};
