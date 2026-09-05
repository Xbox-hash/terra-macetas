import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Sprout, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/common/FormInput';
import { STORE_CONFIG } from '../../data/mockData';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@terra.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, remember);
      showToast('¡Bienvenido al panel administrativo de TERRA!');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E261F] flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#374538] text-[#D0DEC7] flex items-center justify-center shadow-lg mx-auto">
              <Sprout className="w-7 h-7 text-[#A9BCA1]" />
            </div>
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-wider text-white">
              {STORE_CONFIG.storeName}
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#8CA08A] font-semibold mt-1">
              Acceso a Administración
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#FAF8F5] rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#D5CDC0] space-y-6">
          <div className="border-b border-[#E8E2D5] pb-4">
            <h2 className="font-serif text-xl font-bold text-[#222A21]">Iniciar Sesión</h2>
            <p className="text-xs text-[#6F7B6D] mt-0.5">
              Ingresá tus credenciales para administrar el catálogo y líneas.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FormInput
                label="Correo Electrónico"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@terra.com"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E8B7C] hover:text-[#2D3A2F]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#596657]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded text-[#2D3A2F] focus:ring-[#2D3A2F] border-[#D9D3C7]"
                />
                <span>Recordarme</span>
              </label>

              <span className="text-[11px] text-[#7E8B7C]">Credenciales mock listas</span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Ingresar al Dashboard
              </Button>
            </div>
          </form>

          {/* Quick Demo Help */}
          <div className="p-3 bg-[#EDE7DC] rounded-xl text-[11px] text-[#556253] space-y-1">
            <p className="font-semibold text-[#2D3A2F]">💡 Datos de prueba precargados:</p>
            <p><strong>Email:</strong> admin@terra.com</p>
            <p><strong>Contraseña:</strong> admin123</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-[#95A893] hover:text-white transition-colors">
            ← Volver a la tienda pública
          </Link>
        </div>
      </div>
    </div>
  );
};
