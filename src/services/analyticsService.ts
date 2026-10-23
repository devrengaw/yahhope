import { supabase } from '../lib/supabase';
import { isSpamOrMockUser } from '../utils/userCleanup';
import { format, subDays, isAfter, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface VisitRecord {
  id?: string;
  visitor_id: string;
  session_id: string;
  path: string;
  page_title: string;
  referrer: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  country: string;
  city: string;
  user_id?: string | null;
  created_at: string;
}

export interface SiteClickEvent {
  id?: string;
  event_type: string;
  button_label: string;
  visitor_id: string;
  session_id: string;
  path: string;
  referrer: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  city: string;
  country: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SiteLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  age_range: string;
  city: string;
  state?: string;
  country: string;
  interest_type: 'sponsor' | 'donor' | 'volunteer' | 'partner' | 'newsletter';
  interest_label: string;
  details: string;
  status: 'new' | 'contacted' | 'joined';
  source_page: string;
  origin_table: 'volunteer_applications' | 'corporate_partnerships' | 'campaign_leads' | 'users' | 'newsletter_subscribers' | 'local';
  created_at: string;
}

export interface DayMetric {
  date: string;
  formattedDate: string;
  pageviews: number;
  visitors: number;
  clicks: number;
  registrations: number;
}

export interface PageStat {
  path: string;
  title: string;
  views: number;
  uniqueViews: number;
  percentage: number;
}

export interface ButtonClickStat {
  label: string;
  path: string;
  pageTitle: string;
  count: number;
  percentage: number;
}

export interface DemographyItem {
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface GeoItem {
  name: string;
  country?: string;
  code?: string;
  flag?: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  period: 'today' | '7d' | '30d' | '90d' | 'all';
  totalPageviews: number;
  pageviewsGrowth: number;
  uniqueVisitors: number;
  visitorsGrowth: number;
  totalClicks: number;
  clickThroughRate: number;
  totalRegistrations: number;
  registrationsGrowth: number;
  conversionRate: number;
  avgDuration: string;
  bounceRate: string;
  dailyTrend: DayMetric[];
  topPages: PageStat[];
  clicksByButton: ButtonClickStat[];
  ageDistribution: DemographyItem[];
  interestsDistribution: DemographyItem[];
  userRolesDistribution: DemographyItem[];
  topCountries: GeoItem[];
  topCities: GeoItem[];
  trafficSources: DemographyItem[];
  devices: DemographyItem[];
  browsers: DemographyItem[];
  recentVisits: VisitRecord[];
  recentLeads: SiteLead[];
}

const STORAGE_KEY_VISITS = 'yah_hope_analytics_visits_cache_v2';
const STORAGE_KEY_SITE_EVENTS = 'yah_hope_site_events_cache_v1';
const STORAGE_KEY_SITE_LEAD_STATUS = 'yah_hope_site_leads_status_v1';
const STORAGE_KEY_VISITOR = 'yah_hope_analytics_visitor_id';
const STORAGE_KEY_GEO = 'yah_hope_analytics_geo_cache';

// Verifica se a rota pertence às páginas públicas do site principal (yahhope.com)
export function isPublicWebsitePath(path: string): boolean {
  if (!path) return false;
  if (typeof window !== 'undefined') {
    const host = (window.location.hostname || '').toLowerCase();
    if (host.startsWith('campanha.') || host === 'campanha.yahhope.com') {
      return false;
    }
  }
  const clean = path.split('?')[0].toLowerCase();
  if (
    clean.startsWith('/admin') ||
    clean.startsWith('/workspace') ||
    clean.startsWith('/nutrition') ||
    clean.startsWith('/communication') ||
    clean.startsWith('/portal') ||
    clean.startsWith('/app') ||
    clean === '/campanha-display' ||
    clean === '/set-password' ||
    clean === '/campanha-yahhope' ||
    clean.startsWith('/campanha-yahhope/') ||
    clean === '/hotsite' ||
    clean.startsWith('/hotsite/') ||
    clean === '/participe' ||
    clean === '/fazer-parte' ||
    clean.startsWith('/site-event/')
  ) {
    return false;
  }
  return true;
}

// Helper to get or generate persistent Visitor ID
export function getVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEY_VISITOR);
  if (!id) {
    id = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_VISITOR, id);
  }
  return id;
}

// Helper to get or generate Session ID (expires when browser is closed)
export function getSessionId(): string {
  let sId = sessionStorage.getItem('yah_hope_session_id');
  if (!sId) {
    sId = 's_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('yah_hope_session_id', sId);
  }
  return sId;
}

// Device detection
function detectDevice(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
    return 'tablet';
  }
  if (/(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds|archos)/.test(ua) || window.innerWidth < 768) {
    return 'mobile';
  }
  return 'desktop';
}

// Browser detection
function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Opera|OPR\//.test(ua)) return 'Opera';
  return 'Outro';
}

// OS detection
function detectOS(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Outro';
}

