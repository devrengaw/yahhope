import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  MousePointerClick, 
  UserCheck, 
  TrendingUp, 
  Globe, 
  MapPin, 
  Calendar, 
  Download, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  MessageCircle, 
  Heart, 
  HandHeart, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  ArrowUpRight, 
  Share2, 
  ExternalLink,
  Flame,
  BadgeCheck
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
  getCampaignAnalytics, 
  exportLeadsToCSV, 
  updateLeadStatus, 
  CampaignAnalyticsSummary, 
  CampaignLead 
} from '../../services/campaignTrackingService';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CampaignHotsiteAdmin() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CampaignAnalyticsSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'joined'>('all');

  useEffect(() => {
    loadData(period);
  }, [period]);

  const loadData = async (selectedPeriod: 'today' | '7d' | '30d' | '90d' | 'all') => {
    setLoading(true);
    try {
      const summary = await getCampaignAnalytics(selectedPeriod);
      setData(summary);
    } catch (err) {
      console.error('Erro ao carregar dados do hotsite:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: 'new' | 'contacted' | 'joined') => {
    await updateLeadStatus(leadId, newStatus);
    if (data) {
      const updatedLeads = data.recentLeads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
      setData({ ...data, recentLeads: updatedLeads });
    }
  };

  const handleExportCSV = () => {
    if (data && data.recentLeads) {
      exportLeadsToCSV(data.recentLeads);
    }
  };

  const filteredLeads = (data?.recentLeads || []).filter(lead => {
    const matchSearch = 
      (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone || '').includes(searchTerm) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header com Ações & Atalhos */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Flame size={14} className="text-[#F49853]" />
              campanha.yahhope.com
            </span>
            <span className="text-xs text-slate-400 font-medium">| Controle de Acessos & Inscrições</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Controle do Hotsite da Campanha
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 font-medium">
            Acompanhe em tempo real quem acessou, quantos clicaram, de onde vieram, faixas de idade e pessoas que querem fazer parte.
          </p>
        </div>

        {/* Controles de Período e Ações */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
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

          <button
            onClick={() => loadData(period)}
            title="Atualizar dados"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center bg-white shadow-sm"
          >
            <RefreshCw size={18} className={cn(loading && 'animate-spin text-[#F49853]')} />
          </button>

          <a
            href="/campanha-yahhope"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Ver Hotsite no Ar</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Cards de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total de Acessos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Acessos</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#F49853] flex items-center justify-center">
              <Eye size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {data?.totalVisits.toLocaleString('pt-BR') || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {data?.uniqueVisitors.toLocaleString('pt-BR') || 0} visitantes únicos no período
          </p>
        </div>

        {/* Quantas Pessoas Clicaram */}
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

        {/* Pessoas que Querem Fazer Parte (Leads) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Querem Fazer Parte</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {data?.totalLeads.toLocaleString('pt-BR') || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Formulários preenchidos com sucesso
          </p>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taxa de Conversão</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {data?.conversionRate || 0}%
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Visitantes que se inscreveram no projeto
          </p>
        </div>
      </div>

      {/* Gráfico de Evolução Diária */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Evolução de Acessos, Cliques e Inscrições</h2>
            <p className="text-xs sm:text-sm text-slate-500">Histórico de visualizações comparado aos cliques e cadastros diários.</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
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
              <span>Inscrições</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F49853" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#F49853" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="visits" name="Acessos" stroke="#F49853" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
              <Area type="monotone" dataKey="clicks" name="Cliques" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
              <Area type="monotone" dataKey="leads" name="Inscrições" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid de 3 Colunas: Faixas de Idade, De Onde Vieram (Cidades), Origem do Tráfego */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Faixas de Idade (Requisito Explícito) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-[#F49853]" />
                Faixas de Idade
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Demografia</span>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Idade dos interessados que preencheram o formulário de acolhimento.
            </p>

            <div className="space-y-3.5">
              {(data?.ageDistribution || []).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="text-slate-500">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(item.percentage, 4)}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. De Onde Vieram (Cidades / Localização - Requisito Explícito) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-500" />
                De Onde Vieram (Cidades)
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Geografia</span>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Localização detectada de acessos e leads da campanha.
            </p>

            <div className="space-y-3">
              {(data?.topCities || []).slice(0, 6).map((city, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{city.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {city.count} ({city.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Origem do Tráfego / Canais */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Globe size={18} className="text-blue-500" />
                Origem do Tráfego
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Canais</span>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              De quais redes ou links as pessoas chegaram ao hotsite.
            </p>

            <div className="space-y-3">
              {(data?.trafficSources || []).slice(0, 6).map((src, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }} />
                    <span className="text-xs font-bold text-slate-800">{src.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {src.count} ({src.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Secundário: Botões Mais Clicados & Interesses Mais Escolhidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Botões Mais Clicados */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
            <MousePointerClick size={18} className="text-amber-500" />
            Onde as Pessoas Mais Clicaram no Hotsite
          </h3>
          <p className="text-xs text-slate-500 mb-4">Contagem de ações e engajamento por cada botão.</p>

          <div className="space-y-2.5">
            {(data?.clicksByButton || []).slice(0, 5).map((btn, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-800">{btn.label}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  {btn.count} cliques
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modalidade de Interesse Mais Escolhida */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
            <Heart size={18} className="text-[#F49853]" />
            Como as Pessoas Preferem Fazer Parte
          </h3>
          <p className="text-xs text-slate-500 mb-4">Distribuição das preferências nos cadastros.</p>

          <div className="space-y-2.5">
            {(data?.interestsDistribution || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-800">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {item.count} pessoas ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Pessoas que Querem Fazer Parte (Leads do Hotsite) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Pessoas que Querem Fazer Parte</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {filteredLeads.length} cadastros
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Lista completa de pessoas que se cadastraram no hotsite com contato, idade, cidade e interesse.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Buscar por nome, cidade ou telefone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#F49853] outline-none transition-all w-64"
              />
            </div>

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

            {/* Exportar CSV */}
            <button
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50"
            >
              <Download size={14} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nome & Contato</th>
                <th className="py-3 px-4">Idade</th>
                <th className="py-3 px-4">De Onde (Cidade)</th>
                <th className="py-3 px-4">Interesse</th>
                <th className="py-3 px-4">Mensagem</th>
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
                  const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${lead.name}! Tudo bem? Vimos seu contato pelo hotsite da YAH Hope para participar como ${lead.interest_type}. Ficamos muito felizes com seu interesse!`)}` : null;

                  return (
                    <tr key={lead.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-sm">{lead.name}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                          <span>{lead.phone}</span>
                          {lead.email && <span>• {lead.email}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {lead.age_range || (lead.age ? `${lead.age} anos` : 'Não informada')}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{lead.city}{lead.state ? ` - ${lead.state}` : ''}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold inline-block",
                          lead.interest_type === 'volunteer' && "bg-amber-100 text-amber-800",
                          lead.interest_type === 'sponsor' && "bg-emerald-100 text-emerald-800",
                          lead.interest_type === 'donor' && "bg-blue-100 text-blue-800",
                          lead.interest_type === 'partner' && "bg-purple-100 text-purple-800",
                          lead.interest_type === 'other' && "bg-slate-100 text-slate-700",
                        )}>
                          {lead.interest_type === 'volunteer' ? 'Voluntário' :
                           lead.interest_type === 'sponsor' ? 'Apadrinhamento' :
                           lead.interest_type === 'donor' ? 'Doação' :
                           lead.interest_type === 'partner' ? 'Empresa / Parceria' : 'Outro'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate" title={lead.message}>
                        {lead.message || <span className="text-slate-300 italic">Sem mensagem</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {lead.created_at ? format(parseISO(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status || 'new'}
                          onChange={e => handleStatusChange(lead.id!, e.target.value as any)}
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
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
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
    </div>
  );
}
