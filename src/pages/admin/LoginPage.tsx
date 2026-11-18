import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { CanindevsCredit } from '../../components/common/CanindevsCredit';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const { config } = useCompany();
  const { showToast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Completá el usuario y la contraseña.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password, remember);
      showToast(`¡Bienvenido al panel administrativo de ${config.storeName || 'TERRA'}!`);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión. Revisá el usuario y la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // Avisa si Bloq Mayús está activado mientras se escribe la contraseña
  const onPasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

  return (
    <div className="min-h-[100dvh] bg-[#1E261F] flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="text-center mb-8 space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={config.storeName}
                className="w-14 h-14 rounded-2xl object-cover border border-[#3E4E40] shadow-lg mx-auto"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#374538] text-[#D0DEC7] flex items-center justify-center shadow-lg mx-auto">
                <Sparkles className="w-7 h-7 text-[#A9BCA1]" />
              </div>
            )}
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-wider text-white">{config.storeName || 'TERRA'}</h1>
            <p className="text-xs uppercase tracking-widest text-[#8CA08A] font-semibold mt-1">Acceso a Administración</p>
          </div>
        </div>

        {/* Tarjeta de inicio de sesión */}
        <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-10 shadow-2xl border border-[#D5CDC0] space-y-6">
          <div className="border-b border-[#E8E2D5] pb-4">
            <h2 className="font-serif text-xl font-bold text-[#222A21]">Iniciar Sesión</h2>
            <p className="text-xs text-[#6F7B6D] mt-0.5">Ingresá tus credenciales para administrar el catálogo y los pedidos.</p>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5 text-left">
              <label htmlFor="login-user" className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                Usuario o Correo Electrónico
              </label>
              <input
                id="login-user"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: admin o admin@terra.com"
                aria-invalid={!!error}
                className="w-full h-12 px-3.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label htmlFor="login-pass" className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onPasswordKey}
                  onKeyUp={onPasswordKey}
                  placeholder="••••••••"
                  aria-invalid={!!error}
                  aria-describedby={capsLock ? 'login-caps' : undefined}
                  className="w-full h-12 pl-3.5 pr-12 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 rounded-lg text-[#7E8B7C] hover:text-[#2D3A2F] cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {capsLock && (
                <p id="login-caps" className="text-xs text-amber-700">
                  Bloq Mayús está activado.
                </p>
              )}
            </div>

            <label htmlFor="login-remember" className="flex items-center gap-2.5 cursor-pointer select-none py-1">
              <input
                id="login-remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[#C9C1B2] text-[#2D3A2F] focus:ring-[#2D3A2F]"
              />
              <span className="text-sm text-[#2D3A2F]">Mantener la sesión iniciada en este equipo</span>
            </label>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Ingresar al Panel
              </Button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-[#95A893] hover:text-white transition-colors">
            ← Volver a la tienda pública
          </Link>
        </div>

        <div className="text-center mt-8">
          <CanindevsCredit />
        </div>
      </div>
    </div>
  );
};