// Friendly page title mapping for all public pages of yahhope.com
export function getFriendlyPageTitle(path: string): string {
  const clean = (path || '/').split('?')[0];
  if (clean === '/') return 'Página Inicial (Home)';
  if (clean === '/sobre-nos') return 'Sobre Nós & Manifesto';
  if (clean === '/missao-visao-valores') return 'Missão, Visão e Valores';
  if (clean === '/projetos') return 'Projetos & Alcance Global';
  if (clean === '/mantenedor') return 'Seja Mantenedor / Apadrinhamento';
  if (clean === '/campanha') return 'Campanha de Doações (Régua)';
  if (clean === '/voluntariado-e-parcerias') return 'Voluntariado & Parcerias Empresariais';
  if (clean === '/blog') return 'Blog & Histórias de Esperança';
  if (clean.startsWith('/blog/')) return `Artigo do Blog (${clean.replace('/blog/', '')})`;
  if (clean === '/loja') return 'Loja Solidária';
  if (clean === '/apoiador') return 'Página do Apoiador / Apadrinhar';
  if (clean === '/politica-de-privacidade') return 'Política de Privacidade';
  if (clean === '/termos-de-servico') return 'Termos de Serviço';
  if (clean === '/finalizar-cadastro' || clean === '/cadastro-apadrinhador') return 'Cadastro de Padrinho';
  if (clean === '/login') return 'Entrar / Portal do Mantenedor';
  if (clean.startsWith('/campanha-yahhope') || clean.startsWith('/hotsite')) return 'Hotsite da Campanha';
  return clean;
}

// Detect Traffic Source (including UTM parameters and search engines)
export function detectSiteTrafficSource(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) {
      const s = utmSource.toLowerCase();
      if (s.includes('insta')) return 'Instagram';
      if (s.includes('whats') || s.includes('wpp')) return 'WhatsApp';
      if (s.includes('face') || s.includes('fb')) return 'Facebook';
      if (s.includes('google')) return 'Google';
      if (s.includes('tiktok')) return 'TikTok';
      if (s.includes('youtube') || s.includes('yt')) return 'YouTube';
      return utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
    }

    const ref = (document.referrer || '').toLowerCase();
    if (ref.includes('google')) return 'Google';
    if (ref.includes('bing') || ref.includes('yahoo') || ref.includes('duckduckgo')) return 'Buscadores';
    if (ref.includes('instagram')) return 'Instagram';
    if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
    if (ref.includes('facebook') || ref.includes('fb.')) return 'Facebook';
    if (ref.includes('tiktok')) return 'TikTok';
    if (ref.includes('linkedin')) return 'LinkedIn';
    if (ref.includes('youtube')) return 'YouTube';
    if (ref && !ref.includes(window.location.hostname)) {
      return new URL(document.referrer).hostname;
    }
  } catch {
    // ignore
  }
  return 'Direto';
}

// Geolocation with cache
async function getGeoLocation(): Promise<{ country: string; city: string; state?: string }> {
  const cached = localStorage.getItem(STORAGE_KEY_GEO);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const res = await fetch('https://ipwho.is/?fields=country,city,region,success', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const geo = {
          country: data.country || 'Brasil',
          city: data.city || 'São Paulo',
          state: data.region || 'SP'
        };
        localStorage.setItem(STORAGE_KEY_GEO, JSON.stringify(geo));
        return geo;
      }
    }
  } catch {
    // Fail silently on adblocker/sandbox/offline
  }

  // Fallback based on timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (tz.includes('Luanda') || tz.includes('Africa/Luanda')) {
    return { country: 'Angola', city: 'Luanda' };
  }
  if (tz.includes('Lisbon') || tz.includes('Europe/Lisbon')) {
    return { country: 'Portugal', city: 'Lisboa' };
  }
  if (tz.includes('Maputo') || tz.includes('Africa/Maputo')) {
    return { country: 'Moçambique', city: 'Maputo' };
  }
  return { country: 'Brasil', city: 'São Paulo', state: 'SP' };
}

// Rastrear visualização de página pública
export async function trackPageView(path: string, customTitle?: string, userId?: string): Promise<void> {
  if (!isPublicWebsitePath(path)) return;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const pageTitle = getFriendlyPageTitle(path) || customTitle || path;
  const referrer = detectSiteTrafficSource();
  const geo = await getGeoLocation();

  const visit: VisitRecord = {
    visitor_id: visitorId,
    session_id: sessionId,
    path,
    page_title: pageTitle,
    referrer,
    device,
    browser,
    os,
    country: geo.country,
    city: geo.city,
    user_id: userId || null,
    created_at: new Date().toISOString()
  };

  // 1. Save in local buffer
  try {
    const rawCache = localStorage.getItem(STORAGE_KEY_VISITS);
    const cachedList: VisitRecord[] = rawCache ? JSON.parse(rawCache) : [];
    cachedList.unshift(visit);
    if (cachedList.length > 2000) cachedList.length = 2000;
    localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(cachedList));
  } catch (err) {
    console.warn('Analytics local cache write error:', err);
  }

  // 2. Persist to Supabase in background
  try {
    await supabase.from('site_visits').insert([visit]);
  } catch {
    // Gracefully ignore if offline
  }
}

let lastClickKey = '';
let lastClickTime = 0;

// Rastrear clique em botão/CTA nas páginas públicas do site
export async function trackSiteClick(
  buttonLabel: string,
  path: string = window.location.pathname,
  eventType = 'site_click_cta',
  metadata: Record<string, any> = {}
): Promise<void> {
  if (!isPublicWebsitePath(path)) return;

  const nowMs = Date.now();
  const dedupKey = `${path}::${buttonLabel}`;
  if (dedupKey === lastClickKey && nowMs - lastClickTime < 1200) {
    return;
  }
  lastClickKey = dedupKey;
  lastClickTime = nowMs;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const referrer = detectSiteTrafficSource();
  const geo = await getGeoLocation();

  const clickEvent: SiteClickEvent = {
    event_type: eventType,
    button_label: buttonLabel,
    visitor_id: visitorId,
    session_id: sessionId,
    path,
    referrer,
    device,
    browser,
    os,
    city: geo.city,
    country: geo.country,
    metadata: {
      ...metadata,
      page_title: getFriendlyPageTitle(path)
    },
    created_at: new Date().toISOString()
  };

  // 1. Salva no cache local
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SITE_EVENTS);
    const list: SiteClickEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(clickEvent);
    if (list.length > 2500) list.length = 2500;
    localStorage.setItem(STORAGE_KEY_SITE_EVENTS, JSON.stringify(list));
  } catch (e) {
    console.warn('Erro ao salvar clique do site no cache:', e);
  }

  // 2. Persiste na tabela de eventos no Supabase (com fallback em site_visits caso campaign_events não exista)
  try {
    const { error } = await supabase.from('campaign_events').insert([clickEvent]);
    if (error) {
      await supabase.from('site_visits').insert([
        {
          visitor_id: visitorId,
          session_id: sessionId,
          path: `/site-event/click::${path}`,
          page_title: buttonLabel,
          referrer,
          device,
          browser,
          os,
          country: geo.country,
          city: geo.city,
          created_at: clickEvent.created_at
        }
      ]);
    }
  } catch {
    // Fail silently
  }
}

