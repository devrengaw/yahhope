import { supabase } from '../lib/supabase';
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
const STORAGE_KEY_CAMPAIGN_EVENTS = 'yah_hope_hotsite_events_cache_v1';
const STORAGE_KEY_CAMPAIGN_LEADS = 'yah_hope_hotsite_leads_cache_v1';
const STORAGE_KEY_GEO = 'yah_hope_analytics_geo_cache';

// Helper de ID de Visitante persistente
export function getCampaignVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEY_CAMPAIGN_VISITOR);
  if (!id) {
    id = 'v_hot_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_CAMPAIGN_VISITOR, id);
  }
  return id;
}

// Helper de ID de Sessão
export function getCampaignSessionId(): string {
  let sId = sessionStorage.getItem(STORAGE_KEY_CAMPAIGN_SESSION);
  if (!sId) {
    sId = 's_hot_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem(STORAGE_KEY_CAMPAIGN_SESSION, sId);
  }
  return sId;
}

// Detecção de Dispositivo
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

// Detecção de Navegador
function detectBrowser(): string {
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
    // Fail silently
  }

  return { country: 'Brasil', city: 'São Paulo', state: 'SP' };
}

// Detectar Referrer / Origem Amigável
export function detectTrafficSource(): string {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  if (utmSource) return utmSource.charAt(0).toUpperCase() + utmSource.slice(1);

  const ref = document.referrer.toLowerCase();
  if (ref.includes('instagram')) return 'Instagram';
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
  if (ref.includes('facebook') || ref.includes('fb.')) return 'Facebook';
  if (ref.includes('google')) return 'Google';
  if (ref.includes('tiktok')) return 'TikTok';
  if (ref.includes('linkedin')) return 'LinkedIn';
  if (ref.includes('youtube')) return 'YouTube';
  if (ref && !ref.includes(window.location.hostname)) {
    try {
      return new URL(document.referrer).hostname;
    } catch {
      return 'Outro';
    }
  }
  return 'Direto';
}

