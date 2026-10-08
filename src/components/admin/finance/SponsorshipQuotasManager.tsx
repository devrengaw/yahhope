import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Users, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Settings2, 
  Save, 
  Search, 
  RefreshCw,
  UserCheck,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { sponsorshipService, SponsorshipMetrics } from '../../../services/sponsorshipService';
import { fetchAndSyncOrgSettings, saveOrgSettings } from '../../../services/organizationSettingsService';
import { cn } from '../../../lib/utils';

export function SponsorshipQuotasManager() {
  const [metrics, setMetrics] = useState<SponsorshipMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form de Parâmetros
  const [quotaCost, setQuotaCost] = useState<number>(90);
  const [maxSponsors, setMaxSponsors] = useState<number>(2);

  // Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'full'>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await sponsorshipService.getMetrics();
      setMetrics(data);
      setQuotaCost(data.quotaCost);
      setMaxSponsors(data.maxSponsorsPerChild);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const currentOrg = await fetchAndSyncOrgSettings();
      await saveOrgSettings({
        ...currentOrg,
        sponsorship_quota_cost: Number(quotaCost),
        max_sponsors_per_child: Number(maxSponsors)
      });

      await loadData();
      setSuccessMessage('Parâmetros de apadrinhamento atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar parâmetros:', err);
      alert('Erro ao salvar parâmetros');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredChildren = (metrics?.children || []).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.community && c.community.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === 'open') return matchesSearch && !c.isFull;
    if (filterStatus === 'full') return matchesSearch && c.isFull;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header com Descrição */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl shadow-orange-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-amber-100">
            <Heart size={14} fill="currentColor" /> Gestão de Quotização Solidária
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Quotização e Apadrinhamento de Crianças
          </h2>
          <p className="text-amber-50 text-sm sm:text-base font-medium leading-relaxed">
            Em vez de dividir a conta total por criança gerando um valor inviável, definimos cotas acessíveis para que múltiplos padrinhos acolham uma criança. Aqui você calibra o valor da cota, o teto de padrinhos e monitora a ocupação em tempo real.
          </p>
        </div>
      </div>

      {/* Formulário de Parametrização */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
              <Settings2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Parametrização do Apadrinhamento</h3>
              <p className="text-xs text-slate-400 font-medium">Defina as regras globais de custo e alocação</p>
            </div>
          </div>
          {successMessage && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl animate-in fade-in">
              <CheckCircle2 size={16} /> {successMessage}
            </div>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Valor da Cota Mensal (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
              <input 
                type="number"
                step="0.01"
                min="10"
                value={quotaCost}
                onChange={(e) => setQuotaCost(parseFloat(e.target.value) || 0)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 text-lg focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              Valor padrão que o padrinho paga por mês por criança/cota.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Máximo de Padrinhos por Criança
            </label>
            <div className="relative">
              <input 
                type="number"
                min="1"
                max="10"
                value={maxSponsors}
                onChange={(e) => setMaxSponsors(parseInt(e.target.value, 10) || 1)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 text-lg focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              Quantas cotas solidárias uma mesma criança pode ter (ex.: 2 ou 3).
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all disabled:opacity-50 active:scale-95"
            >
              <Save size={18} />
              {isSaving ? 'Salvando...' : 'Salvar Parâmetros'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Vagas de Cotas */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Users size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">
              {metrics?.totalChildren || 0} Crianças
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cotas Totais do Projeto</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {metrics?.totalSlots || 0} <span className="text-sm font-semibold text-slate-400">vagas</span>
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium flex justify-between">
            <span>Multiplicador:</span>
            <strong className="text-slate-700">{metrics?.maxSponsorsPerChild || 2} padrinhos / criança</strong>
          </div>
        </div>

        {/* Card 2: Cotas Preenchidas */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <UserCheck size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
              {metrics?.occupancyRate || 0}% Preenchido
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cotas Preenchidas</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {metrics?.filledSlots || 0} <span className="text-sm font-semibold text-slate-400">padrinhos ativos</span>
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium flex justify-between">
            <span>Vagas em aberto:</span>
            <strong className="text-amber-600">{metrics?.availableSlots || 0} cotas</strong>
          </div>
        </div>

        {/* Card 3: Receita Recorrente */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <DollarSign size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
              Recorrência
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Receita Mensal Estimada</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              R$ {(metrics?.monthlySponsorshipRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium flex justify-between">
            <span>Ticket médio por cota:</span>
            <strong className="text-slate-700">R$ {(metrics?.quotaCost || 90).toFixed(2)}</strong>
          </div>
        </div>

        {/* Card 4: Status do Programa */}
        <div className={cn(
          "p-6 rounded-[2rem] shadow-sm flex flex-col justify-between text-white transition-all",
          metrics?.isFullySponsored ? "bg-emerald-600" : "bg-slate-900"
        )}>
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Award size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/20">
              {metrics?.isFullySponsored ? 'Meta Batida' : 'Vagas Abertas'}
            </span>
          </div>
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Status de Ocupação</p>
            <p className="text-2xl font-black text-white mt-1">
              {metrics?.isFullySponsored ? '100% Acolhidas 🎉' : `${metrics?.availableSlots || 0} Cotas Livres`}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-white/10 text-[11px] text-white/80 font-medium">
            {metrics?.isFullySponsored 
              ? 'Visitantes são convidados para o fundo de Mantenedor Global.' 
              : 'O algoritmo aloca novos padrinhos para as crianças menos assistidas.'}
          </div>
        </div>
      </div>

      {/* Tabela de Crianças e Distribuição de Padrinhos */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar criança ou aldeia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filterStatus === 'all' ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              Todas ({metrics?.children.length || 0})
            </button>
            <button
              onClick={() => setFilterStatus('open')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filterStatus === 'open' ? "bg-amber-500 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              Com Vagas ({metrics?.children.filter(c => !c.isFull).length || 0})
            </button>
            <button
              onClick={() => setFilterStatus('full')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filterStatus === 'full' ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              Completas ({metrics?.children.filter(c => c.isFull).length || 0})
            </button>
            <button
              onClick={loadData}
              title="Atualizar lista"
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Lista de Crianças */}
        <div className="divide-y divide-slate-100">
          {filteredChildren.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              Nenhuma criança encontrada com os filtros selecionados.
            </div>
          ) : (
            filteredChildren.map(child => {
              const progressPct = Math.min(100, Math.round((child.sponsorsCount / child.maxSponsors) * 100));
              return (
                <div key={child.id} className="p-6 sm:p-8 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Foto e Info da Criança */}
                  <div className="flex items-center gap-5 min-w-[280px]">
                    <img 
                      src={child.photo_url} 
                      alt={child.name} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm shrink-0" 
                    />
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{child.name}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {child.ageText} • {child.community}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-sm">
                        {child.story}
                      </p>
                    </div>
                  </div>

                  {/* Barra de Ocupação de Cotas */}
                  <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">Cotas preenchidas:</span>
                      <span className={child.isFull ? "text-emerald-600" : "text-amber-600"}>
                        {child.sponsorsCount} de {child.maxSponsors} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          child.isFull ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium text-right">
                      {child.maxSponsors - child.sponsorsCount > 0 
                        ? `${child.maxSponsors - child.sponsorsCount} cota(s) restante(s)`
                        : 'Limite atingido'}
                    </p>
                  </div>

                  {/* Lista de Padrinhos Vinculados */}
                  <div className="w-full md:w-72">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      Padrinhos Vinculados ({child.sponsors.length})
                    </span>
                    {child.sponsors.length === 0 ? (
                      <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200">
                        Aguardando 1º Padrinho
                      </span>
                    ) : (
                      <div className="space-y-1.5">
                        {child.sponsors.map(sp => (
                          <div key={sp.id} className="text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 flex items-center justify-between">
                            <span className="font-bold text-slate-800 truncate max-w-[150px]">{sp.name}</span>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              R$ {sp.monthly_amount.toFixed(0)}/mês
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