// Atualizar status de um cadastro/lead do site (para acompanhamento pela equipe no Admin)
export async function updateSiteLeadStatus(
  leadId: string,
  status: 'new' | 'contacted' | 'joined',
  originTable?: SiteLead['origin_table']
): Promise<boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SITE_LEAD_STATUS);
    const statusMap: Record<string, 'new' | 'contacted' | 'joined'> = raw ? JSON.parse(raw) : {};
    statusMap[leadId] = status;
    localStorage.setItem(STORAGE_KEY_SITE_LEAD_STATUS, JSON.stringify(statusMap));
  } catch {
    // ignore
  }

  try {
    if (originTable === 'volunteer_applications') {
      const dbStatus = status === 'joined' ? 'approved' : status === 'contacted' ? 'contacted' : 'pending';
      await supabase.from('volunteer_applications').update({ status: dbStatus }).eq('id', leadId);
    } else if (originTable === 'corporate_partnerships') {
      const dbStatus = status === 'joined' ? 'partnership_active' : status === 'contacted' ? 'meeting_scheduled' : 'pending';
      await supabase.from('corporate_partnerships').update({ status: dbStatus }).eq('id', leadId);
    } else if (originTable === 'campaign_leads') {
      await supabase.from('campaign_leads').update({ status }).eq('id', leadId);
    }
  } catch {
    // ignore
  }

  return true;
}

