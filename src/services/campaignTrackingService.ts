import { supabase } from '../lib/supabase';
import { isSpamOrMockUser } from '../utils/userCleanup';
import { format, subDays, isAfter, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CampaignLead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  age?: number | null;
  age_range: string; // '18-24' | '25-34' | '35-44' | '45-54' | '55+' | 'Outro'
  city: string;
  state: string;
  country: string;
  interest_type: 'volunteer' | 'sponsor' | 'donor' | 'partner' | 'other';
  message?: string;
  status?: 'new' | 'contacted' | 'joined' | 'archived';
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  visitor_id?: string;
  origin_table?: 'campaign_leads' | 'sponsorships' | 'donations' | 'volunteer_applications' | 'corporate_partnerships';
  created_at?: string;
}

export interface CampaignEvent {
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

export interface CampaignAnalyticsSummary {
  period: 'today' | '7d' | '30d' | '90d' | 'all';
  totalVisits: number;
  uniqueVisitors: number;
  totalClicks: number;
  totalLeads: number;
  conversionRate: number; // (totalLeads / uniqueVisitors) * 100
  clickThroughRate: number; // (totalClicks / totalVisits) * 100
  allTimeStats: {
    visits: number;
    clicks: number;
    leads: number;
  };
  dailyTrend: {
    date: string;
    formattedDate: string;
    visits: number;
    clicks: number;
    leads: number;
  }[];
  clicksByButton: {
    label: string;
    count: number;
    percentage: number;
  }[];
  ageDistribution: {
    name: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  topCities: {
    name: string;
    count: number;
    percentage: number;
  }[];
  topCountries: {
    name: string;
    count: number;
    percentage: number;
  }[];
  trafficSources: {
    name: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  interestsDistribution: {
    name: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  devices: {
    name: string;
    count: number;
    percentage: number;
  }[];
  recentLeads: CampaignLead[];
}

const STORAGE_KEY_CAMPAIGN_VISITOR = 'yah_hope_hotsite_visitor_id';
const STORAGE_KEY_CAMPAIGN_SESSION = 'yah_hope_hotsite_session_id';
const STORAGE_KEY_CAMPAIGN_VISITS = 'yah_hope_hotsite_visits_cache_v1';
const STORAGE_KEY_CAMPAIGN_EVENTS = 'yah_hope_hotsite_events_cache_v1';
const STORAGE_KEY_CAMPAIGN_LEADS = 'yah_hope_hotsite_leads_cache_v1';
const STORAGE_KEY_CAMPAIGN_LEAD_STATUS = 'yah_hope_hotsite_lead_status_v1';
const STORAGE_KEY_GEO = 'yah_hope_analytics_geo_cache';

const HOTSITE_KNOWN_BUTTON_LABELS = [
  'visualização do hotsite',
  'hero cta - quero fazer parte',
  'hero cta - conheça nosso trabalho',
  'projeto ativo cta',
  'card modalidade - quero ser mantenedor',
  'card modalidade cota',
  'card modalidade - quero apadrinhar',
  'quero fazer parte',
  'conheça nosso trabalho',
  'participar desta história',
  'quero ser mantenedor',
  'quero ser padrinho ou madrinha',
  '1 criança',
  '2 crianças',
  '3 crianças',
  '4 crianças',
  'formulário: quero fazer parte enviado',
  'formulário hotsite'
];

// Verifica se a URL/rota atual ou informada pertence ao Hotsite da Campanha (campanha.yahhope.com ou /campanha-yahhope)
export function isHotsiteRoute(
  path: string = typeof window !== 'undefined' ? window.location.pathname : '',
  hostname: string = typeof window !== 'undefined' ? window.location.hostname : ''
): boolean {
  const cleanHost = (hostname || '').toLowerCase();
  if (cleanHost.startsWith('campanha.') || cleanHost === 'campanha.yahhope.com') {
    return true;
  }

  const cleanPath = (path || '').split('?')[0].toLowerCase();
  return (
    cleanPath === '/campanha-yahhope' ||
    cleanPath.startsWith('/campanha-yahhope/') ||
    cleanPath === '/hotsite' ||
    cleanPath.startsWith('/hotsite/') ||
    cleanPath === '/participe' ||
    cleanPath.startsWith('/participe/') ||
    cleanPath === '/fazer-parte' ||
    cleanPath.startsWith('/fazer-parte/')
  );
}

// Normaliza o path do Hotsite para que acessos na raiz de campanha.yahhope.com ("/") sejam identificados de forma consistente
export function getNormalizedHotsitePath(
  path: string = typeof window !== 'undefined' ? window.location.pathname : '',
  hostname: string = typeof window !== 'undefined' ? window.location.hostname : ''
): string {
  if (isHotsiteRoute(path, hostname)) {
    const clean = (path || '').split('?')[0];
    if (!clean || clean === '/') {
      return '/campanha-yahhope';
    }
    return clean;
  }
  return path || '/campanha-yahhope';
}

// Helper de ID de Visitante persistente
export function getCampaignVisitorId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY_CAMPAIGN_VISITOR);
    if (!id) {
      id = 'v_hot_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY_CAMPAIGN_VISITOR, id);
    }
    return id;
  } catch {
    return 'v_hot_anon';
  }
}

// Helper de ID de Sessão
export function getCampaignSessionId(): string {
  try {
    let sId = sessionStorage.getItem(STORAGE_KEY_CAMPAIGN_SESSION);
    if (!sId) {
      sId = 's_hot_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(STORAGE_KEY_CAMPAIGN_SESSION, sId);
    }
    return sId;
  } catch {
    return 's_hot_anon';
  }
}

// Detecção de Dispositivo
function detectDevice(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
    return 'tablet';
  }
  if (/(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds|archos)/.test(ua) || (typeof window !== 'undefined' && window.innerWidth < 768)) {
    return 'mobile';
  }
  return 'desktop';
}