// Rastrear Clique de Ação no Hotsite
export async function recordCampaignClick(
  buttonLabel: string, 
  eventType = 'click_cta',
  metadata: Record<string, any> = {}
): Promise<void> {
  const visitorId = getCampaignVisitorId();
  const sessionId = getCampaignSessionId();
  const geo = await getClientLocation();
  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const referrer = detectTrafficSource();

  const clickEvent: CampaignEvent = {
    event_type: eventType,
    button_label: buttonLabel,
    visitor_id: visitorId,
    session_id: sessionId,
    path: window.location.pathname,
    referrer,
    device,
    browser,
    os,
    city: geo.city,
    country: geo.country,
    metadata,
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
  lead: Omit<CampaignLead, 'id' | 'visitor_id' | 'created_at' | 'status'>
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  const visitorId = getCampaignVisitorId();
  const params = new URLSearchParams(window.location.search);

  const fullLead: CampaignLead = {
    ...lead,
    id: 'lead_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    visitor_id: visitorId,
    status: 'new',
    source: window.location.hostname.includes('campanha') ? 'campanha.yahhope.com' : 'hotsite_yahhope',
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
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
        age: fullLead.age,
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

    if (!error && data) {
      return { success: true, leadId: data.id };
    }
  } catch (err) {
    console.warn('Supabase lead insert fallback:', err);
  }

  return { success: true, leadId: fullLead.id };
}

// Atualizar status do Lead (para o Admin)
export async function updateLeadStatus(leadId: string, status: 'new' | 'contacted' | 'joined' | 'archived'): Promise<boolean> {
  // Atualiza localmente
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

  // Atualiza no Supabase
  try {
    await supabase.from('campaign_leads').update({ status }).eq('id', leadId);
    return true;
  } catch {
    return true;
  }
}

// Carregar métricas consolidadas do Hotsite para o Admin
export async function getCampaignAnalytics(
  period: 'today' | '7d' | '30d' | '90d' | 'all'
): Promise<CampaignAnalyticsSummary> {
  // 1. Carregar leads (do Supabase + LocalStorage)
  let allLeads: CampaignLead[] = [];
  try {
    const { data, error } = await supabase
      .from('campaign_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      allLeads = data as CampaignLead[];
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGN_LEADS);
    if (raw) {
      const localLeads: CampaignLead[] = JSON.parse(raw);
      allLeads = [...allLeads, ...localLeads];
    }
  } catch {
    // ignore
  }

  // Deduplicar leads por id ou telefone+data
  const leadKeys = new Set<string>();
  allLeads = allLeads.filter(l => {
    const key = l.id || `${l.phone}_${l.created_at}`;
    if (leadKeys.has(key)) return false;
    leadKeys.add(key);
    return true;
  });

  // 2. Carregar cliques/eventos do hotsite
  let allEvents: CampaignEvent[] = [];
  try {
    const { data, error } = await supabase
      .from('campaign_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3000);

    if (!error && data && data.length > 0) {
      allEvents = data as CampaignEvent[];
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGN_EVENTS);
    if (raw) {
      const localEvents: CampaignEvent[] = JSON.parse(raw);
      allEvents = [...allEvents, ...localEvents];
    }
  } catch {
    // ignore
  }

  // Deduplicar eventos
  const eventKeys = new Set<string>();
  allEvents = allEvents.filter(e => {
    const key = `${e.visitor_id}_${e.created_at}_${e.button_label}`;
    if (eventKeys.has(key)) return false;
    eventKeys.add(key);
    return true;
  });

  // 3. Carregar visitas reais de páginas que correspondem ao hotsite
  let hotsiteVisits: { visitor_id: string; created_at: string; city?: string; country?: string; referrer?: string; device?: string }[] = [];
  try {
    const { data } = await supabase
      .from('site_visits')
      .select('visitor_id, created_at, city, country, referrer, device, path')
      .or('path.ilike.%hotsite%,path.ilike.%campanha%,path.ilike.%participe%')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (data && data.length > 0) {
      hotsiteVisits = data;
    }
  } catch {
    // ignore
  }

  // Mesclar com cache local de visitas se houver
  try {
    const rawVisits = localStorage.getItem('yah_hope_analytics_visits_cache_v2');
    if (rawVisits) {
      const localV: any[] = JSON.parse(rawVisits);
      const filtered = localV.filter(v => 
        v.path && (v.path.includes('campanha') || v.path.includes('hotsite') || v.path.includes('participe'))
      );
      hotsiteVisits = [...hotsiteVisits, ...filtered];
    }
  } catch {
    // ignore
  }

  // Se as visitas forem menores que os cliques/leads, unifica os visitor_ids dos eventos
  allEvents.forEach(e => {
    hotsiteVisits.push({
      visitor_id: e.visitor_id,
      created_at: e.created_at,
      city: e.city,
      country: e.country,
      referrer: e.referrer,
      device: e.device
    });
  });

  // Filtragem por Período
  const now = new Date();
  let startDate: Date;
  if (period === 'today') startDate = startOfDay(now);
  else if (period === '7d') startDate = subDays(now, 7);
  else if (period === '30d') startDate = subDays(now, 30);
  else if (period === '90d') startDate = subDays(now, 90);
  else startDate = new Date(2020, 0, 1);

  const filteredVisits = hotsiteVisits.filter(v => v.created_at && isAfter(parseISO(v.created_at), startDate));
  const filteredEvents = allEvents.filter(e => e.created_at && isAfter(parseISO(e.created_at), startDate));
  const filteredLeads = allLeads.filter(l => l.created_at && isAfter(parseISO(l.created_at), startDate));

  const totalVisits = filteredVisits.length || filteredEvents.length || filteredLeads.length;
  const uniqueVisitors = new Set(filteredVisits.map(v => v.visitor_id)).size || Math.max(1, filteredLeads.length);
  const totalClicks = filteredEvents.length;
  const totalLeads = filteredLeads.length;

  const conversionRate = uniqueVisitors > 0 ? Number(((totalLeads / uniqueVisitors) * 100).toFixed(1)) : 0;
  const clickThroughRate = totalVisits > 0 ? Number(((totalClicks / totalVisits) * 100).toFixed(1)) : 0;

  // Tendência diária
  const daysSpan = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const daysMap = new Map<string, { visits: number; clicks: number; leads: number }>();

  for (let i = daysSpan - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const key = format(d, 'yyyy-MM-dd');
    daysMap.set(key, { visits: 0, clicks: 0, leads: 0 });
  }

  filteredVisits.forEach(v => {
    const key = v.created_at.split('T')[0];
    if (daysMap.has(key)) daysMap.get(key)!.visits += 1;
  });

  filteredEvents.forEach(e => {
    const key = e.created_at.split('T')[0];
    if (daysMap.has(key)) daysMap.get(key)!.clicks += 1;
  });

  filteredLeads.forEach(l => {
    const key = (l.created_at || '').split('T')[0];
    if (daysMap.has(key)) daysMap.get(key)!.leads += 1;
  });

  const dailyTrend = Array.from(daysMap.entries()).map(([dateStr, val]) => ({
    date: dateStr,
    formattedDate: format(parseISO(dateStr), period === 'today' ? 'HH:mm' : 'dd/MM', { locale: ptBR }),
    visits: val.visits,
    clicks: val.clicks,
    leads: val.leads
  }));

  // Cliques por Botão
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

  // Distribuição de Idades / Faixas Etárias (a partir dos leads)
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
    volunteer: { label: 'Voluntário', color: '#F49853' },
    sponsor: { label: 'Apadrinhamento', color: '#92BF78' },
    donor: { label: 'Doação Financeira', color: '#3B82F6' },
    partner: { label: 'Empresa / Parceiro', color: '#8B5CF6' },
    other: { label: 'Outro', color: '#64748B' }
  };
  const interestCounts = new Map<string, number>();
  filteredLeads.forEach(l => {
    const key = l.interest_type || 'other';
    interestCounts.set(key, (interestCounts.get(key) || 0) + 1);
  });
  const interestsDistribution = Array.from(interestCounts.entries()).map(([key, count]) => {
    const meta = interestLabels[key] || { label: key, color: '#64748B' };
    return {
      name: meta.label,
      count,
      percentage: Number(((count / totalLeadCount) * 100).toFixed(1)),
      color: meta.color
    };
  });

  // Cidades
  const cityCounts = new Map<string, number>();
  [...filteredVisits, ...filteredEvents, ...filteredLeads].forEach(item => {
    const city = (item as any).city || 'São Paulo';
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
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

  // Países
  const countryCounts = new Map<string, number>();
  [...filteredVisits, ...filteredEvents, ...filteredLeads].forEach(item => {
    const country = (item as any).country || 'Brasil';
    countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
  });
  const topCountries = Array.from(countryCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / totalGeoCount) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Fontes de Tráfego
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

  // Dispositivos
  const deviceCounts = new Map<string, number>();
  [...filteredVisits, ...filteredEvents].forEach(item => {
    const dev = (item as any).device === 'mobile' ? 'Celular (Mobile)' : (item as any).device === 'tablet' ? 'Tablet' : 'Computador (Desktop)';
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