// Carrega os dados analíticos agregados das páginas públicas do site (yahhope.com)
export async function getAnalyticsData(period: 'today' | '7d' | '30d' | '90d' | 'all'): Promise<AnalyticsSummary> {
  try {
    localStorage.removeItem('yah_hope_seed_visits_v1');
  } catch {
    // ignore
  }

  // 1. Carregar visitas reais do site público (Supabase + LocalStorage)
  let allVisits: VisitRecord[] = [];
  let rawSupabaseSiteVisits: VisitRecord[] = [];
  try {
    const { data, error } = await supabase
      .from('site_visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);
      
    if (!error && data && data.length > 0) {
      rawSupabaseSiteVisits = data as VisitRecord[];
      allVisits = [...rawSupabaseSiteVisits];
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISITS);
    if (raw) {
      const localVisits: VisitRecord[] = JSON.parse(raw);
      if (Array.isArray(localVisits)) {
        allVisits = [...allVisits, ...localVisits];
      }
    }
  } catch {
    // ignore
  }

  // Filtra apenas páginas públicas do site principal e remove duplicatas
  const uniqueVisitKeys = new Set<string>();
  allVisits = allVisits.filter(v => {
    if (!v.path || !isPublicWebsitePath(v.path)) return false;
    const key = `${v.visitor_id}_${v.created_at}_${v.path}`;
    if (uniqueVisitKeys.has(key)) return false;
    uniqueVisitKeys.add(key);
    return true;
  });

  // 2. Carregar eventos de cliques nas páginas públicas do site
  let allClickEvents: SiteClickEvent[] = [];
  try {
    const { data, error } = await supabase
      .from('campaign_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3000);

    if (!error && data && data.length > 0) {
      allClickEvents = data as SiteClickEvent[];
    }
  } catch {
    // ignore
  }

  // Inclui eventos de clique salvos via fallback em site_visits
  rawSupabaseSiteVisits.forEach(v => {
    if (v.path && v.path.startsWith('/site-event/click::')) {
      const realPath = v.path.replace('/site-event/click::', '') || '/';
      allClickEvents.push({
        id: v.id,
        event_type: 'site_click_cta',
        button_label: v.page_title || 'Clique no Site',
        visitor_id: v.visitor_id,
        session_id: v.session_id,
        path: realPath,
        referrer: v.referrer || 'Direto',
        device: v.device || 'desktop',
        browser: v.browser || 'Outro',
        os: v.os || 'Outro',
        city: v.city || 'São Paulo',
        country: v.country || 'Brasil',
        created_at: v.created_at
      });
    }
  });

  try {
    const rawEvents = localStorage.getItem(STORAGE_KEY_SITE_EVENTS);
    if (rawEvents) {
      const localEvents: SiteClickEvent[] = JSON.parse(rawEvents);
      if (Array.isArray(localEvents)) {
        allClickEvents = [...allClickEvents, ...localEvents];
      }
    }
  } catch {
    // ignore
  }

  const uniqueEventKeys = new Set<string>();
  allClickEvents = allClickEvents.filter(e => {
    if (!e.path || !isPublicWebsitePath(e.path)) return false;
    if (e.event_type === 'page_view') return false;
    const key = `${e.visitor_id}_${e.created_at}_${e.button_label}`;
    if (uniqueEventKeys.has(key)) return false;
    uniqueEventKeys.add(key);
    return true;
  });

  // 3. Carregar todos os cadastros / leads / formulários enviados pelo site público
  let localStatusOverrides: Record<string, 'new' | 'contacted' | 'joined'> = {};
  try {
    const rawStatus = localStorage.getItem(STORAGE_KEY_SITE_LEAD_STATUS);
    if (rawStatus) localStatusOverrides = JSON.parse(rawStatus);
  } catch {
    // ignore
  }

  const allSiteLeads: SiteLead[] = [];

  // 3a. Voluntários (Supabase + LocalStorage)
  try {
    const { data: volData } = await supabase
      .from('volunteer_applications')
      .select('*')
      .order('created_at', { ascending: false });

    const volList: any[] = [...(volData || [])];
    try {
      const localVol = JSON.parse(localStorage.getItem('yahhope_volunteer_applications') || '[]');
      if (Array.isArray(localVol)) volList.push(...localVol);
    } catch {}

    const seenVol = new Set<string>();
    volList.forEach((v, idx) => {
      const dedup = v.id || `${v.email}_${v.phone}`;
      if (seenVol.has(dedup)) return;
      seenVol.add(dedup);

      const id = String(v.id || `vol_${idx}_${v.created_at}`);
      const mappedStatus: 'new' | 'contacted' | 'joined' =
        localStatusOverrides[id] ||
        (v.status === 'approved' ? 'joined' : v.status === 'contacted' || v.status === 'reviewed' ? 'contacted' : 'new');

      const locLabel = v.desired_location === 'mocambique' ? 'Moçambique' : v.desired_location === 'ambos' ? 'Brasil & Moçambique' : 'Brasil';
      const areas = Array.isArray(v.skills_areas) && v.skills_areas.length > 0 ? v.skills_areas.join(', ') : v.motivation || 'Voluntariado Geral';

      allSiteLeads.push({
        id,
        name: v.name || 'Voluntário',
        email: v.email || '',
        phone: v.phone || '',
        age_range: v.age_range || '25-34',
        city: v.city || 'São Paulo',
        state: v.state_country || 'Brasil',
        country: (v.state_country || '').toLowerCase().includes('moçambique') ? 'Moçambique' : 'Brasil',
        interest_type: 'volunteer',
        interest_label: `Voluntário (${locLabel})`,
        details: areas,
        status: mappedStatus,
        source_page: '/voluntariado-e-parcerias',
        origin_table: 'volunteer_applications',
        created_at: v.created_at || new Date().toISOString()
      });
    });
  } catch {
    // ignore
  }

  // 3b. Parcerias Empresariais (Supabase + LocalStorage)
  try {
    const { data: partData } = await supabase
      .from('corporate_partnerships')
      .select('*')
      .order('created_at', { ascending: false });

    const partList: any[] = [...(partData || [])];
    try {
      const localPart = JSON.parse(localStorage.getItem('yahhope_corporate_partnerships') || '[]');
      if (Array.isArray(localPart)) partList.push(...localPart);
    } catch {}

    const seenPart = new Set<string>();
    partList.forEach((p, idx) => {
      const dedup = p.id || `${p.company_name}_${p.email}`;
      if (seenPart.has(dedup)) return;
      seenPart.add(dedup);

      const id = String(p.id || `part_${idx}_${p.created_at}`);
      const mappedStatus: 'new' | 'contacted' | 'joined' =
        localStatusOverrides[id] ||
        (p.status === 'partnership_active' ? 'joined' : p.status === 'meeting_scheduled' || p.status === 'reviewed' ? 'contacted' : 'new');

      allSiteLeads.push({
        id,
        name: `${p.company_name || 'Empresa'} (${p.contact_person || 'Contato'})`,
        email: p.email || '',
        phone: p.phone || '',
        age_range: 'Corporativo (PJ)',
        city: 'Brasil',
        country: 'Brasil',
        interest_type: 'partner',
        interest_label: 'Empresa Parceira',
        details: p.proposal_details || p.partnership_type || 'Parceria Corporativa ESG',
        status: mappedStatus,
        source_page: '/voluntariado-e-parcerias',
        origin_table: 'corporate_partnerships',
        created_at: p.created_at || new Date().toISOString()
      });
    });
  } catch {
    // ignore
  }

  // 3c. Leads capturados no site (campaign_leads + inscritos em newsletter)
  try {
    const { data: cLeads } = await supabase
      .from('campaign_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (cLeads && cLeads.length > 0) {
      cLeads.forEach((l: any) => {
        const id = String(l.id);
        const mappedStatus: 'new' | 'contacted' | 'joined' =
          localStatusOverrides[id] || (l.status === 'joined' ? 'joined' : l.status === 'contacted' ? 'contacted' : 'new');

        const iType: SiteLead['interest_type'] =
          l.interest_type === 'volunteer' ? 'volunteer' :
          l.interest_type === 'partner' ? 'partner' :
          l.interest_type === 'donor' ? 'donor' : 'sponsor';

        const iLabel =
          iType === 'volunteer' ? 'Voluntariado' :
          iType === 'partner' ? 'Empresa Parceira' :
          iType === 'donor' ? 'Doação Financeira' : 'Apadrinhamento / Mantenedor';

        allSiteLeads.push({
          id,
          name: l.name || 'Interessado',
          email: l.email || '',
          phone: l.phone || '',
          age_range: l.age_range || (l.age ? `${l.age} anos` : '25-34'),
          city: l.city || 'São Paulo',
          state: l.state || '',
          country: l.country || 'Brasil',
          interest_type: iType,
          interest_label: iLabel,
          details: l.message || `Origem: ${l.source || 'Site YAH Hope'}`,
          status: mappedStatus,
          source_page: l.source || '/mantenedor',
          origin_table: 'campaign_leads',
          created_at: l.created_at || new Date().toISOString()
        });
      });
    }
  } catch {
    // ignore
  }

  // 3d. Usuários/Apoiadores cadastrados na tabela users
  let userRolesList: DemographyItem[] = [];
  try {
    const { data: rawUsersData } = await supabase
      .from('users')
      .select('id, name, email, phone, role, department, created_at')
      .order('created_at', { ascending: false });

    const usersData = (rawUsersData || []).filter((u: any) => !isSpamOrMockUser(u));

    if (usersData) {
      // Adiciona apoiadores/padrinhos na lista de cadastros do site se ainda não estiverem por e-mail
      const existingEmails = new Set(allSiteLeads.map(l => l.email.toLowerCase()).filter(Boolean));
      usersData.forEach((u: any) => {
        if (u.role === 'SPONSOR' || u.role === 'USER') {
          const emailLower = (u.email || '').toLowerCase();
          if (emailLower && existingEmails.has(emailLower)) return;
          if (emailLower) existingEmails.add(emailLower);

          const id = String(u.id);
          allSiteLeads.push({
            id,
            name: u.name || 'Mantenedor Cadastrado',
            email: u.email || '',
            phone: u.phone || '',
            age_range: '25-34',
            city: 'Brasil',
            country: 'Brasil',
            interest_type: 'sponsor',
            interest_label: 'Mantenedor / Portal',
            details: 'Conta criada no Portal do Mantenedor',
            status: localStatusOverrides[id] || 'joined',
            source_page: '/mantenedor',
            origin_table: 'users',
            created_at: u.created_at || new Date().toISOString()
          });
        }
      });

      const roleCounts = new Map<string, number>();
      usersData.forEach((u: any) => {
        const role = u.role || 'USER';
        roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
      });

      const roleLabels: Record<string, { label: string; color: string }> = {
        SPONSOR: { label: 'Padrinhos / Mantenedores', color: '#F49853' },
        USER: { label: 'Apoiadores / Membros', color: '#92BF78' },
        VOLUNTEER: { label: 'Voluntários', color: '#38BDF8' },
        ADMIN: { label: 'Administradores', color: '#0F172A' },
        STAFF: { label: 'Equipe Operacional', color: '#88A1F2' },
        COORDINATOR: { label: 'Coordenação', color: '#EBC878' },
        NURSE: { label: 'Enfermagem', color: '#EC4899' },
        DOCTOR: { label: 'Médicos', color: '#06B6D4' },
        ACS: { label: 'Agentes Comunitários', color: '#10B981' },
        SOCIAL_WORKER: { label: 'Assistentes Sociais', color: '#8B5CF6' },
        OBSERVER: { label: 'Observadores', color: '#94A3B8' }
      };

      const totalUsers = usersData.length || 1;
      userRolesList = Array.from(roleCounts.entries()).map(([roleKey, count]) => {
        const meta = roleLabels[roleKey] || { label: roleKey, color: '#64748B' };
        return {
          name: meta.label,
          count,
          percentage: Number(((count / totalUsers) * 100).toFixed(1)),
          color: meta.color
        };
      }).sort((a, b) => b.count - a.count);
    }
  } catch {
    // ignore
  }

  // Ordenar leads por data mais recente
  allSiteLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filtrar por período selecionado
  const now = new Date();
  let startDate: Date;
  let priorStartDate: Date;

  if (period === 'today') {
    startDate = startOfDay(now);
    priorStartDate = subDays(startDate, 1);
  } else if (period === '7d') {
    startDate = subDays(now, 7);
    priorStartDate = subDays(startDate, 7);
  } else if (period === '30d') {
    startDate = subDays(now, 30);
    priorStartDate = subDays(startDate, 30);
  } else if (period === '90d') {
    startDate = subDays(now, 90);
    priorStartDate = subDays(startDate, 90);
  } else {
    startDate = new Date(2020, 0, 1);
    priorStartDate = new Date(2020, 0, 1);
  }

  const filteredVisits = allVisits.filter(v => {
    try {
      return v.created_at && isAfter(parseISO(v.created_at), startDate);
    } catch {
      return false;
    }
  });

  const filteredClicks = allClickEvents.filter(e => {
    try {
      return e.created_at && isAfter(parseISO(e.created_at), startDate);
    } catch {
      return false;
    }
  });

  const filteredLeads = period === 'all'
    ? allSiteLeads
    : allSiteLeads.filter(l => {
        try {
          return l.created_at && isAfter(parseISO(l.created_at), startDate);
        } catch {
          return false;
        }
      });

  const totalPageviews = filteredVisits.length;
  const uniqueVisitors = new Set([
    ...filteredVisits.map(v => v.visitor_id),
    ...filteredClicks.map(c => c.visitor_id)
  ]).size;
  const totalClicks = filteredClicks.length;
  const totalRegistrations = filteredLeads.length;

  // Período anterior para cálculo de crescimento
  const priorVisits = period === 'all' ? [] : allVisits.filter(v => {
    try {
      const vDate = parseISO(v.created_at);
      return isAfter(vDate, priorStartDate) && !isAfter(vDate, startDate);
    } catch {
      return false;
    }
  });
  const priorLeads = period === 'all' ? [] : allSiteLeads.filter(l => {
    try {
      const lDate = parseISO(l.created_at);
      return isAfter(lDate, priorStartDate) && !isAfter(lDate, startDate);
    } catch {
      return false;
    }
  });

  const priorPageviews = priorVisits.length;
  const priorUniqueVisitors = new Set(priorVisits.map(v => v.visitor_id)).size;
  const priorRegistrations = priorLeads.length;

  const pageviewsGrowth = priorPageviews > 0
    ? Number((((totalPageviews - priorPageviews) / priorPageviews) * 100).toFixed(1))
    : (totalPageviews > 0 ? 100 : 0);

  const visitorsGrowth = priorUniqueVisitors > 0
    ? Number((((uniqueVisitors - priorUniqueVisitors) / priorUniqueVisitors) * 100).toFixed(1))
    : (uniqueVisitors > 0 ? 100 : 0);

  const registrationsGrowth = priorRegistrations > 0
    ? Number((((totalRegistrations - priorRegistrations) / priorRegistrations) * 100).toFixed(1))
    : (totalRegistrations > 0 ? 100 : 0);

  const conversionRate = uniqueVisitors > 0
    ? Number(((totalRegistrations / uniqueVisitors) * 100).toFixed(1))
    : 0;

  const clickThroughRate = totalPageviews > 0
    ? Number(((totalClicks / totalPageviews) * 100).toFixed(1))
    : 0;

  // Evolução Diária (Acessos, Visitantes, Cliques e Cadastros)
  const daysMap = new Map<string, { pageviews: number; visitorsSet: Set<string>; clicks: number; registrations: number }>();
  const daysSpan = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;

  for (let i = daysSpan - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const key = format(d, 'yyyy-MM-dd');
    daysMap.set(key, {
      pageviews: 0,
      visitorsSet: new Set<string>(),
      clicks: 0,
      registrations: 0
    });
  }

  filteredVisits.forEach(v => {
    const key = v.created_at.split('T')[0];
    if (daysMap.has(key)) {
      const entry = daysMap.get(key)!;
      entry.pageviews += 1;
      entry.visitorsSet.add(v.visitor_id);
    }
  });

  filteredClicks.forEach(c => {
    const key = c.created_at.split('T')[0];
    if (daysMap.has(key)) {
      const entry = daysMap.get(key)!;
      entry.clicks += 1;
      entry.visitorsSet.add(c.visitor_id);
    }
  });

  filteredLeads.forEach(l => {
    const key = (l.created_at || '').split('T')[0];
    if (daysMap.has(key)) {
      daysMap.get(key)!.registrations += 1;
    }
  });

  const dailyTrend: DayMetric[] = Array.from(daysMap.entries()).map(([dateStr, val]) => {
    const dObj = parseISO(dateStr);
    return {
      date: dateStr,
      formattedDate: format(dObj, period === 'today' ? 'HH:mm' : 'dd/MM', { locale: ptBR }),
      pageviews: val.pageviews,
      visitors: val.visitorsSet.size,
      clicks: val.clicks,
      registrations: val.registrations
    };
  });

  // Ranking de Páginas Públicas Mais Acessadas
  const pageMap = new Map<string, { title: string; views: number; visitors: Set<string> }>();
  filteredVisits.forEach(v => {
    const cleanPath = v.path.split('?')[0] || '/';
    const current = pageMap.get(cleanPath) || {
      title: getFriendlyPageTitle(cleanPath),
      views: 0,
      visitors: new Set<string>()
    };
    current.views += 1;
    current.visitors.add(v.visitor_id);
    pageMap.set(cleanPath, current);
  });

  const topPages: PageStat[] = Array.from(pageMap.entries())
    .map(([path, data]) => ({
      path,
      title: data.title,
      views: data.views,
      uniqueViews: data.visitors.size,
      percentage: totalPageviews > 0 ? Number(((data.views / totalPageviews) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.views - a.views);

  // Onde as Pessoas Mais Clicaram no Site (Botões e CTAs)
  const buttonMap = new Map<string, { label: string; path: string; count: number }>();
  filteredClicks.forEach(c => {
    const cleanPath = (c.path || '/').split('?')[0];
    const key = `${c.button_label}__${cleanPath}`;
    const existing = buttonMap.get(key) || { label: c.button_label, path: cleanPath, count: 0 };
    existing.count += 1;
    buttonMap.set(key, existing);
  });

  const totalClickCount = filteredClicks.length || 1;
  const clicksByButton: ButtonClickStat[] = Array.from(buttonMap.values())
    .map(item => ({
      label: item.label,
      path: item.path,
      pageTitle: getFriendlyPageTitle(item.path),
      count: item.count,
      percentage: Number(((item.count / totalClickCount) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count);

  // Distribuição de Faixas de Idade (a partir dos cadastros/interações do site)
  const ageBuckets: Record<string, { count: number; color: string }> = {
    '18-24': { count: 0, color: '#38BDF8' },
    '25-34': { count: 0, color: '#F49853' },
    '35-44': { count: 0, color: '#92BF78' },
    '45-54': { count: 0, color: '#818CF8' },
    '55+': { count: 0, color: '#EC4899' },
    'Corporativo (PJ)': { count: 0, color: '#8B5CF6' }
  };

  filteredLeads.forEach(l => {
    const r = l.age_range || '25-34';
    if (ageBuckets[r]) {
      ageBuckets[r].count += 1;
    } else {
      ageBuckets['25-34'].count += 1;
    }
  });

  const totalLeadCount = filteredLeads.length || 1;
  const ageDistribution: DemographyItem[] = Object.entries(ageBuckets).map(([name, val]) => ({
    name,
    count: val.count,
    percentage: filteredLeads.length > 0 ? Number(((val.count / totalLeadCount) * 100).toFixed(1)) : 0,
    color: val.color
  }));

  // Como as Pessoas Preferem Participar no Site (Distribuição de Interesses)
  const interestBuckets: Record<string, { label: string; count: number; color: string }> = {
    sponsor: { label: 'Apadrinhamento / Mantenedor Mensal', count: 0, color: '#F49853' },
    volunteer: { label: 'Voluntariado (Brasil & Moçambique)', count: 0, color: '#92BF78' },
    partner: { label: 'Parceria Empresarial (ESG)', count: 0, color: '#8B5CF6' },
    donor: { label: 'Doação Financeira Pontual', count: 0, color: '#3B82F6' }
  };

  filteredLeads.forEach(l => {
    const key = l.interest_type in interestBuckets ? l.interest_type : 'sponsor';
    interestBuckets[key].count += 1;
  });

  const interestsDistribution: DemographyItem[] = Object.values(interestBuckets)
    .map(item => ({
      name: item.label,
      count: item.count,
      percentage: filteredLeads.length > 0 ? Number(((item.count / totalLeadCount) * 100).toFixed(1)) : 0,
      color: item.color
    }))
    .sort((a, b) => b.count - a.count);

  // Geolocalização: Países
  const countryMap = new Map<string, number>();
  [...filteredVisits, ...filteredClicks].forEach(v => {
    const c = v.country || 'Brasil';
    countryMap.set(c, (countryMap.get(c) || 0) + 1);
  });

  const flags: Record<string, string> = {
    'Brasil': '🇧🇷',
    'Angola': '🇦🇴',
    'Portugal': '🇵🇹',
    'Moçambique': '🇲🇿',
    'Estados Unidos': '🇺🇸',
    'Cabo Verde': '🇨🇻',
    'Espanha': '🇪🇸'
  };

  const totalGeoEvents = (filteredVisits.length + filteredClicks.length) || 1;
  const topCountries: GeoItem[] = Array.from(countryMap.entries())
    .map(([country, count]) => ({
      name: country,
      flag: flags[country] || '🌐',
      count,
      percentage: Number(((count / totalGeoEvents) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count);

  // Geolocalização: Cidades
  const cityMap = new Map<string, { country: string; count: number }>();
  [...filteredVisits, ...filteredClicks].forEach(v => {
    const c = v.city || 'São Paulo';
    const current = cityMap.get(c) || { country: v.country || 'Brasil', count: 0 };
    current.count += 1;
    cityMap.set(c, current);
  });

  const topCities: GeoItem[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({
      name: city,
      country: data.country,
      count: data.count,
      percentage: Number(((data.count / totalGeoEvents) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Origem do Tráfego (Google, Instagram, WhatsApp, Direto, etc.)
  const refMap = new Map<string, number>();
  [...filteredVisits, ...filteredClicks].forEach(v => {
    const r = v.referrer || 'Direto';
    refMap.set(r, (refMap.get(r) || 0) + 1);
  });

  const refColors: Record<string, string> = {
    'Google': '#4285F4',
    'Instagram': '#E1306C',
    'WhatsApp': '#25D366',
    'Direto': '#F49853',
    'Facebook': '#1877F2',
    'LinkedIn': '#0A66C2',
    'YouTube': '#FF0000',
    'TikTok': '#0F172A'
  };

  const trafficSources: DemographyItem[] = Array.from(refMap.entries())
    .map(([source, count]) => ({
      name: source,
      count,
      percentage: Number(((count / totalGeoEvents) * 100).toFixed(1)),
      color: refColors[source] || '#64748B'
    }))
    .sort((a, b) => b.count - a.count);

  // Dispositivos
  const devMap = new Map<string, number>();
  filteredVisits.forEach(v => {
    const d = v.device || 'desktop';
    devMap.set(d, (devMap.get(d) || 0) + 1);
  });

  const devNames: Record<string, string> = {
    mobile: 'Celular (Mobile)',
    desktop: 'Computador (Desktop)',
    tablet: 'Tablet'
  };
  const devColors: Record<string, string> = {
    mobile: '#F49853',
    desktop: '#88A1F2',
    tablet: '#92BF78'
  };

  const devices: DemographyItem[] = Array.from(devMap.entries())
    .map(([device, count]) => ({
      name: devNames[device] || device,
      count,
      percentage: totalPageviews > 0 ? Number(((count / totalPageviews) * 100).toFixed(1)) : 0,
      color: devColors[device] || '#94A3B8'
    }))
    .sort((a, b) => b.count - a.count);

  // Navegadores
  const browMap = new Map<string, number>();
  filteredVisits.forEach(v => {
    const b = v.browser || 'Outro';
    browMap.set(b, (browMap.get(b) || 0) + 1);
  });

  const browsers: DemographyItem[] = Array.from(browMap.entries())
    .map(([browser, count]) => ({
      name: browser,
      count,
      percentage: totalPageviews > 0 ? Number(((count / totalPageviews) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Cálculo de Rejeição (Bounce Rate) e Duração Média por sessão
  const sessionTimestamps = new Map<string, number[]>();
  filteredVisits.forEach(v => {
    const sId = v.session_id || v.visitor_id;
    const time = new Date(v.created_at).getTime();
    if (!sessionTimestamps.has(sId)) {
      sessionTimestamps.set(sId, []);
    }
    sessionTimestamps.get(sId)!.push(time);
  });

  const totalSessions = sessionTimestamps.size;
  let singlePageSessions = 0;
  let totalDurationMs = 0;
  let multiPageSessions = 0;

  sessionTimestamps.forEach(timestamps => {
    if (timestamps.length <= 1) {
      singlePageSessions += 1;
    } else {
      multiPageSessions += 1;
      const min = Math.min(...timestamps);
      const max = Math.max(...timestamps);
      totalDurationMs += (max - min);
    }
  });

  const bounceRate = totalSessions > 0
    ? `${((singlePageSessions / totalSessions) * 100).toFixed(1)}%`
    : '0%';

  let avgDuration = '-';
  if (multiPageSessions > 0) {
    const avgSec = Math.round((totalDurationMs / multiPageSessions) / 1000);
    const m = Math.floor(avgSec / 60);
    const s = avgSec % 60;
    avgDuration = m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  return {
    period,
    totalPageviews,
    pageviewsGrowth,
    uniqueVisitors,
    visitorsGrowth,
    totalClicks,
    clickThroughRate,
    totalRegistrations,
    registrationsGrowth,
    conversionRate,
    avgDuration,
    bounceRate,
    dailyTrend,
    topPages,
    clicksByButton,
    ageDistribution,
    interestsDistribution,
    userRolesDistribution: userRolesList,
    topCountries,
    topCities,
    trafficSources,
    devices,
    browsers,
    recentVisits: filteredVisits.slice(0, 20),
    recentLeads: filteredLeads
  };
}

// Exportar cadastros/interações do site em CSV
export function exportSiteLeadsToCSV(leads: SiteLead[]): void {
  if (!leads || leads.length === 0) return;

  const headers = ['Nome / Empresa', 'WhatsApp / Telefone', 'E-mail', 'Faixa Etária / Perfil', 'Cidade / Estado', 'País', 'Modalidade de Participação', 'Detalhes / Mensagem', 'Página de Origem', 'Status', 'Data/Hora'];
  const rows = leads.map(l => [
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.email || '').replace(/"/g, '""')}"`,
    `"${(l.age_range || '').replace(/"/g, '""')}"`,
    `"${(l.city || '').replace(/"/g, '""')}${l.state ? ` - ${l.state}` : ''}"`,
    `"${(l.country || 'Brasil').replace(/"/g, '""')}"`,
    `"${(l.interest_label || '').replace(/"/g, '""')}"`,
    `"${(l.details || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(l.source_page || '').replace(/"/g, '""')}"`,
    `"${l.status === 'joined' ? 'Fez Parte' : l.status === 'contacted' ? 'Em Contato' : 'Novo'}"`,
    `"${l.created_at ? format(parseISO(l.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yah_hope_cadastros_site_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Exportar relatório completo do site em formato CSV
export function exportToCSV(data: AnalyticsSummary): void {
  const periodLabel = 
    data.period === 'today' ? 'Hoje' :
    data.period === '7d' ? 'Ultimos_7_dias' :
    data.period === '30d' ? 'Ultimos_30_dias' :
    data.period === '90d' ? 'Ultimos_90_dias' : 'Todo_o_periodo';

  let csvContent = '\uFEFF'; // UTF-8 BOM

  csvContent += '=== RELATÓRIO DE ACESSOS, CLIQUES E CONVERSÕES DO SITE (YAHHOPE.COM) ===\n';
  csvContent += `Período:;${periodLabel}\n`;
  csvContent += `Gerado em:;${new Date().toLocaleString('pt-BR')}\n\n`;

  csvContent += '--- RESUMO GERAL ---\n';
  csvContent += 'Métrica;Valor\n';
  csvContent += `Total de Acessos (Pageviews);${data.totalPageviews}\n`;
  csvContent += `Visitantes Únicos;${data.uniqueVisitors}\n`;
  csvContent += `Total de Cliques em Botões/CTAs;${data.totalClicks}\n`;
  csvContent += `Taxa de Engajamento (CTR);${data.clickThroughRate}%\n`;
  csvContent += `Pessoas Cadastradas / Querem Fazer Parte;${data.totalRegistrations}\n`;
  csvContent += `Taxa de Conversão;${data.conversionRate}%\n`;
  csvContent += `Duração Média da Sessão;${data.avgDuration}\n`;
  csvContent += `Taxa de Rejeição;${data.bounceRate}\n\n`;

  csvContent += '--- EVOLUÇÃO TEMPORAL DIÁRIA ---\n';
  csvContent += 'Data;Acessos (Pageviews);Visitantes Únicos;Cliques;Cadastros/Conversões\n';
  data.dailyTrend.forEach(d => {
    csvContent += `${d.date};${d.pageviews};${d.visitors};${d.clicks};${d.registrations}\n`;
  });
  csvContent += '\n';

  csvContent += '--- PÁGINAS PÚBLICAS MAIS ACESSADAS ---\n';
  csvContent += 'URL da Página;Nome da Página;Visualizações;Visitantes Únicos;% do Total\n';
  data.topPages.forEach(p => {
    csvContent += `"${p.path}";"${p.title}";${p.views};${p.uniqueViews};${p.percentage}%\n`;
  });
  csvContent += '\n';

  csvContent += '--- ONDE AS PESSOAS MAIS CLICARAM NO SITE ---\n';
  csvContent += 'Botão / Ação;Página;Cliques;% dos Cliques\n';
  data.clicksByButton.forEach(b => {
    csvContent += `"${b.label}";"${b.pageTitle} (${b.path})";${b.count};${b.percentage}%\n`;
  });
  csvContent += '\n';

  csvContent += '--- GEOLOCALIZAÇÃO: TOP CIDADES ---\n';
  csvContent += 'Cidade;País;Acessos;% do Total\n';
  data.topCities.forEach(c => {
    csvContent += `"${c.name}";"${c.country}";${c.count};${c.percentage}%\n`;
  });
  csvContent += '\n';

  csvContent += '--- ORIGEM DO TRÁFEGO (GOOGLE, REDES SOCIAIS, DIRETO) ---\n';
  csvContent += 'Canal;Acessos;% do Total\n';
  data.trafficSources.forEach(s => {
    csvContent += `"${s.name}";${s.count};${s.percentage}%\n`;
  });
  csvContent += '\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `yah_hope_site_acessos_${periodLabel}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar dados brutos em JSON
export function exportToJSON(data: AnalyticsSummary): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `yah_hope_site_analytics_${data.period}_${format(new Date(), 'yyyyMMdd_HHmm')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