// Detecção de Navegador
function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'Outro';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Opera|OPR\//.test(ua)) return 'Opera';
  return 'Outro';
}

// Detecção de SO
function detectOS(): string {
  if (typeof navigator === 'undefined') return 'Outro';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Outro';
}

// Geolocalização com cache
export async function getClientLocation(): Promise<{ country: string; city: string; state?: string }> {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_GEO);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.city) return parsed;
    }
  } catch {
    // ignore
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
        try {
          localStorage.setItem(STORAGE_KEY_GEO, JSON.stringify(geo));
        } catch {}
        return geo;
      }
    }
  } catch {
    // Fail silently
  }

  return { country: 'Brasil', city: 'São Paulo', state: 'SP' };
}

// Detectar Referrer / Origem Amigável
export function detectTrafficSource(): string {
  if (typeof window === 'undefined') return 'Direto';
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
    if (ref.includes('instagram')) return 'Instagram';
    if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
    if (ref.includes('facebook') || ref.includes('fb.')) return 'Facebook';
    if (ref.includes('google')) return 'Google';
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

let lastHotsitePageViewTime = 0;
let lastHotsiteClickKey = '';
let lastHotsiteClickTime = 0;

// Rastrear Visualização de Página (Acesso) no Hotsite
export async function recordCampaignPageView(
  customTitle = 'Hotsite - Um convite para levar esperança | YAH Hope'
): Promise<void> {
  const nowMs = Date.now();
  if (nowMs - lastHotsitePageViewTime < 1800) {
    return;
  }
  lastHotsitePageViewTime = nowMs;

  const visitorId = getCampaignVisitorId();
  const sessionId = getCampaignSessionId();
  const geo = await getClientLocation();
  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const referrer = detectTrafficSource();
  const normalizedPath = getNormalizedHotsitePath();
  const nowIso = new Date().toISOString();

  const visitPayload = {
    visitor_id: visitorId,
    session_id: sessionId,
    path: normalizedPath,
    page_title: customTitle,
    referrer,
    device,
    browser,
    os,
    country: geo.country,
    city: geo.city,
    created_at: nowIso
  };

  // 1. Salva no cache local de visitas do Hotsite
  try {
    const rawVisits = localStorage.getItem(STORAGE_KEY_CAMPAIGN_VISITS);
    const list = rawVisits ? JSON.parse(rawVisits) : [];
    list.unshift(visitPayload);
    if (list.length > 2000) list.length = 2000;
    localStorage.setItem(STORAGE_KEY_CAMPAIGN_VISITS, JSON.stringify(list));
  } catch {
    // ignore
  }

  // 2. Registra evento page_view no cache local de eventos do Hotsite
  const pageViewEvent: CampaignEvent = {
    event_type: 'page_view',
    button_label: 'Visualização do Hotsite de Mantenedores',
    visitor_id: visitorId,
    session_id: sessionId,
    path: normalizedPath,
    referrer,
    device,
    browser,
    os,
    city: geo.city,
    country: geo.country,
    metadata: {
      source: referrer,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'campanha.yahhope.com',
      original_path: typeof window !== 'undefined' ? window.location.pathname : '/campanha-yahhope',
      raw_referrer: typeof document !== 'undefined' ? document.referrer : ''
    },
    created_at: nowIso
  };

  try {
    const rawEvents = localStorage.getItem(STORAGE_KEY_CAMPAIGN_EVENTS);
    const eventsList: CampaignEvent[] = rawEvents ? JSON.parse(rawEvents) : [];
    eventsList.unshift(pageViewEvent);
    if (eventsList.length > 2000) eventsList.length = 2000;
    localStorage.setItem(STORAGE_KEY_CAMPAIGN_EVENTS, JSON.stringify(eventsList));
  } catch {
    // ignore
  }

  // 3. Persiste em ambas as tabelas do Supabase (site_visits e campaign_events) para redundância
  try {
    await Promise.allSettled([
      supabase.from('site_visits').insert([visitPayload]),
      supabase.from('campaign_events').insert([pageViewEvent])
    ]);
  } catch {
    // Fail silently
  }
}

// Rastrear Clique de Ação no Hotsite
export async function recordCampaignClick(
  buttonLabel: string, 
  eventType = 'click_cta',
  metadata: Record<string, any> = {}
): Promise<void> {
  if (eventType === 'page_view') {
    return recordCampaignPageView();
  }

  const cleanLabel = (buttonLabel || '').replace(/\s+/g, ' ').trim();
  if (!cleanLabel) return;

  const nowMs = Date.now();
  if (cleanLabel === lastHotsiteClickKey && nowMs - lastHotsiteClickTime < 1000) {
    return;
  }
  lastHotsiteClickKey = cleanLabel;
  lastHotsiteClickTime = nowMs;

  const visitorId = getCampaignVisitorId();
  const sessionId = getCampaignSessionId();
  const geo = await getClientLocation();
  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const referrer = detectTrafficSource();
  const normalizedPath = getNormalizedHotsitePath();

  const clickEvent: CampaignEvent = {
    event_type: eventType,
    button_label: cleanLabel,
    visitor_id: visitorId,
    session_id: sessionId,
    path: normalizedPath,
    referrer,
    device,
    browser,
    os,
    city: geo.city,
    country: geo.country,
    metadata: {
      ...metadata,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'campanha.yahhope.com',
      original_path: typeof window !== 'undefined' ? window.location.pathname : '/campanha-yahhope'
    },
    created_at: new Date().toISOString()
  };

  // Salva no cache local
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGN_EVENTS);
    const list: CampaignEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(clickEvent);
    if (list.length > 2000) list.length = 2000;
    localStorage.setItem(STORAGE_KEY_CAMPAIGN_EVENTS, JSON.stringify(list));
  } catch (e) {
    console.warn('Erro ao salvar evento de clique no cache:', e);
  }

  // Tenta salvar no Supabase
  try {
    await supabase.from('campaign_events').insert([clickEvent]);
  } catch {
    // Fail silently
  }
}

