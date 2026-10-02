import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  UserCheck, 
  TrendingUp, 
  Globe, 
  Clock, 
  Download, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Compass, 
  FileSpreadsheet, 
  FileCode, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  MapPin, 
  Calendar,
  Sparkles,
  BarChart2,
  ExternalLink
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  getAnalyticsData, 
  exportToCSV, 
  exportToJSON, 
  AnalyticsSummary 
} from '../../services/analyticsService';
import { cn } from '../../lib/utils';

export function AdminAnalyticsDashboard() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [activeGeoTab, setActiveGeoTab] = useState<'countries' | 'cities'>('countries');

  useEffect(() => {
    loadData(period);
  }, [period]);

  const loadData = async (selectedPeriod: 'today' | '7d' | '30d' | '90d' | 'all') => {
    setLoading(true);
    try {
      const summary = await getAnalyticsData(selectedPeriod);
      setData(summary);
    } catch (err) {
      console.error('Erro ao carregar dados de analytics:', err);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Controles */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Monitoramento Ativo
            </span>
            <span className="text-xs text-slate-400 font-medium">| Tempo real & Histórico</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard de Acessos & Audiência
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 font-medium">
            Métricas de tráfego, páginas populares, perfil demográfico, cidades e novos cadastros.
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
            <RefreshCw size={18} className={cn(loading && 'animate-spin text-amber-500')} />
          </button>

          {/* Botão de Exportação */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              <Download size={16} />
              Exportar Dados
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
                    <p className="text-[11px] text-slate-400">Ideal para relatórios e BI</p>
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
        </div>
      </div>

      {/* Cards de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Pageviews */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Acessos</span>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Eye size={22} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">
              {data?.totalPageviews.toLocaleString('pt-BR') || '0'}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={14} className="mr-0.5" />
              +{data?.pageviewsGrowth}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Visualizações totais de página</p>
        </div>

        {/* Visitantes Únicos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Visitantes Únicos</span>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Users size={22} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">
              {data?.uniqueVisitors.toLocaleString('pt-BR') || '0'}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={14} className="mr-0.5" />
              +{data?.visitorsGrowth}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Dispositivos individuais no período</p>
        </div>

        {/* Novos Cadastros */}
        {/* Apoiadores Cadastrados */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Apoiadores Cadastrados</span>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">
              {data?.totalRegistrations.toLocaleString('pt-BR') || '0'}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={14} className="mr-0.5" />
              +{data?.registrationsGrowth}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Novos apoiadores e padrinhos ativos</p>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversão em Apoiadores</span>
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">
              {data?.conversionRate || '0'}%
            </span>
            <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {data?.avgDuration} méd.
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Visitantes que se tornaram apoiadores</p>
        </div>
      </div>

      {/* Gráfico Principal: Evolução de Acessos e Visitantes */}
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart2 className="text-amber-500" size={22} />
              Tendência de Acessos ao Longo do Tempo
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              Comparativo diário entre volume total de páginas vistas e visitantes únicos
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F49853]" />
              <span className="text-slate-600">Visualizações (Pageviews)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#88A1F2]" />
              <span className="text-slate-600">Visitantes Únicos</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          {data?.dailyTrend && data.dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F49853" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F49853" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#88A1F2" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#88A1F2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-800">
                          <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
                          <p className="flex items-center justify-between gap-4 text-[#F49853] font-bold">
                            <span>Visualizações:</span>
                            <span>{payload[0].value}</span>
                          </p>
                          <p className="flex items-center justify-between gap-4 text-[#88A1F2] font-bold">
                            <span>Visitantes:</span>
                            <span>{payload[1]?.value}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pageviews" 
                  stroke="#F49853" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPageviews)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#88A1F2" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorVisitors)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Carregando gráfico de evolução...
            </div>
          )}
        </div>
      </div>

      {/* Grid: Páginas Mais Acessadas & Faixa Etária */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Páginas Mais Acessadas */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="text-amber-500" size={22} />
                  Páginas Mais Acessadas
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
                  Conteúdos e seções com maior volume de tráfego
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {data?.topPages.length || 0} rotas
              </span>
            </div>

            <div className="space-y-4">
              {data?.topPages.slice(0, 6).map((page, index) => (
                <div key={page.path} className="group p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                          {page.title}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">{page.path}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-slate-900">{page.views.toLocaleString('pt-BR')}</p>
                      <p className="text-[11px] font-bold text-slate-400">{page.percentage}% do total</p>
                    </div>
                  </div>
                  {/* Barra de Progresso */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(page.percentage * 2.2, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Rastreamento contínuo de URLs públicas e internas</span>
            <span className="font-bold text-slate-600">100% das sessões</span>
          </div>
        </div>

        {/* Perfil dos Usuários e Membros Cadastrados */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="text-blue-500" size={22} />
                  Perfil dos Usuários & Membros
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
                  Distribuição real por papel e função cadastrada no sistema
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Usuários Reais
              </span>
            </div>

            <div className="space-y-4">
              {data?.ageDistribution.map(item => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span className="text-slate-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">
                        {item.count} {item.count === 1 ? 'usuário' : 'usuários'}
                      </span>
                      <span className="text-slate-900 w-12 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: item.color || '#F49853'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-3">
            <Sparkles size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900/80 leading-relaxed">
              <strong className="font-bold text-amber-900">Base Ativa no Sistema:</strong> Total de <strong>{data?.totalRegistrations || 0} usuário(s) e apoiador(es)</strong> cadastrado(s) no período selecionado.
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Geolocalização (Países / Cidades) & Canais / Dispositivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Geolocalização */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Globe className="text-emerald-500" size={22} />
                Geolocalização dos Acessos
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
                Origem geográfica dos acessos por país e principais cidades
              </p>
            </div>
            
            {/* Abas Países / Cidades */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setActiveGeoTab('countries')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                  activeGeoTab === 'countries'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                Países
              </button>
              <button
                onClick={() => setActiveGeoTab('cities')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-lg transition-all',
                  activeGeoTab === 'cities'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                Cidades
              </button>
            </div>
          </div>

          {activeGeoTab === 'countries' ? (
            <div className="space-y-3.5">
              {data?.topCountries.map((c) => (
                <div key={c.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" role="img" aria-label={c.name}>
                      {c.flag || '🌐'}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.count.toLocaleString('pt-BR')} visualizações</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">{c.percentage}%</span>
                    <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(c.percentage * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              {data?.topCities.map((city) => (
                <div key={city.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{city.name}</p>
                      <p className="text-xs text-slate-400">{city.country || 'Global'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">{city.count.toLocaleString('pt-BR')}</span>
                    <p className="text-[11px] font-bold text-slate-400">{city.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Canais de Origem & Dispositivos */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="text-purple-500" size={22} />
              Canais de Aquisição & Origem
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              De onde vieram os visitantes que acessaram a plataforma
            </p>
          </div>

          {/* Origens de Tráfego */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data?.trafficSources.map(source => (
              <div key={source.name} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color || '#64748B' }} />
                  {source.name}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900">{source.percentage}%</span>
                  <span className="text-[11px] text-slate-400 font-medium">{source.count}</span>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-slate-100" />

          {/* Dispositivos e Tecnologia */}
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <Smartphone size={16} className="text-slate-400" />
              Dispositivos Mais Utilizados
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {data?.devices.map(dev => (
                <div key={dev.name} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-xs font-bold text-slate-500 truncate">{dev.name.split(' ')[0]}</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{dev.percentage}%</p>
                  <p className="text-[10px] text-slate-400 font-medium">{dev.count} acessos</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Acessos Recentes em Tempo Real */}
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="text-amber-500" size={22} />
              Registro de Acessos Recentes
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              Últimas requisições capturadas pelo sistema em tempo real
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Dados Prontos para Uso
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <th className="pb-3 px-3">Data / Hora</th>
                <th className="pb-3 px-3">Página Acessada</th>
                <th className="pb-3 px-3">Origem</th>
                <th className="pb-3 px-3">Localização</th>
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
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
