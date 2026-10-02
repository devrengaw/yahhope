import { supabase } from '../lib/supabase';
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

export interface DayMetric {
  date: string;
  formattedDate: string;
  pageviews: number;
  visitors: number;
  registrations: number;
}

export interface PageStat {
  path: string;
  title: string;
  views: number;
  uniqueViews: number;
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
  totalRegistrations: number;
  registrationsGrowth: number;
  conversionRate: number;
  avgDuration: string;
  bounceRate: string;
  dailyTrend: DayMetric[];
  topPages: PageStat[];
  ageDistribution: DemographyItem[];
  topCountries: GeoItem[];
  topCities: GeoItem[];
  trafficSources: DemographyItem[];
  devices: DemographyItem[];
  browsers: DemographyItem[];
  recentVisits: VisitRecord[];
}

const STORAGE_KEY_VISITS = 'yah_hope_analytics_visits_cache_v2';
const STORAGE_KEY_VISITOR = 'yah_hope_analytics_visitor_id';
const STORAGE_KEY_GEO = 'yah_hope_analytics_geo_cache';

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

// Friendly page title mapping
export function getFriendlyPageTitle(path: string): string {
  if (path === '/') return 'Página Inicial (Home)';
  if (path === '/campanha') return 'Campanha Nutrição';
  if (path === '/projetos') return 'Projetos Sociais';
  if (path === '/blog' || path.startsWith('/blog/')) return 'Blog & Notícias';
  if (path === '/loja') return 'Loja Solidária';
  if (path === '/apoiador') return 'Portal do Apoiador / Seja Membro';
  if (path === '/cadastro-apadrinhador') return 'Cadastro de Padrinho';
  if (path === '/login') return 'Login de Usuários';
  if (path.startsWith('/portal')) return 'Portal Interno do Doador';
  if (path.startsWith('/admin')) return 'Área de Gestão (Admin)';
  if (path.startsWith('/nutrition')) return 'Módulo Nutrição Clínica';
  if (path.startsWith('/workspace')) return 'Workspace Operacional';
  return path;
}