// Salvar Lead / Pessoa que quer fazer parte
export async function submitCampaignLead(
  lead: Omit<CampaignLead, 'id' | 'visitor_id' | 'created_at' | 'status'> & { status?: CampaignLead['status'] }
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  const visitorId = getCampaignVisitorId();
  const geo = await getClientLocation();
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

  const localId = 'lead_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const isFromHotsite = isHotsiteRoute();

  const fullLead: CampaignLead = {
    ...lead,
    id: localId,
    city: lead.city || geo.city || 'São Paulo',
    state: lead.state || geo.state || 'SP',
    country: lead.country || geo.country || 'Brasil',
    age_range: lead.age_range || '25-34',
    visitor_id: visitorId,
    status: lead.status || 'new',
    source: lead.source || (isFromHotsite ? 'campanha.yahhope.com' : 'hotsite_yahhope'),
    utm_source: lead.utm_source || params.get('utm_source') || detectTrafficSource(),
    utm_medium: lead.utm_medium || params.get('utm_medium') || undefined,
    utm_campaign: lead.utm_campaign || params.get('utm_campaign') || undefined,
    created_at: new Date().toISOString()
  };

  // 1. Salva no cache local imediatamente
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGN_LEADS);
    const list: CampaignLead[] = raw ? JSON.parse(raw) : [];
    list.unshift(fullLead);
    localStorage.setItem(STORAGE_KEY_CAMPAIGN_LEADS, JSON.stringify(list));
  } catch (e) {
    console.warn('Erro ao salvar lead no cache:', e);
  }

  // Registra também o evento de clique/submissão
  recordCampaignClick('Formulário: Quero Fazer Parte Enviado', 'form_submit', {
    interest_type: fullLead.interest_type,
    city: fullLead.city,
    age_range: fullLead.age_range
  });

  // 2. Persiste no Supabase
  try {
    const { data, error } = await supabase.from('campaign_leads').insert([
      {
        name: fullLead.name,
        email: fullLead.email,
        phone: fullLead.phone,
        age: fullLead.age ?? null,
        age_range: fullLead.age_range,
        city: fullLead.city,
        state: fullLead.state,
        country: fullLead.country,
        interest_type: fullLead.interest_type,
        message: fullLead.message,
        status: fullLead.status,
        source: fullLead.source,
        utm_source: fullLead.utm_source,
        utm_medium: fullLead.utm_medium,
        utm_campaign: fullLead.utm_campaign,
        visitor_id: fullLead.visitor_id,
        created_at: fullLead.created_at
      }
    ]).select('id').single();

    if (!error && data && data.id) {
      // Atualiza o ID local pelo ID oficial do banco para evitar duplicação
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGN_LEADS);
        if (raw) {
          const list: CampaignLead[] = JSON.parse(raw);
          const updated = list.map(item => item.id === localId ? { ...item, id: data.id } : item);
          localStorage.setItem(STORAGE_KEY_CAMPAIGN_LEADS, JSON.stringify(updated));
        }
      } catch {}
      return { success: true, leadId: data.id };
    }
  } catch (err) {
    console.warn('Supabase lead insert fallback:', err);
  }

  return { success: true, leadId: fullLead.id };
}

// Atualizar status do Lead (para o Admin)
export async function updateLeadStatus(
  leadId: string,
  status: 'new' | 'contacted' | 'joined' | 'archived'
): Promise<boolean> {
  // 1. Salva no mapa de overrides de status local
  try {
    const rawStatus = localStorage.getItem(STORAGE_KEY_CAMPAIGN_LEAD_STATUS);
    const statusMap: Record<string, string> = rawStatus ? JSON.parse(rawStatus) : {};
    statusMap[leadId] = status;
    localStorage.setItem(STORAGE_KEY_CAMPAIGN_LEAD_STATUS, JSON.stringify(statusMap));
  } catch {}

  // 2. Atualiza na lista local de leads
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGN_LEADS);
    if (raw) {
      const list: CampaignLead[] = JSON.parse(raw);
      const updated = list.map(l => l.id === leadId ? { ...l, status } : l);
      localStorage.setItem(STORAGE_KEY_CAMPAIGN_LEADS, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }

  // 3. Atualiza no Supabase
  try {
    await supabase.from('campaign_leads').update({ status }).eq('id', leadId);
    return true;
  } catch {
    return true;
  }
}

