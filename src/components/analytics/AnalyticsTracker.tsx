import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../services/analyticsService';
import { useAuth } from '../../contexts/AuthContext';

export function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname;

    // Evita chamadas duplicadas para o mesmo path consecutivo
    if (lastPathRef.current === currentPath) return;
    lastPathRef.current = currentPath;

    // Registrar o pageview de forma assíncrona
    trackPageView(currentPath, document.title, user?.id);
  }, [location.pathname, user?.id]);

  return null;
}
