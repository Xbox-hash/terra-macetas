import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../contexts/ToastContext';
import { CanindevsCredit } from '../../components/common/CanindevsCredit';
import { workService, workTitle } from '../../services/workService';
import { usePrefersReducedMotion } from '../../hooks/useSlideshow';

interface Backdrop {
  src: string;
  eyebrow?: string;
  title?: string;
}

const SLIDE_MS = 6000;

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
  const reducedMotion = usePrefersReducedMotion();
  const emailRef = useRef<HTMLInputElement>(null);

  // Fotos de fondo: trabajos destacados; si no hay, las fotos de portada de la tienda
  const [workSlides, setWorkSlides] = useState<Backdrop[]>([]);
  useEffect(() => {
    workService.getAll({ onlyFeatured: true }).then((works) => {
      setWorkSlides(
        works
          .filter((w) => w.images[0])
          .slice(0, 6)
          .map((w) => ({ src: w.images[0], ...workTitle(w) }))
      );
    });
  }, []);

  const slides = useMemo<Backdrop[]>(() => {
    if (workSlides.length > 0) return workSlides;
    const fallback = [...(config.heroImages ?? []), config.heroImageUrl, config.philosophyImageUrl].filter(Boolean) as string[];
    return [...new Set(fallback)].slice(0, 6).map((src) => ({ src }));
  }, [workSlides, config.heroImages, config.heroImageUrl, config.philosophyImageUrl]);

  // Capas para la transición "cortina": la nueva barre de derecha a izquierda sobre la anterior
  const [layers, setLayers] = useState<{ key: number; idx: number }[]>([{ key: 0, idx: 0 }]);
  const nextKey = useRef(1);
  const current = layers[layers.length - 1]?.idx ?? 0;

  useEffect(() => {
    setLayers([{ key: nextKey.current++, idx: 0 }]);
  }, [slides.length]);

  useEffect(() => {
    if (reducedMotion || slides.length < 2) return;
    const t = window.setInterval(() => {
      if (document.hidden) return;
      setLayers((prev) => {
        const idx = ((prev[prev.length - 1]?.idx ?? 0) + 1) % slides.length;
        return [...prev.slice(-1), { key: nextKey.current++, idx }];
      });
    }, SLIDE_MS);
    return () => window.clearInterval(t);
  }, [slides.length, reducedMotion]);

  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

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
      showToast(`¡Hola! Bienvenido al panel de ${config.storeName || 'TERRA'}.`);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión. Revisá el usuario y la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  const caption = slides[current];

  return (
    <div className="relative min-h-[100dvh] bg-[#1F2720] flex flex-col md:items-center md:justify-center lg:items-end lg:pr-[7vw] overflow-hidden">
      {/* Fotos de fondo */}
      <div className="absolute inset-0" aria-hidden="true">
        {slides.length > 0 &&
          layers.map((l, i) => (
            <div
              key={l.key}
              className={`absolute inset-0 overflow-hidden ${i > 0 ? 'login-curtain' : ''}`}
              onAnimationEnd={() => setLayers((prev) => prev.filter((x) => x.key >= l.key))}
            >
              <img src={slides[l.idx]?.src} alt="" className="w-full h-full object-cover animate-ken-burns" />
            </div>
          ))}
      </div>
      {/* Velo para que todo se lea sobre cualquier foto */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#141A15]/30 via-[#141A15]/20 to-[#141A15]/70 md:bg-[#141A15]/45 lg:bg-gradient-to-r lg:from-[#141A15]/20 lg:via-[#141A15]/35 lg:to-[#141A15]/70" />

      {/* Logo sobre la foto (celular) */}
      <Link to="/" className="relative z-10 md:hidden px-6 pt-8 font-serif text-xl font-bold tracking-[0.22em] text-white">
        {config.storeName || 'TERRA'}
      </Link>

      {/* De quién es el trabajo de la foto (computadora) */}
      {caption?.title && (
        <div key={current} className="hidden lg:block absolute left-10 bottom-10 z-10 text-white max-w-md animate-fade-in-up">
          <span className="block text-[11px] uppercase tracking-widest opacity-80">{caption.eyebrow}</span>
          <span className="block font-serif text-3xl font-semibold leading-tight">{caption.title}</span>
        </div>
      )}

      {/* Formulario */}
      <div
        className="relative z-10 mt-auto md:mt-0 w-full md:w-[400px] bg-[#FAF8F5] rounded-t-3xl md:rounded-3xl shadow-[0_24px_60px_-12px_rgba(0,0,0,.45)] px-6 pt-7 sm:px-9 sm:pt-9 animate-fade-in-up"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="hidden md:flex items-center gap-2.5 mb-6">
          {config.logoUrl && <img src={config.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />}
          <span className="font-serif text-xl font-bold tracking-[0.22em] text-[#222A21]">{config.storeName || 'TERRA'}</span>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#5E725F]">Panel administrativo</span>
        <h1 className="font-serif text-3xl font-semibold text-[#222A21] mt-1 mb-6">Hola de nuevo</h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="login-user" className="block text-xs font-semibold text-[#475446]">
              Usuario o correo
            </label>
            <input
              ref={emailRef}
              id="login-user"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin o admin@terra.com"
              aria-invalid={!!error}
              className="w-full h-12 px-3.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-pass" className="block text-xs font-semibold text-[#475446]">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-pass"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={onPasswordKey}
                onKeyDown={onPasswordKey}
                placeholder="••••••••"
                aria-invalid={!!error}
                aria-describedby={capsLock ? 'login-caps' : undefined}
                className="w-full h-12 pl-3.5 pr-20 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-[#5A6757] hover:text-[#2D3A2F] hover:bg-[#F3EFE7] cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {capsLock && (
              <p id="login-caps" className="text-xs text-[#9A5B14]">
                Bloq Mayús está activado.
              </p>
            )}
          </div>

          <label htmlFor="login-remember" className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              id="login-remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-[#C9C1B2] text-[#2D3A2F] focus:ring-[#2D3A2F]"
            />
            <span className="text-sm text-[#2D3A2F]">Mantener la sesión iniciada en este equipo</span>
          </label>

          {error && (
            <p role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#2D3A2F] text-[#FAF8F5] text-sm font-semibold hover:bg-[#3E4E40] disabled:opacity-60 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Ingresar
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E8E2D5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link to="/" className="text-xs font-semibold text-[#5A6757] hover:text-[#222A21]">
            ← Volver a la tienda
          </Link>
          <span className="rounded-full bg-[#1F2720] px-3 py-1.5">
            <CanindevsCredit />
          </span>
        </div>
      </div>
    </div>
  );
};
