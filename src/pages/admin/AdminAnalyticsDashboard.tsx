import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Eye, 
  MousePointerClick,
  UserCheck, 
  TrendingUp, 
  Globe, 
  Clock, 
  Download, 
  RefreshCw, 
  Smartphone, 
  Compass, 
  FileSpreadsheet, 
  FileCode, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  MapPin, 
  Sparkles,
  BarChart2,
  ExternalLink,
  Flame,
  Heart,
  Search,
  MessageCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  getAnalyticsData, 
  exportToCSV, 
  exportToJSON, 
  exportSiteLeadsToCSV,
  updateSiteLeadStatus,
  AnalyticsSummary,
  SiteLead
} from '../../services/analyticsService';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminAnalyticsDashboard() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [activeGeoTab, setActiveGeoTab] = useState<'cities' | 'countries'>('cities');
  const [activeDemoTab, setActiveDemoTab] = useState<'age' | 'roles'>('age');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'joined'>('all');
  const [interestFilter, setInterestFilter] = useState<'all' | 'sponsor' | 'volunteer' | 'partner' | 'donor'>('all');

  useEffect(() => {
    loadData(period);
  }, [period]);

  const loadData = async (selectedPeriod: 'today' | '7d' | '30d' | '90d' | 'all') => {
    setLoading(true);
    try {
      const summary = await getAnalyticsData(selectedPeriod);
      setData(summary);
    } catch (err) {
      console.error('Erro ao carregar dados de analytics do site:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    leadId: string,
    newStatus: 'new' | 'contacted' | 'joined',
    originTable?: SiteLead['origin_table']
  ) => {
    await updateSiteLeadStatus(leadId, newStatus, originTable);
    if (data) {
      const updatedLeads = data.recentLeads.map(l =>
        l.id === leadId ? { ...l, status: newStatus } : l
      );
      setData({ ...data, recentLeads: updatedLeads });
    }
  };

  const handleExportCSV = () => {
    if (data) {
      exportToCSV(data);
      setExportMenuOpen(false);
    }
  };

  const handleExportJSON = () => {
    if (data) {
      exportToJSON(data);
      setExportMenuOpen(false);
    }
  };

  const handleExportLeadsCSV = () => {
    if (filteredLeads.length > 0) {
      exportSiteLeadsToCSV(filteredLeads);
    }
  };

  const filteredLeads = (data?.recentLeads || []).filter(lead => {
    const matchSearch =
      (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone || '').includes(searchTerm) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.details || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchInterest = interestFilter === 'all' || lead.interest_type === interestFilter;
    return matchSearch && matchStatus && matchInterest;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Controles */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              yahhope.com
            </span>
            <span className="text-xs text-slate-400 font-medium">| Controle de Acessos, Cliques, SEO & Inscrições do Site</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Controle de Acessos do Site Oficial
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 font-medium">
            Acompanhe em tempo real quem acessou o site, páginas mais visitadas, onde clicaram, buscas do Google, cidades, faixas de idade e cadastros.
          </p>
        </div>

        {/* Barra de Filtro de Período & Ações */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Seletor de Período */}
          <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            {(
              [
                { id: 'today', label: 'Hoje' },
                { id: '7d', label: '7 dias' },
                { id: '30d', label: '30 dias' },
                { id: '90d', label: '90 dias' },
                { id: 'all', label: 'Tudo' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all',
                  period === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Botão de Atualizar */}
          <button
            onClick={() => loadData(period)}
            title="Atualizar métricas"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center bg-white shadow-sm"
          >
            <RefreshCw size={18} className={cn(loading && 'animate-spin text-[#F49853]')} />
          </button>

          {/* Botão de Exportação */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Download size={16} />
              <span>Exportar Relatório</span>
            </button>

            {exportMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setExportMenuOpen(false)}
              >
                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Formato de Exportação
                </div>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-800 text-left transition-colors font-medium"
                >
                  <FileSpreadsheet size={18} className="text-emerald-600" />
                  <div>
                    <p className="font-bold leading-tight">Planilha Excel / CSV</p>
                    <p className="text-[11px] text-slate-400">Acessos, páginas e cliques</p>
                  </div>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-800 text-left transition-colors font-medium"
                >
                  <FileCode size={18} className="text-blue-600" />
                  <div>
                    <p className="font-bold leading-tight">Dados Brutos JSON</p>
                    <p className="text-[11px] text-slate-400">Para integrações técnicas</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Ver Site Oficial */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <span>Ver Site no Ar</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Banner de Alternância Rápida com o Hotsite da Campanha */}
      <Link 
        to="/admin/hotsite"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-200/80 hover:border-amber-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F49853] to-amber-500 text-white flex items-center justify-center shadow-md shadow-[#F49853]/25 group-hover:scale-105 transition-transform shrink-0">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-base font-black text-slate-900 group-hover:text-[#F49853] transition-colors flex items-center gap-2 flex-wrap">
              <span>Ver Controle Isolado do Hotsite da Campanha</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200/80">
                campanha.yahhope.com
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Painel dedicado exclusivamente ao hotsite de campanha isolado.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#F49853] group-hover:translate-x-1 transition-transform shrink-0 self-end sm:self-auto">
          <span>Abrir Painel do Hotsite</span>
          <ArrowUpRight size={16} />
        </div>
      </Link>

      {/* Cards de Métricas Principais (KPIs) — Mesmo padrão visual do Hotsite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total de Acessos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Acessos</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#F49853] flex items-center justify-center">
              <Eye size={20} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">
              {data?.totalPageviews.toLocaleString('pt-BR') || 0}
            </div>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={14} className="mr-0.5" />
              +{data?.pageviewsGrowth || 0}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            <strong className="text-slate-700">{data?.uniqueVisitors.toLocaleString('pt-BR') || 0}</strong> visitantes únicos no site
          </p>
        </div>

        {/* 2. Pessoas que Clicaram */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pessoas que Clicaram</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MousePointerClick size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {data?.totalClicks.toLocaleString('pt-BR') || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Taxa de engajamento: <strong className="text-blue-600">{data?.clickThroughRate || 0}%</strong>
          </p>
        </div>

        {/* 3. Pessoas que Querem Fazer Parte / Cadastros no Site */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Querem Fazer Parte</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">
              {data?.totalRegistrations.toLocaleString('pt-BR') || 0}
            </div>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={14} className="mr-0.5" />
              +{data?.registrationsGrowth || 0}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Mantenedores, voluntários e empresas parceiras
          </p>
        </div>

        {/* 4. Taxa de Conversão & Sessão */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taxa de Conversão</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">
              {data?.conversionRate || 0}%
            </div>
            <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {data?.avgDuration || '-'} méd.
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Visitantes do site que se cadastraram
          </p>
        </div>
      </div>

      {/* Gráfico de Evolução Diária: Acessos, Cliques e Cadastros */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart2 className="text-[#F49853]" size={22} />
              Evolução de Acessos, Cliques e Inscrições no Site
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Histórico diário de visualizações das páginas públicas comparado aos cliques e cadastros.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F49853]" />
              <span>Acessos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Cliques</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Cadastros</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSiteVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F49853" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#F49853" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSiteClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSiteLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="formattedDate" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="pageviews" name="Acessos" stroke="#F49853" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSiteVisits)" />
              <Area type="monotone" dataKey="clicks" name="Cliques" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSiteClicks)" />
              <Area type="monotone" dataKey="registrations" name="Cadastros" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSiteLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid de 3 Colunas: Faixas de Idade, De Onde Vieram (Cidades/Países), Origem do Tráfego (SEO Google / Redes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Faixas de Idade & Perfil Demográfico */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-[#F49853]" />
                {activeDemoTab === 'age' ? 'Faixas de Idade' : 'Perfil de Membros'}
              </h3>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setActiveDemoTab('age')}
                  className={cn(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-all',
                    activeDemoTab === 'age' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  )}
                >
                  Idades
                </button>
                <button
                  onClick={() => setActiveDemoTab('roles')}
                  className={cn(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-all',
                    activeDemoTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  )}
                >
                  Perfis
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              {activeDemoTab === 'age'
                ? 'Distribuição etária e perfil dos participantes que interagiram no site.'
                : 'Distribuição por categoria de apoiadores e voluntários cadastrados.'}
            </p>

            <div className="space-y-3.5">
              {(activeDemoTab === 'age' ? data?.ageDistribution || [] : data?.userRolesDistribution || []).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="text-slate-500">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(item.percentage, 4)}%`, backgroundColor: item.color || '#F49853' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. De Onde Vieram (Cidades & Países) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-500" />
                De Onde Vieram
              </h3>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setActiveGeoTab('cities')}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-bold rounded-md transition-all',
                    activeGeoTab === 'cities' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  )}
                >
                  Cidades
                </button>
                <button
                  onClick={() => setActiveGeoTab('countries')}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-bold rounded-md transition-all',
                    activeGeoTab === 'countries' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  )}
                >
                  Países
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Localização geográfica dos visitantes das páginas públicas do site.
            </p>

            {activeGeoTab === 'cities' ? (
              <div className="space-y-2.5">
                {(data?.topCities || []).slice(0, 6).map((city, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block leading-tight">{city.name}</span>
                        {city.country && <span className="text-[10px] text-slate-400">{city.country}</span>}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {city.count} ({city.percentage}%)
                    </span>
                  </div>
                ))}
                {(data?.topCities || []).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Nenhuma cidade registrada no período.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {(data?.topCountries || []).slice(0, 6).map((country, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{country.flag || '🌐'}</span>
                      <span className="text-xs font-bold text-slate-800">{country.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {country.count} ({country.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Origem do Tráfego (Buscas no Google / SEO, Instagram, WhatsApp, Direto) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Globe size={18} className="text-blue-500" />
                Origem do Tráfego & SEO
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Canais</span>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Por onde os visitantes encontraram o site (Google, Instagram, WhatsApp, Direto).
            </p>

            <div className="space-y-2.5">
              {(data?.trafficSources || []).slice(0, 6).map((src, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color || '#64748B' }} />
                    <span className="text-xs font-bold text-slate-800">{src.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {src.count} ({src.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini resumo de Dispositivos */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1">
                <Smartphone size={12} /> Dispositivos
              </span>
              <span>Taxa Rejeição: {data?.bounceRate || '0%'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(data?.devices || []).map(dev => (
                <div key={dev.name} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-500 truncate">{dev.name.split(' ')[0]}</p>
                  <p className="text-xs font-black text-slate-900">{dev.percentage}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Páginas Públicas Mais Acessadas & Onde as Pessoas Mais Clicaram no Site */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Páginas Públicas Mais Acessadas do Site */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-[#F49853]" />
                  Páginas Públicas Mais Acessadas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quais páginas do site oficial recebem maior volume de visitantes.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {data?.topPages.length || 0} páginas
              </span>
            </div>

            <div className="space-y-3.5">
              {(data?.topPages || []).slice(0, 7).map((page, index) => (
                <div key={page.path} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{page.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{page.path}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                        {page.views.toLocaleString('pt-BR')} acessos
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {page.uniqueViews} únicos ({page.percentage}%)
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#F49853] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(page.percentage * 1.8, 4), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(data?.topPages || []).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum acesso registrado neste período.</p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Onde as Pessoas Mais Clicaram no Site & Como Preferem Fazer Parte */}
        <div className="space-y-6">
          {/* Onde Mais Clicaram */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <MousePointerClick size={18} className="text-blue-600" />
              Onde as Pessoas Mais Clicaram no Site
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Botões e chamadas para ação (CTAs) mais acionados pelos visitantes nas páginas públicas.
            </p>

            <div className="space-y-2.5">
              {(data?.clicksByButton || []).slice(0, 5).map((btn, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{btn.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      Página: {btn.pageTitle} ({btn.path})
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 shrink-0">
                    {btn.count} {btn.count === 1 ? 'clique' : 'cliques'} ({btn.percentage}%)
                  </span>
                </div>
              ))}
              {(data?.clicksByButton || []).length === 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-400 text-center">
                  Os cliques em botões das páginas públicas aparecerão aqui conforme os visitantes interagirem com o site.
                </div>
              )}
            </div>
          </div>

          {/* Como as Pessoas Preferem Fazer Parte */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <Heart size={18} className="text-[#F49853]" />
              Como as Pessoas Preferem Fazer Parte pelo Site
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribuição das modalidades escolhidas nos formulários e páginas públicas.
            </p>

            <div className="space-y-2.5">
              {(data?.interestsDistribution || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-slate-800">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Completa: Pessoas que Querem Fazer Parte / Cadastros do Site */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900">
                Pessoas que Interagiram & Querem Fazer Parte pelo Site
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {filteredLeads.length} registros
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Central unificada de voluntários, empresas parceiras, mantenedores e interessados cadastrados nas páginas públicas do site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Buscar nome, empresa, cidade ou telefone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#F49853] outline-none transition-all w-64"
              />
            </div>

            {/* Filtro de Modalidade */}
            <select
              value={interestFilter}
              onChange={e => setInterestFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 text-slate-700 font-semibold outline-none"
            >
              <option value="all">Todas as Modalidades</option>
              <option value="sponsor">Mantenedor / Apadrinhamento</option>
              <option value="volunteer">Voluntariado</option>
              <option value="partner">Empresas Parceiras</option>
              <option value="donor">Doação</option>
            </select>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 text-slate-700 font-semibold outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="new">Novos</option>
              <option value="contacted">Em Contato</option>
              <option value="joined">Fizeram Parte</option>
            </select>

            {/* Exportar CSV dos Cadastros */}
            <button
              onClick={handleExportLeadsCSV}
              disabled={filteredLeads.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50"
            >
              <Download size={14} />
              <span>Exportar Cadastros CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nome / Empresa & Contato</th>
                <th className="py-3 px-4">Perfil / Idade</th>
                <th className="py-3 px-4">De Onde (Cidade)</th>
                <th className="py-3 px-4">Modalidade</th>
                <th className="py-3 px-4">Detalhes / Áreas</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum cadastro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, idx) => {
                  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
                  const waLink = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}?text=${encodeURIComponent(`Olá ${lead.name}! Tudo bem? Vimos seu cadastro pelo site da YAH Hope (${lead.interest_label}). Ficamos muito felizes com seu contato!`)}`
                    : null;

                  return (
                    <tr key={lead.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-sm">{lead.name}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5 flex-wrap">
                          {lead.phone && <span>{lead.phone}</span>}
                          {lead.email && <span>• {lead.email}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {lead.age_range || 'Não informada'}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span>{lead.city}{lead.state ? ` - ${lead.state}` : ''}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold inline-block",
                          lead.interest_type === 'volunteer' && "bg-amber-100 text-amber-800",
                          lead.interest_type === 'sponsor' && "bg-emerald-100 text-emerald-800",
                          lead.interest_type === 'donor' && "bg-blue-100 text-blue-800",
                          lead.interest_type === 'partner' && "bg-purple-100 text-purple-800"
                        )}>
                          {lead.interest_label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-[220px] truncate" title={lead.details}>
                        {lead.details || <span className="text-slate-300 italic">Sem detalhes</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {lead.created_at ? format(parseISO(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status || 'new'}
                          onChange={e => handleStatusChange(lead.id, e.target.value as any, lead.origin_table)}
                          className={cn(
                            "text-[11px] font-bold px-2 py-1 rounded-lg border outline-none",
                            lead.status === 'new' && "bg-amber-50 text-amber-700 border-amber-200",
                            lead.status === 'contacted' && "bg-blue-50 text-blue-700 border-blue-200",
                            lead.status === 'joined' && "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          <option value="new">Novo</option>
                          <option value="contacted">Em Contato</option>
                          <option value="joined">Fez Parte</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">Sem telefone</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro de Acessos Recentes em Tempo Real */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="text-[#F49853]" size={22} />
              Registro de Acessos Recentes ao Site
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              Últimos visitantes das páginas públicas capturados em tempo real (incluindo origem de busca Google / redes sociais)
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Monitoramento do Site Ativo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <th className="pb-3 px-3">Data / Hora</th>
                <th className="pb-3 px-3">Página Pública Acessada</th>
                <th className="pb-3 px-3">Origem (Canal / Busca)</th>
                <th className="pb-3 px-3">De Onde (Cidade / País)</th>
                <th className="pb-3 px-3">Dispositivo / Navegador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentVisits && data.recentVisits.length > 0 ? (
                data.recentVisits.map((visit, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {new Date(visit.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(visit.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{visit.page_title}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{visit.path}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                        visit.referrer === 'Google' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        visit.referrer === 'Instagram' ? "bg-pink-50 text-pink-700 border border-pink-200" :
                        visit.referrer === 'WhatsApp' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {visit.referrer}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {visit.city}, {visit.country}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">
                      {visit.device === 'mobile' ? '📱 Celular' : visit.device === 'tablet' ? '📟 Tablet' : '💻 Computador'} • {visit.browser}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Nenhum acesso registrado ainda neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
