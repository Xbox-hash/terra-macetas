import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// 15 minutos de inactividad
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export const useInactivityLogout = (timeoutMs: number = INACTIVITY_TIMEOUT_MS) => {
  const { logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleTimeout = async () => {
      await logout();
      navigate('/', { replace: true });
      showToast('Sesión cerrada por inactividad (15 min). Fuiste redirigido a la tienda.');
    };

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(handleTimeout, timeoutMs);
    };

    // Iniciar temporizador
    resetTimer();

    // Eventos que representan interacción del usuario
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel',
    ];

    const onUserActivity = () => {
      resetTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, onUserActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, onUserActivity);
      });
    };
  }, [isAuthenticated, logout, navigate, showToast, timeoutMs]);
};