// Identifica se um evento da tabela campaign_events pertence ao Hotsite da Campanha
function isEventFromHotsite(e: CampaignEvent): boolean {
  const pathLower = (e.path || '').toLowerCase();
  const hostLower = String(e.metadata?.hostname || '').toLowerCase();
  const labelLower = (e.button_label || '').toLowerCase();
  const eventType = (e.event_type || '').toLowerCase();

  // 1. Se o path ou hostname for explicitamente do hotsite
  if (
    pathLower.includes('hotsite') ||
    pathLower.includes('campanha-yahhope') ||
    pathLower.includes('participe') ||
    pathLower.includes('fazer-parte') ||
    hostLower.includes('campanha.')
  ) {
    return true;
  }

  // 2. Eventos gerados exclusivamente pelas funções do Hotsite (inclusive quando path era "/" em campanha.yahhope.com)
  if (
    eventType === 'page_view' ||
    eventType === 'cta_click' ||
    eventType === 'click_cta' ||
    eventType === 'form_submit' ||
    eventType === 'click_pillar' ||
    eventType === 'click_whatsapp' ||
    eventType === 'hotsite_click'
  ) {
    return true;
  }

  // 3. Cliques capturados no subdomínio onde path era "/" e o rótulo corresponde aos botões do Hotsite
  if (pathLower === '/' || !pathLower) {
    if (HOTSITE_KNOWN_BUTTON_LABELS.some(known => labelLower.includes(known))) {
      return true;
    }
  }

  return false;
}