// Geolocation with cache
async function getGeoLocation(): Promise<{ country: string; city: string }> {
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
    const res = await fetch('https://ipwho.is/?fields=country,city,success', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const geo = {
          country: data.country || 'Brasil',
          city: data.city || 'São Paulo'
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
  return { country: 'Brasil', city: 'São Paulo' };
}

// Rastrear visualização de página
export async function trackPageView(path: string, customTitle?: string, userId?: string): Promise<void> {
  // Avoid tracking internal noise or duplicate rapid fires
  if (path === '/campanha-display') return;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const pageTitle = customTitle || getFriendlyPageTitle(path);
  
  let referrer = document.referrer ? new URL(document.referrer).hostname : 'Direto';
  if (referrer.includes('google')) referrer = 'Google';
  else if (referrer.includes('instagram')) referrer = 'Instagram';
  else if (referrer.includes('facebook')) referrer = 'Facebook';
  else if (referrer.includes('whatsapp') || referrer.includes('wa.me')) referrer = 'WhatsApp';
  else if (referrer.includes('linkedin')) referrer = 'LinkedIn';
  else if (referrer === window.location.hostname || !referrer) referrer = 'Direto';

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

  // 1. Save in local buffer (always succeeds and guarantees instant responsiveness)
  try {
    const rawCache = localStorage.getItem(STORAGE_KEY_VISITS);
    const cachedList: VisitRecord[] = rawCache ? JSON.parse(rawCache) : [];
    cachedList.unshift(visit);
    // Keep max 2000 visits in local cache
    if (cachedList.length > 2000) cachedList.length = 2000;
    localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(cachedList));
  } catch (err) {
    console.warn('Analytics local cache write error:', err);
  }

  // 2. Persist to Supabase in background (silently catch network errors or missing table)
  try {
    await supabase.from('site_visits').insert([visit]);
  } catch {
    // If Supabase table isn't created yet or network offline, gracefully do nothing
  }
}

// Carrega os dados analíticos agregados para exibição no dashboard
export async function getAnalyticsData(period: 'today' | '7d' | '30d' | '90d' | 'all'): Promise<AnalyticsSummary> {
  // Limpa qualquer cache de seed mock residual que tenha sido gravado anteriormente
  try {
    localStorage.removeItem('yah_hope_seed_visits_v1');
  } catch {
    // ignore
  }

  let allVisits: VisitRecord[] = [];

  // 1. Tenta carregar visitas reais do Supabase
  try {
    const { data, error } = await supabase
      .from('site_visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);
      
    if (!error && data && data.length > 0) {
      allVisits = data as VisitRecord[];
    }
  } catch {
    // ignore
  }

  // 2. Mescla com visitas reais capturadas localmente neste navegador
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

  // Remove duplicatas se houver
  const uniqueKeys = new Set<string>();
  allVisits = allVisits.filter(v => {
    const key = `${v.visitor_id}_${v.created_at}_${v.path}`;
    if (uniqueKeys.has(key)) return false;
    uniqueKeys.add(key);
    return true;
  });

  // Filtrar por período atual
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
    const vDate = parseISO(v.created_at);
    return isAfter(vDate, startDate);
  });

  const totalPageviews = filteredVisits.length;
  const uniqueVisitors = new Set(filteredVisits.map(v => v.visitor_id)).size;

  // Visitas do período anterior para cálculo real de crescimento
  const priorVisits = period === 'all' ? [] : allVisits.filter(v => {
    const vDate = parseISO(v.created_at);
    return isAfter(vDate, priorStartDate) && !isAfter(vDate, startDate);
  });
  const priorPageviews = priorVisits.length;
  const priorUniqueVisitors = new Set(priorVisits.map(v => v.visitor_id)).size;

  const pageviewsGrowth = priorPageviews > 0
    ? Number((((totalPageviews - priorPageviews) / priorPageviews) * 100).toFixed(1))
    : (totalPageviews > 0 ? 100 : 0);

  const visitorsGrowth = priorUniqueVisitors > 0
    ? Number((((uniqueVisitors - priorUniqueVisitors) / priorUniqueVisitors) * 100).toFixed(1))
    : (uniqueVisitors > 0 ? 100 : 0);

  // Carregar usuários reais da tabela users (com contagem no período e perfis)
  let totalRegistrations = 0;
  let priorRegistrations = 0;
  let userRolesList: DemographyItem[] = [];

  try {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, role, department, created_at');

    if (usersData) {
      // Cadastros no período atual
      const currentPeriodUsers = period === 'all'
        ? usersData
        : usersData.filter(u => u.created_at && isAfter(parseISO(u.created_at), startDate));
      totalRegistrations = currentPeriodUsers.length;

      // Cadastros no período anterior
      if (period !== 'all') {
        const priorPeriodUsers = usersData.filter(u => {
          if (!u.created_at) return false;
          const uDate = parseISO(u.created_at);
          return isAfter(uDate, priorStartDate) && !isAfter(uDate, startDate);
        });
        priorRegistrations = priorPeriodUsers.length;
      }

      // Distribuição real por papel/função
      const roleCounts = new Map<string, number>();
      usersData.forEach(u => {
        const role = u.role || 'USER';
        roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
      });

      const roleLabels: Record<string, { label: string; color: string }> = {
        ADMIN: { label: 'Administradores', color: '#0F172A' },
        USER: { label: 'Apoiadores / Membros', color: '#92BF78' },
        VOLUNTEER: { label: 'Voluntários', color: '#F49853' },
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
  } catch (err) {
    console.warn('Erro ao carregar usuários reais para analytics:', err);
  }

  if (userRolesList.length === 0) {
    userRolesList = [
      { name: 'Nenhum usuário cadastrado', count: 0, percentage: 0, color: '#94A3B8' }
    ];
  }

  const registrationsGrowth = priorRegistrations > 0
    ? Number((((totalRegistrations - priorRegistrations) / priorRegistrations) * 100).toFixed(1))
    : (totalRegistrations > 0 ? 100 : 0);

  const conversionRate = uniqueVisitors > 0
    ? Number(((totalRegistrations / uniqueVisitors) * 100).toFixed(1))
    : 0;

  // Agrupar por data (Daily trend) com dados reais
  const daysMap = new Map<string, { pageviews: number; visitorsSet: Set<string>; registrations: number }>();
  const daysSpan = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;

  for (let i = daysSpan - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const key = format(d, 'yyyy-MM-dd');
    daysMap.set(key, {
      pageviews: 0,
      visitorsSet: new Set<string>(),
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

  const dailyTrend: DayMetric[] = Array.from(daysMap.entries()).map(([dateStr, val]) => {
    const dObj = parseISO(dateStr);
    return {
      date: dateStr,
      formattedDate: format(dObj, period === 'today' ? 'HH:mm' : 'dd/MM', { locale: ptBR }),
      pageviews: val.pageviews,
      visitors: val.visitorsSet.size,
      registrations: val.registrations
    };
  });

  // Páginas mais acessadas reais
  const pageMap = new Map<string, { title: string; views: number; visitors: Set<string> }>();
  filteredVisits.forEach(v => {
    const key = v.path;
    const current = pageMap.get(key) || { title: v.page_title, views: 0, visitors: new Set<string>() };
    current.views += 1;
    current.visitors.add(v.visitor_id);
    pageMap.set(key, current);
  });

  const topPages: PageStat[] = Array.from(pageMap.entries())
    .map(([path, data]) => ({
      path,
      title: data.title || getFriendlyPageTitle(path),
      views: data.views,
      uniqueViews: data.visitors.size,
      percentage: totalPageviews > 0 ? Number(((data.views / totalPageviews) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.views - a.views);

  // Demografia: usa a lista real de perfis de usuários cadastrados
  const ageDistribution: DemographyItem[] = userRolesList;

  // Geolocalização: Países reais
  const countryMap = new Map<string, number>();
  filteredVisits.forEach(v => {
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

  const topCountries: GeoItem[] = Array.from(countryMap.entries())
    .map(([country, count]) => ({
      name: country,
      flag: flags[country] || '🌐',
      count,
      percentage: totalPageviews > 0 ? Number(((count / totalPageviews) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Geolocalização: Cidades reais
  const cityMap = new Map<string, { country: string; count: number }>();
  filteredVisits.forEach(v => {
    const c = v.city || 'Desconhecida';
    const current = cityMap.get(c) || { country: v.country || 'Brasil', count: 0 };
    current.count += 1;
    cityMap.set(c, current);
  });

  const topCities: GeoItem[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({
      name: city,
      country: data.country,
      count: data.count,
      percentage: totalPageviews > 0 ? Number(((data.count / totalPageviews) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Origem de tráfego real
  const refMap = new Map<string, number>();
  filteredVisits.forEach(v => {
    const r = v.referrer || 'Direto';
    refMap.set(r, (refMap.get(r) || 0) + 1);
  });

  const refColors: Record<string, string> = {
    'Instagram': '#E1306C',
    'Google': '#4285F4',
    'Direto': '#92BF78',
    'WhatsApp': '#25D366',
    'Facebook': '#1877F2',
    'LinkedIn': '#0A66C2'
  };

  const trafficSources: DemographyItem[] = Array.from(refMap.entries())
    .map(([source, count]) => ({
      name: source,
      count,
      percentage: totalPageviews > 0 ? Number(((count / totalPageviews) * 100).toFixed(1)) : 0,
      color: refColors[source] || '#64748B'
    }))
    .sort((a, b) => b.count - a.count);

  // Dispositivos reais
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

  // Navegadores reais
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

  // Cálculo de Rejeição (Bounce Rate) e Duração Média reais por sessão
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
    totalRegistrations,
    registrationsGrowth,
    conversionRate,
    avgDuration,
    bounceRate,
    dailyTrend,
    topPages,
    ageDistribution,
    topCountries,
    topCities,
    trafficSources,
    devices,
    browsers,
    recentVisits: filteredVisits.slice(0, 15)
  };
}

// Exportar relatório em formato CSV
export function exportToCSV(data: AnalyticsSummary): void {
  const periodLabel = 
    data.period === 'today' ? 'Hoje' :
    data.period === '7d' ? 'Ultimos_7_dias' :
    data.period === '30d' ? 'Ultimos_30_dias' :
    data.period === '90d' ? 'Ultimos_90_dias' : 'Todo_o_periodo';

  let csvContent = '\uFEFF'; // UTF-8 BOM

  csvContent += '=== RELATÓRIO DE ACESSOS E AUDIÊNCIA - YAH HOPE ===\n';
  csvContent += `Período:;${periodLabel}\n`;
  csvContent += `Gerado em:;${new Date().toLocaleString('pt-BR')}\n\n`;

  csvContent += '--- RESUMO GERAL ---\n';
  csvContent += 'Métrica;Valor\n';
  csvContent += `Total de Visualizações (Pageviews);${data.totalPageviews}\n`;
  csvContent += `Visitantes Únicos;${data.uniqueVisitors}\n`;
  csvContent += `Novos Apoiadores Cadastrados;${data.totalRegistrations}\n`;
  csvContent += `Taxa de Conversão em Apoiadores;${data.conversionRate}%\n`;
  csvContent += `Duração Média da Sessão;${data.avgDuration}\n`;
  csvContent += `Taxa de Rejeição;${data.bounceRate}\n\n`;

  csvContent += '--- EVOLUÇÃO TEMPORAL DIÁRIA ---\n';
  csvContent += 'Data;Visualizações (Pageviews);Visitantes Únicos;Novos Apoiadores\n';
  data.dailyTrend.forEach(d => {
    csvContent += `${d.date};${d.pageviews};${d.visitors};${d.registrations}\n`;
  });
  csvContent += '\n';

  csvContent += '--- PÁGINAS MAIS ACESSADAS ---\n';
  csvContent += 'URL da Página;Nome da Página;Visualizações;Visitantes Únicos;% do Total\n';
  data.topPages.forEach(p => {
    csvContent += `"${p.path}";"${p.title}";${p.views};${p.uniqueViews};${p.percentage}%\n`;
  });
  csvContent += '\n';

  csvContent += '--- PERFIL DOS USUÁRIOS E APOIADORES CADASTRADOS ---\n';
  csvContent += 'Função / Papel;Quantidade de Usuários;% do Total\n';
  data.ageDistribution.forEach(a => {
    csvContent += `"${a.name}";${a.count};${a.percentage}%\n`;
  });
  csvContent += '\n';

  csvContent += '--- GEOLOCALIZAÇÃO: TOP PAÍSES ---\n';
  csvContent += 'País;Visualizações;% do Total\n';
  data.topCountries.forEach(c => {
    csvContent += `"${c.name}";${c.count};${c.percentage}%\n`;
  });
  csvContent += '\n';

  csvContent += '--- GEOLOCALIZAÇÃO: TOP CIDADES ---\n';
  csvContent += 'Cidade;País;Visualizações;% do Total\n';
  data.topCities.forEach(c => {
    csvContent += `"${c.name}";"${c.country}";${c.count};${c.percentage}%\n`;
  });
  csvContent += '\n';

  csvContent += '--- CANAIS DE AQUISIÇÃO / ORIGEM ---\n';
  csvContent += 'Canal;Visualizações;% do Total\n';
  data.trafficSources.forEach(s => {
    csvContent += `"${s.name}";${s.count};${s.percentage}%\n`;
  });
  csvContent += '\n';

  csvContent += '--- DISPOSITIVOS UTILIZADOS ---\n';
  csvContent += 'Dispositivo;Visualizações;% do Total\n';
  data.devices.forEach(dev => {
    csvContent += `"${dev.name}";${dev.count};${dev.percentage}%\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `yah_hope_acessos_${periodLabel}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar dados brutos em JSON
export function exportToJSON(data: AnalyticsSummary): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `yah_hope_analytics_${data.period}_${format(new Date(), 'yyyyMMdd_HHmm')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
