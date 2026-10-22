import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackSiteClick, isPublicWebsitePath } from '../../services/analyticsService';
import { isHotsiteRoute, recordCampaignPageView, recordCampaignClick } from '../../services/campaignTrackingService';
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

    if (isHotsiteRoute(currentPath)) {
      recordCampaignPageView(document.title || 'Hotsite - Um convite para levar esperança | YAH Hope');
    } else {
      trackPageView(currentPath, document.title, user?.id);
    }
  }, [location.pathname, user?.id]);

  // Rastrear cliques em botões e CTAs nas páginas públicas do site e no Hotsite da Campanha
  useEffect(() => {
    const currentPath = location.pathname;
    const onHotsite = isHotsiteRoute(currentPath);
    const onPublicSite = isPublicWebsitePath(currentPath);

    if (!onHotsite && !onPublicSite) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest('button, a') as HTMLElement | null;
      if (!clickable) return;

      const rawLabel =
        clickable.getAttribute('data-analytics-label') ||
        clickable.getAttribute('aria-label') ||
        clickable.getAttribute('title') ||
        clickable.innerText ||
        '';

      const cleanLabel = rawLabel.replace(/\s+/g, ' ').trim();
      if (!cleanLabel || cleanLabel.length < 2 || cleanLabel.length > 90) return;

      // Ignora botões puramente de fechar modal/alerta sem valor analítico
      if (['fechar', 'fechar alerta', 'x', 'abrir menu'].includes(cleanLabel.toLowerCase())) return;

      if (onHotsite) {
        recordCampaignClick(cleanLabel, 'click_cta', { auto_tracked: true });
      } else {
        trackSiteClick(cleanLabel, currentPath);
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, [location.pathname]);

  return null;
}