// Carregar métricas consolidadas do Hotsite para o Admin
export async function getCampaignAnalytics(
  period: 'today' | '7d' | '30d' | '90d' | 'all'
): Promise<CampaignAnalyticsSummary> {
  let statusOverrides: Record<string, 'new' | 'contacted' | 'joined' | 'archived'> = {};
  try {
    const rawStatus = localStorage.getItem(STORAGE_KEY_CAMPAIGN_LEAD_STATUS);
    if (rawStatus) statusOverrides = JSON.parse(rawStatus);
  } catch {}

  // ============================================================================
  // 1. CARREGAR RETORNOS / LEADS (campaign_leads + apadrinhamentos + doações)
  // ============================================================================
  let allLeads: CampaignLead[] = [];

  // 1a. Tabela oficial campaign_leads no Supabase
  try {
    const { data, error } = await supabase
      .from('campaign_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      allLeads.push(...(data as CampaignLead[]).map(l => ({
        ...l,
        status: statusOverrides[String(l.id)] || l.status || 'new',
        origin_table: 'campaign_leads' as const
      })));
    }
  } catch {
    // ignore
  }

  // 1b. Cache local de campaign_leads
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGN_LEADS);
    if (raw) {
      const localLeads: CampaignLead[] = JSON.parse(raw);
      if (Array.isArray(localLeads)) {
        allLeads.push(...localLeads.map(l => ({
          ...l,
          status: (l.id && statusOverrides[l.id]) || l.status || 'new',
          origin_table: 'campaign_leads' as const
        })));
      }
    }
  } catch {
    // ignore
  }

  // 1c. Apadrinhamentos e Doações confirmados (retornos do formulário HomeDonationCard / Checkout)
  try {
    const [spRes, donRes, volRes, partRes] = await Promise.allSettled([
      supabase.from('sponsorships').select('*').order('created_at', { ascending: false }),
      supabase.from('donations').select('*').order('created_at', { ascending: false }),
      supabase.from('volunteer_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('corporate_partnerships').select('*').order('created_at', { ascending: false })
    ]);

    if (spRes.status === 'fulfilled' && spRes.value.data) {
      spRes.value.data.forEach((sp: any) => {
        const name = sp.donor_name || sp.sponsor_name || '';
        const email = sp.donor_email || sp.sponsor_email || '';
        if (!name && !email) return;
        if (isSpamOrMockUser({ name, email, role: 'SPONSOR' })) return;

        const id = `sp_${sp.id}`;
        const amount = Number(sp.monthly_amount || sp.amount || 90);
        allLeads.push({
          id,
          name: name || 'Padrinho / Madrinha',
          email,
          phone: sp.donor_phone || sp.sponsor_phone || '',
          age_range: '25-34',
          city: sp.city || 'Brasil',
          state: sp.state || '',
          country: 'Brasil',
          interest_type: 'sponsor',
          message: `Apadrinhamento confirmado (R$ ${amount.toLocaleString('pt-BR')}/mês)`,
          status: statusOverrides[id] || 'joined',
          source: 'campanha.yahhope.com',
          origin_table: 'sponsorships',
          created_at: sp.created_at || sp.started_at || new Date().toISOString()
        });
      });
    }

    if (donRes.status === 'fulfilled' && donRes.value.data) {
      donRes.value.data.forEach((don: any) => {
        const name = don.donor_name || '';
        const email = don.donor_email || '';
        if (!name && !email) return;
        if (name.toLowerCase() === 'doador anônimo' && !email) return;
        if (isSpamOrMockUser({ name, email })) return;

        const id = `don_${don.id}`;
        const amount = Number(don.amount || 0);
        const isMonthly = (don.payment_method || '').includes('mensal') || (don.payment_method || '').includes('subscription') || don.is_monthly === true;
        allLeads.push({
          id,
          name: name || 'Mantenedor / Doador',
          email,
          phone: don.donor_phone || '',
          age_range: '25-34',
          city: 'Brasil',
          state: '',
          country: 'Brasil',
          interest_type: isMonthly ? 'sponsor' : 'donor',
          message: isMonthly
            ? `Mantenedor Mensal (R$ ${amount.toLocaleString('pt-BR')}/mês)`
            : `Doação Campanha (R$ ${amount.toLocaleString('pt-BR')})`,
          status: statusOverrides[id] || 'joined',
          source: 'campanha.yahhope.com',
          origin_table: 'donations',
          created_at: don.created_at || new Date().toISOString()
        });
      });
    }

    if (volRes.status === 'fulfilled' && volRes.value.data) {
      volRes.value.data.forEach((v: any) => {
        if (!v.name && !v.email) return;
        if (isSpamOrMockUser({ name: v.name, email: v.email })) return;
        const id = `vol_${v.id}`;
        allLeads.push({
          id,
          name: v.name || 'Voluntário',
          email: v.email || '',
          phone: v.phone || '',
          age_range: v.age_range || '25-34',
          city: v.city || 'São Paulo',
          state: v.state_country || '',
          country: (v.state_country || '').toLowerCase().includes('moçambique') ? 'Moçambique' : 'Brasil',
          interest_type: 'volunteer',
          message: Array.isArray(v.skills_areas) && v.skills_areas.length > 0 ? v.skills_areas.join(', ') : (v.motivation || 'Voluntariado'),
          status: statusOverrides[id] || (v.status === 'approved' ? 'joined' : v.status === 'contacted' ? 'contacted' : 'new'),
          source: 'campanha.yahhope.com',
          origin_table: 'volunteer_applications',
          created_at: v.created_at || new Date().toISOString()
        });
      });
    }

    if (partRes.status === 'fulfilled' && partRes.value.data) {
      partRes.value.data.forEach((p: any) => {
        if (!p.company_name && !p.email) return;
        const id = `part_${p.id}`;
        allLeads.push({
          id,
          name: `${p.company_name || 'Empresa'}${p.contact_person ? ` (${p.contact_person})` : ''}`,
          email: p.email || '',
          phone: p.phone || '',
          age_range: '35-44',
          city: 'Brasil',
          state: '',
          country: 'Brasil',
          interest_type: 'partner',
          message: p.proposal_details || p.partnership_type || 'Parceria Corporativa',
          status: statusOverrides[id] || (p.status === 'partnership_active' ? 'joined' : p.status === 'meeting_scheduled' ? 'contacted' : 'new'),
          source: 'campanha.yahhope.com',
          origin_table: 'corporate_partnerships',
          created_at: p.created_at || new Date().toISOString()
        });
      });
    }
  } catch {
    // ignore
  }

  // Deduplicar leads priorizando registros mais completos (com telefone/cidade/mensagem)
  const leadDedupMap = new Map<string, CampaignLead>();
  allLeads.forEach(l => {
    if (isSpamOrMockUser({ name: l.name, email: l.email, role: l.interest_type === 'sponsor' ? 'SPONSOR' : undefined })) {
      return;
    }
    const emailKey = (l.email || '').trim().toLowerCase();
    const phoneKey = (l.phone || '').replace(/\D/g, '');
    const dayKey = (l.created_at || '').split('T')[0];
    const dedupKey = emailKey
      ? `email:${emailKey}_${l.interest_type}`
      : phoneKey
        ? `phone:${phoneKey}_${l.interest_type}`
        : `id:${l.id || `${l.name}_${dayKey}`}`;

    const existing = leadDedupMap.get(dedupKey);
    if (!existing) {
      leadDedupMap.set(dedupKey, l);
    } else {
      // Mescla campos faltantes (ex: telefone ou cidade do campaign_leads com status joined do sponsorship)
      leadDedupMap.set(dedupKey, {
        ...existing,
        phone: existing.phone || l.phone,
        city: (existing.city && existing.city !== 'Brasil') ? existing.city : (l.city || existing.city),
        state: existing.state || l.state,
        age_range: existing.age_range || l.age_range,
        status: existing.status === 'joined' || l.status === 'joined' ? 'joined' : (existing.status || l.status)
      });
    }
  });

  allLeads = Array.from(leadDedupMap.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  // ============================================================================
  // 2. CARREGAR EVENTOS E CLIQUES DO HOTSITE (Supabase + LocalStorage)
  // ============================================================================
  let rawEvents: CampaignEvent[] = [];
  try {
    const { data, error } = await supabase
      .from('campaign_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (!error && data && data.length > 0) {
      rawEvents = data as CampaignEvent[];
    }
  } catch {
    // ignore
  }

  try {
    const localRaw = localStorage.getItem(STORAGE_KEY_CAMPAIGN_EVENTS);
    if (localRaw) {
      const localEvents: CampaignEvent[] = JSON.parse(localRaw);
      if (Array.isArray(localEvents)) {
        rawEvents = [...rawEvents, ...localEvents];
      }
    }
  } catch {
    // ignore
  }

  // Filtra apenas eventos do Hotsite e separa page_view de cliques reais
  const pageViewEvents: CampaignEvent[] = [];
  const allClickEvents: CampaignEvent[] = [];
  const seenEventKeys = new Set<string>();

  rawEvents.forEach(e => {
    if (!isEventFromHotsite(e)) return;

    const minuteBucket = (e.created_at || '').slice(0, 16);
    const dedupKey = `${e.visitor_id}_${minuteBucket}_${e.event_type}_${e.button_label}`;
    if (seenEventKeys.has(dedupKey)) return;
    seenEventKeys.add(dedupKey);

    const isPageView =
      e.event_type === 'page_view' ||
      (e.button_label || '').toLowerCase().includes('visualização do hotsite');

    if (isPageView) {
      pageViewEvents.push(e);
    } else {
      allClickEvents.push(e);
    }
  });

  // ============================================================================
  // 3. CARREGAR ACESSOS / VISITAS DO HOTSITE (site_visits + pageViewEvents + LocalStorage)
  // ============================================================================
  let hotsiteVisits: {
    visitor_id: string;
    created_at: string;
    city?: string;
    country?: string;
    referrer?: string;
    device?: string;
  }[] = [];

  try {
    const { data } = await supabase
      .from('site_visits')
      .select('visitor_id, created_at, city, country, referrer, device, path, page_title')
      .or('path.ilike.%hotsite%,path.ilike.%campanha-yahhope%,path.ilike.%participe%,path.ilike.%fazer-parte%,page_title.ilike.%Hotsite%,page_title.ilike.%convite para levar esperança%')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (data && data.length > 0) {
      hotsiteVisits.push(...data);
    }
  } catch {
    // ignore
  }

  // Mesclar com caches locais de visitas do Hotsite
  try {
    const rawHotsiteVisits = localStorage.getItem(STORAGE_KEY_CAMPAIGN_VISITS);
    if (rawHotsiteVisits) {
      const parsed = JSON.parse(rawHotsiteVisits);
      if (Array.isArray(parsed)) {
        hotsiteVisits.push(...parsed);
      }
    }
  } catch {}

  try {
    const rawGeneralVisits = localStorage.getItem('yah_hope_analytics_visits_cache_v2');
    if (rawGeneralVisits) {
      const localV: any[] = JSON.parse(rawGeneralVisits);
      if (Array.isArray(localV)) {
        const filtered = localV.filter(v =>
          (v.path && (
            v.path.includes('campanha-yahhope') ||
            v.path.includes('hotsite') ||
            v.path.includes('participe') ||
            v.path.includes('fazer-parte')
          )) ||
          (v.page_title && (
            v.page_title.toLowerCase().includes('hotsite') ||
            v.page_title.toLowerCase().includes('convite para levar esperança')
          ))
        );
        hotsiteVisits.push(...filtered);
      }
    }
  } catch {}

  // Adiciona os eventos page_view registrados em campaign_events
  pageViewEvents.forEach(pv => {
    hotsiteVisits.push({
      visitor_id: pv.visitor_id,
      created_at: pv.created_at,
      city: pv.city,
      country: pv.country,
      referrer: pv.referrer || pv.metadata?.source,
      device: pv.device
    });
  });

  // Deduplica visitas (mesmo visitante no mesmo minuto conta como 1 único acesso)
  const visitDedupKeys = new Set<string>();
  hotsiteVisits = hotsiteVisits.filter(v => {
    if (!v.created_at) return false;
    const minuteBucket = v.created_at.slice(0, 16);
    const key = `${v.visitor_id || 'anon'}_${minuteBucket}`;
    if (visitDedupKeys.has(key)) return false;
    visitDedupKeys.add(key);
    return true;
  });

  // Garante que qualquer visitante que clicou no Hotsite tenha pelo menos 1 acesso contabilizado naquele dia
  const visitVisitorDaySet = new Set(
    hotsiteVisits.map(v => `${v.visitor_id}_${v.created_at.split('T')[0]}`)
  );
  allClickEvents.forEach(e => {
    if (!e.created_at) return;
    const dayKey = `${e.visitor_id}_${e.created_at.split('T')[0]}`;
    if (!visitVisitorDaySet.has(dayKey)) {
      visitVisitorDaySet.add(dayKey);
      hotsiteVisits.push({
        visitor_id: e.visitor_id,
        created_at: e.created_at,
        city: e.city,
        country: e.country,
        referrer: e.referrer,
        device: e.device
      });
    }
  });

  // ============================================================================
  // 4. FILTRAGEM POR PERÍODO SELECIONADO
  // ============================================================================
  const now = new Date();
  let startDate: Date;
  if (period === 'today') startDate = startOfDay(now);
  else if (period === '7d') startDate = subDays(now, 7);
  else if (period === '30d') startDate = subDays(now, 30);
  else if (period === '90d') startDate = subDays(now, 90);
  else startDate = new Date(2020, 0, 1);

  const isWithinPeriod = (isoStr?: string) => {
    if (!isoStr) return false;
    if (period === 'all') return true;
    try {
      return isAfter(parseISO(isoStr), startDate);
    } catch {
      return false;
    }
  };

  const filteredVisits = hotsiteVisits.filter(v => isWithinPeriod(v.created_at));
  const filteredEvents = allClickEvents.filter(e => isWithinPeriod(e.created_at));
  const filteredLeads = allLeads.filter(l => isWithinPeriod(l.created_at));

  const totalVisits = filteredVisits.length;
  const uniqueVisitorSet = new Set<string>([
    ...filteredVisits.map(v => v.visitor_id).filter(Boolean),
    ...filteredEvents.map(e => e.visitor_id).filter(Boolean),
    ...filteredLeads.map(l => l.visitor_id || l.email || l.phone).filter(Boolean)
  ]);
  const uniqueVisitors = uniqueVisitorSet.size;
  const totalClicks = filteredEvents.length;
  const totalLeads = filteredLeads.length;

  const conversionRate = uniqueVisitors > 0
    ? Number(Math.min(100, (totalLeads / uniqueVisitors) * 100).toFixed(1))
    : 0;
  const clickThroughRate = totalVisits > 0
    ? Number(((totalClicks / totalVisits) * 100).toFixed(1))
    : 0;

  // ============================================================================
  // 5. EVOLUÇÃO TEMPORAL (Por Hora quando 'today', Por Dia nos demais períodos)
  // ============================================================================
  let dailyTrend: {
    date: string;
    formattedDate: string;
    visits: number;
    clicks: number;
    leads: number;
  }[] = [];

  if (period === 'today') {
    const currentHour = Math.max(now.getHours(), 8);
    const hoursMap = new Map<number, { visits: number; clicks: number; leads: number }>();
    for (let h = 0; h <= currentHour; h++) {
      hoursMap.set(h, { visits: 0, clicks: 0, leads: 0 });
    }

    filteredVisits.forEach(v => {
      try {
        const h = parseISO(v.created_at).getHours();
        if (!hoursMap.has(h)) hoursMap.set(h, { visits: 0, clicks: 0, leads: 0 });
        hoursMap.get(h)!.visits += 1;
      } catch {}
    });

    filteredEvents.forEach(e => {
      try {
        const h = parseISO(e.created_at).getHours();
        if (!hoursMap.has(h)) hoursMap.set(h, { visits: 0, clicks: 0, leads: 0 });
        hoursMap.get(h)!.clicks += 1;
      } catch {}
    });

    filteredLeads.forEach(l => {
      try {
        if (!l.created_at) return;
        const h = parseISO(l.created_at).getHours();
        if (!hoursMap.has(h)) hoursMap.set(h, { visits: 0, clicks: 0, leads: 0 });
        hoursMap.get(h)!.leads += 1;
      } catch {}
    });

    dailyTrend = Array.from(hoursMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, val]) => {
        const label = `${String(hour).padStart(2, '0')}:00`;
        return {
          date: label,
          formattedDate: label,
          visits: val.visits,
          clicks: val.clicks,
          leads: val.leads
        };
      });
  } else {
    const daysSpan = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const daysMap = new Map<string, { visits: number; clicks: number; leads: number }>();

    for (let i = daysSpan - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const key = format(d, 'yyyy-MM-dd');
      daysMap.set(key, { visits: 0, clicks: 0, leads: 0 });
    }

    filteredVisits.forEach(v => {
      try {
        const key = format(parseISO(v.created_at), 'yyyy-MM-dd');
        if (daysMap.has(key)) daysMap.get(key)!.visits += 1;
      } catch {}
    });

    filteredEvents.forEach(e => {
      try {
        const key = format(parseISO(e.created_at), 'yyyy-MM-dd');
        if (daysMap.has(key)) daysMap.get(key)!.clicks += 1;
      } catch {}
    });

    filteredLeads.forEach(l => {
      try {
        if (!l.created_at) return;
        const key = format(parseISO(l.created_at), 'yyyy-MM-dd');
        if (daysMap.has(key)) daysMap.get(key)!.leads += 1;
      } catch {}
    });

    dailyTrend = Array.from(daysMap.entries()).map(([dateStr, val]) => ({
      date: dateStr,
      formattedDate: format(parseISO(dateStr), 'dd/MM', { locale: ptBR }),
      visits: val.visits,
      clicks: val.clicks,
      leads: val.leads
    }));
  }

  // ============================================================================
  // 6. CLIQUES POR BOTÃO / CTA
  // ============================================================================
  const buttonCounts = new Map<string, number>();
  filteredEvents.forEach(e => {
    const label = e.button_label || 'Clique em Ação';
    buttonCounts.set(label, (buttonCounts.get(label) || 0) + 1);
  });
  const totalClickCount = Array.from(buttonCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const clicksByButton = Array.from(buttonCounts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: Number(((count / totalClickCount) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count);

  // ============================================================================
  // 7. DISTRIBUIÇÃO DE FAIXAS DE IDADE E INTERESSES
  // ============================================================================
  const ageRanges: Record<string, { count: number; color: string }> = {
    '18-24': { count: 0, color: '#38BDF8' },
    '25-34': { count: 0, color: '#F49853' },
    '35-44': { count: 0, color: '#92BF78' },
    '45-54': { count: 0, color: '#818CF8' },
    '55+': { count: 0, color: '#EC4899' },
    'Menos de 18': { count: 0, color: '#FBBF24' },
    'Não informada': { count: 0, color: '#94A3B8' }
  };

  filteredLeads.forEach(l => {
    let range = l.age_range;
    if (!range && l.age) {
      if (l.age < 18) range = 'Menos de 18';
      else if (l.age <= 24) range = '18-24';
      else if (l.age <= 34) range = '25-34';
      else if (l.age <= 44) range = '35-44';
      else if (l.age <= 54) range = '45-54';
      else range = '55+';
    }
    if (!range || !ageRanges[range]) {
      range = 'Não informada';
    }
    ageRanges[range].count += 1;
  });

  const totalLeadCount = filteredLeads.length || 1;
  const ageDistribution = Object.entries(ageRanges)
    .filter(([_, data]) => data.count > 0 || filteredLeads.length === 0)
    .map(([name, data]) => ({
      name,
      count: data.count,
      percentage: filteredLeads.length > 0 ? Number(((data.count / totalLeadCount) * 100).toFixed(1)) : 0,
      color: data.color
    }));

  // Distribuição de Interesses
  const interestLabels: Record<string, { label: string; color: string }> = {
    sponsor: { label: 'Apadrinhamento / Mantenedor', color: '#92BF78' },
    donor: { label: 'Doação Financeira', color: '#3B82F6' },
    volunteer: { label: 'Voluntário', color: '#F49853' },
    partner: { label: 'Empresa / Parceiro', color: '#8B5CF6' },
    other: { label: 'Outro', color: '#64748B' }
  };
  const interestCounts = new Map<string, number>();
  filteredLeads.forEach(l => {
    const key = l.interest_type || 'other';
    interestCounts.set(key, (interestCounts.get(key) || 0) + 1);
  });
  const interestsDistribution = Array.from(interestCounts.entries())
    .map(([key, count]) => {
      const meta = interestLabels[key] || { label: key, color: '#64748B' };
      return {
        name: meta.label,
        count,
        percentage: Number(((count / totalLeadCount) * 100).toFixed(1)),
        color: meta.color
      };
    })
    .sort((a, b) => b.count - a.count);

  // ============================================================================
  // 8. CIDADES, PAÍSES, ORIGEM DO TRÁFEGO E DISPOSITIVOS
  // ============================================================================
  const cityCounts = new Map<string, number>();
  [...filteredVisits, ...filteredEvents, ...filteredLeads].forEach(item => {
    const rawCity = (item as any).city;
    if (!rawCity || rawCity === 'Brasil') return;
    cityCounts.set(rawCity, (cityCounts.get(rawCity) || 0) + 1);
  });
  const totalGeoCount = Array.from(cityCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const topCities = Array.from(cityCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / totalGeoCount) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const countryCounts = new Map<string, number>();
  [...filteredVisits, ...filteredEvents, ...filteredLeads].forEach(item => {
    const country = (item as any).country || 'Brasil';
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
  });
  const totalCountryCount = Array.from(countryCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const topCountries = Array.from(countryCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / totalCountryCount) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const sourceColors: Record<string, string> = {
    'Instagram': '#E1306C',
    'WhatsApp': '#25D366',
    'Facebook': '#1877F2',
    'Google': '#4285F4',
    'TikTok': '#000000',
    'Direto': '#F49853',
    'Outro': '#64748B'
  };
  const sourceCounts = new Map<string, number>();
  [...filteredVisits, ...filteredEvents].forEach(item => {
    const src = (item as any).referrer || 'Direto';
    sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
  });
  const totalSourceCount = Array.from(sourceCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const trafficSources = Array.from(sourceCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / totalSourceCount) * 100).toFixed(1)),
      color: sourceColors[name] || '#64748B'
    }))
    .sort((a, b) => b.count - a.count);

  const deviceCounts = new Map<string, number>();
  [...filteredVisits, ...filteredEvents].forEach(item => {
    const dev = (item as any).device === 'mobile'
      ? 'Celular (Mobile)'
      : (item as any).device === 'tablet'
        ? 'Tablet'
        : 'Computador (Desktop)';
    deviceCounts.set(dev, (deviceCounts.get(dev) || 0) + 1);
  });
  const totalDeviceCount = Array.from(deviceCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const devices = Array.from(deviceCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / totalDeviceCount) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count);

  return {
    period,
    totalVisits,
    uniqueVisitors,
    totalClicks,
    totalLeads,
    conversionRate,
    clickThroughRate,
    allTimeStats: {
      visits: hotsiteVisits.length,
      clicks: allClickEvents.length,
      leads: allLeads.length
    },
    dailyTrend,
    clicksByButton,
    ageDistribution,
    topCities,
    topCountries,
    trafficSources,
    interestsDistribution,
    devices,
    recentLeads: filteredLeads
  };
}

// Exportar Leads para CSV
export function exportLeadsToCSV(leads: CampaignLead[]) {
  if (!leads || leads.length === 0) return;

  const headers = ['Nome', 'WhatsApp', 'E-mail', 'Idade / Faixa', 'Cidade', 'Estado', 'País', 'Tipo de Interesse', 'Mensagem', 'Status', 'Origem', 'Data/Hora'];
  const rows = leads.map(l => [
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.email || '').replace(/"/g, '""')}"`,
    `"${l.age_range || l.age || 'Não informado'}"`,
    `"${(l.city || '').replace(/"/g, '""')}"`,
    `"${(l.state || '').replace(/"/g, '""')}"`,
    `"${(l.country || 'Brasil').replace(/"/g, '""')}"`,
    `"${l.interest_type || ''}"`,
    `"${(l.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${l.status || 'new'}"`,
    `"${l.source || ''}"`,
    `"${l.created_at || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yah_hope_leads_hotsite_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
