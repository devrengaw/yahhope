import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Heart,
  Repeat,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  FileCheck2,
  Globe,
  QrCode,
  Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SEO } from '../../components/common/SEO';
import { PublicFooter } from '../../components/PublicFooter';
import { cn } from '../../lib/utils';
import { isSpamFinanceTransaction, deduplicateFinanceTransactions } from '../../utils/userCleanup';
import {
  ACCOUNTABILITY_2026_DOMAIN,
  ACCOUNTABILITY_2026_URL,
  AccountabilityConfig,
  DEFAULT_ACCOUNTABILITY_CONFIG,
  fetchAccountabilityConfig,
  getLocalAccountabilityConfig
} from '../../services/accountabilityService';

interface PublicTx {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  date: string;
  status: 'pending' | 'completed';
  account: string;
  module?: string;
  original_amount?: number;
  recurrence?: string;
}

interface PublicProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
  budget?: number;
  category?: string;
  module?: string;
}

export function Accountability2026() {
  const [searchParams] = useSearchParams();
  const forceLivePreview = searchParams.get('preview') === 'live';

  const [config, setConfig] = useState<AccountabilityConfig>(() => getLocalAccountabilityConfig());
  const [transactions, setTransactions] = useState<PublicTx[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<'2026' | 'all'>('2026');

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [cfg, txRes, projRes] = await Promise.all([
          fetchAccountabilityConfig(),
          supabase.from('finance_transactions').select('*').order('date', { ascending: false }),
          supabase.from('projects').select('*').order('created_at', { ascending: false })
        ]);

        if (!mounted) return;
        setConfig(cfg);

        if (txRes.data) {
          const nonSpam = txRes.data.filter((t: any) => !isSpamFinanceTransaction(t));
          const { cleanList } = deduplicateFinanceTransactions(nonSpam);
          setTransactions(cleanList as PublicTx[]);
        }

        if (projRes.data) {
          setProjects(projRes.data as PublicProject[]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de prestação de contas:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  const isInternalRepasse = (t: PublicTx): boolean => {
    if (t.type !== 'income') return false;
    const mod = (t.module || 'global').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return (mod !== 'global' && mod !== '') || desc.includes('repasse orçamentário') || desc.startsWith('repasse ');
  };

  const classifyOrigin = (t: PublicTx): 'padrinhos' | 'mantenedores' | 'doacoes' => {
    const desc = (t.description || '').toLowerCase();
    const gross = Number(t.original_amount || t.amount || 0);
    if (
      desc.includes('mantenedor') ||
      desc.includes('apoio geral') ||
      desc.includes('fundo casa nutri') ||
      t.category_id === 'cat_monthly_maintainer' ||
      (desc.includes('recorrência mensal') && gross < 80)
    ) {
      return 'mantenedores';
    }
    if (
      desc.includes('apadrinh') ||
      desc.includes('padrinho') ||
      desc.includes('cota') ||
      t.category_id === 'cat_sponsorship'
    ) {
      return 'padrinhos';
    }
    if (desc.includes('recorrência') || desc.includes('recorrencia') || t.recurrence === 'monthly') {
      return 'mantenedores';
    }
    return 'doacoes';
  };

  const summary = useMemo(() => {
    const matchesPeriod = (dateStr?: string) => {
      if (selectedYear === 'all') return true;
      return (dateStr || '').startsWith('2026');
    };

    const periodTxs = transactions.filter(t => matchesPeriod(t.date));
    const externalIncomes = periodTxs.filter(t => t.type === 'income' && !isInternalRepasse(t) && t.status === 'completed');
    const repasses = periodTxs.filter(t => isInternalRepasse(t));
    const completedExpenses = periodTxs.filter(t => t.type === 'expense' && t.status === 'completed');

    const totalIncome = externalIncomes.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const padrinhosIncome = externalIncomes
      .filter(t => classifyOrigin(t) === 'padrinhos')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const mantenedoresIncome = externalIncomes
      .filter(t => classifyOrigin(t) === 'mantenedores')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const doacoesIncome = externalIncomes
      .filter(t => classifyOrigin(t) === 'doacoes')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const totalExpense = completedExpenses.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalRepassed = repasses.reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const globalExpenses = completedExpenses
      .filter(t => !t.module || t.module === 'global')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const projectExpenses = completedExpenses
      .filter(t => t.module && t.module !== 'global')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const centralCash = totalIncome - globalExpenses - totalRepassed;
    const projectsCash = totalRepassed - projectExpenses;
    const consolidatedCash = totalIncome - totalExpense;

    // Projetos executados
    const nutriProj = projects.find(p => (p.name || '').toLowerCase().includes('nutri'));
    const commProj = projects.find(p => (p.name || '').toLowerCase().includes('comunica') || p.module === 'communication');

    const buildProjectSummary = (moduleKey: string, name: string, description: string, category: string) => {
      const nameLower = name.toLowerCase();
      const projRepasses = repasses.filter(r => {
        const m = (r.module || '').toLowerCase();
        const d = (r.description || '').toLowerCase();
        return m === moduleKey.toLowerCase() || d.includes(nameLower);
      });
      const projExpenses = completedExpenses.filter(e => {
        const m = (e.module || '').toLowerCase();
        const d = (e.description || '').toLowerCase();
        return m === moduleKey.toLowerCase() || (moduleKey !== 'nutrition' && moduleKey !== 'communication' && d.includes(nameLower));
      });

      const repassedAmt = projRepasses.reduce((a, r) => a + Number(r.amount || 0), 0);
      const spentAmt = projExpenses.reduce((a, e) => a + Number(e.amount || 0), 0);

      return {
        id: moduleKey,
        name,
        description,
        category,
        repassedAmt,
        spentAmt,
        investedAmt: Math.max(repassedAmt, spentAmt),
        status: 'Em execução'
      };
    };

    const executedProjects = [
      buildProjectSummary(
        'nutrition',
        nutriProj?.name || 'Casa Nutri — Nutrição Infantil (Moçambique)',
        nutriProj?.description ||
          'Acompanhamento nutricional clínico, suplementação, cestas básicas, visitas domiciliares e cuidado contínuo às crianças e famílias em Moçambique.',
        'Saúde & Nutrição Infantil'
      ),
      buildProjectSummary(
        'communication',
        commProj?.name || 'Comunicação, Transparência & Captação',
        commProj?.description ||
          'Manutenção da plataforma de apadrinhamento, portal do mantenedor, prestação de contas e mobilização de novos apoiadores.',
        'Infraestrutura & Transparência'
      ),
      ...projects
        .filter(p => {
          const n = (p.name || '').toLowerCase();
          return !n.includes('nutri') && !n.includes('comunica') && p.module !== 'communication';
        })
        .map(p =>
          buildProjectSummary(
            p.id,
            p.name,
            p.description || 'Projeto social acompanhado e executado pela YAH Hope.',
            p.category || 'Desenvolvimento Social'
          )
        )
    ];

    return {
      totalIncome,
      padrinhosIncome,
      mantenedoresIncome,
      doacoesIncome,
      totalExpense,
      totalRepassed,
      centralCash,
      projectsCash,
      consolidatedCash,
      executedProjects
    };
  }, [transactions, projects, selectedYear]);

  const showNumbers = config.mode === 'published' || config.showLiveNumbers || forceLivePreview;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <SEO
        title="Prestação de Contas 2026 | YAH Hope"
        description="Portal Oficial de Transparência e Prestação de Contas 2026 da YAH Hope: Entradas, Saídas, Saldo em Caixa e Projetos Executados."
      />

      {/* TOP BAR INSTITUCIONAL */}
      <header className="bg-slate-900 text-white border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link to="https://yahhope.com" className="flex items-center gap-3 group">
            <img
              src="/logo_header.png"
              alt="YAH Hope"
              className="h-9 w-auto object-contain brightness-0 invert"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <span className="font-black text-base tracking-tight block leading-none">YAH HOPE</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mt-0.5">
                {ACCOUNTABILITY_2026_DOMAIN}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck size={14} />
              Transparência 2026
            </span>
            <a
              href="https://yahhope.com"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              Site Oficial <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* HERO DE BOAS-VINDAS (CARTÃO DE AGRADECIMENTO & QR CODE) */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-12 sm:py-16 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#F49853]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Heart size={14} className="text-[#F49853] fill-[#F49853]" />
            Portal Oficial de Prestação de Contas • Exercício 2026
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            {config.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            {config.subtitle}
          </p>

          {/* Mensagem Especial do Cartão de Agradecimento */}
          <div className="max-w-2xl mx-auto mt-6 bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 text-left flex items-start gap-4 backdrop-blur-xs">
            <div className="p-3 rounded-2xl bg-[#F49853]/20 text-[#F49853] shrink-0 mt-0.5">
              <QrCode size={22} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block mb-1">
                Você veio pelo Cartão de Agradecimento?
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {config.thankYouMessage}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 -mt-8 pb-20 space-y-10 relative z-20">
        {/* AVISO QUANDO AINDA EM ESTRUTURAÇÃO */}
        {!showNumbers && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-xl shadow-slate-900/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                    Caminho Oficial Registrado • {ACCOUNTABILITY_2026_DOMAIN}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Demonstrativo Financeiro 2026 em Fase de Consolidação
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                  Este endereço oficial (<strong>{ACCOUNTABILITY_2026_DOMAIN}</strong>) já está ativo para os cartões de agradecimento da YAH Hope. Os relatórios detalhados de entradas, saídas, posição de caixa e execução de cada projeto são atualizados periodicamente pela nossa equipe financeira abaixo.
                </p>
              </div>
            </div>

            <a
              href="https://yahhope.com/portal/login"
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shrink-0 transition-all"
            >
              Acessar Portal do Apoiador <ArrowUpRight size={15} />
            </a>
          </div>
        )}

        {/* SELETOR DE PERÍODO QUANDO PUBLICADO */}
        {showNumbers && (
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <FileCheck2 size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Balancete de Transparência em Tempo Real</h2>
                <p className="text-xs text-slate-500">Dados sincronizados diretamente com a Central Financeira YAH Hope</p>
              </div>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedYear('2026')}
                className={cn(
                  'px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer',
                  selectedYear === '2026' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                Exercício 2026
              </button>
              <button
                type="button"
                onClick={() => setSelectedYear('all')}
                className={cn(
                  'px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer',
                  selectedYear === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                Histórico Completo
              </button>
            </div>
          </div>
        )}

        {/* OS 4 PILARES DA PRESTAÇÃO DE CONTAS: ENTRADA, SAÍDA, CAIXA, PROJETOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PILAR 1: NOSSA ENTRADA */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  1. Nossa Entrada
                </span>
              </div>

              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Total Arrecadado (Doações & Apoios)
              </p>

              {showNumbers ? (
                <p className="text-3xl font-black text-slate-900 mt-1">
                  R$ {summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              ) : (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <Clock size={14} /> Em consolidação contábil 2026
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-bold">
                  <Heart size={12} className="text-rose-500 fill-rose-500" /> Padrinhos (Cotas):
                </span>
                <strong className="text-slate-900">
                  {showNumbers
                    ? `R$ ${summary.padrinhosIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Registrado'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-bold">
                  <Repeat size={12} className="text-blue-500" /> Mantenedores Mensais:
                </span>
                <strong className="text-slate-900">
                  {showNumbers
                    ? `R$ ${summary.mantenedoresIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Registrado'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-bold">
                  <DollarSign size={12} className="text-emerald-600" /> Doações & Ofertas:
                </span>
                <strong className="text-slate-900">
                  {showNumbers
                    ? `R$ ${summary.doacoesIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Registrado'}
                </strong>
              </div>
            </div>
          </div>

          {/* PILAR 2: NOSSA SAÍDA */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-rose-100 shadow-lg shadow-rose-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <TrendingDown size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                  2. Nossa Saída
                </span>
              </div>

              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Custos & Investimento Social Executado
              </p>

              {showNumbers ? (
                <p className="text-3xl font-black text-rose-600 mt-1">
                  R$ {summary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              ) : (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-black text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                    <Clock size={14} /> Em consolidação contábil 2026
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold">Repassado aos Projetos:</span>
                <strong className="text-slate-900">
                  {showNumbers
                    ? `R$ ${summary.totalRepassed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Auditado por projeto'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold">Aplicação Direta:</span>
                <strong className="text-emerald-700">Nutrição, Saúde e Operação</strong>
              </div>
            </div>
          </div>

          {/* PILAR 3: QUANTO TEMOS EM CAIXA */}
          <div className="bg-slate-900 p-6 sm:p-7 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/10 text-emerald-400 rounded-2xl">
                  <Wallet size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  3. Quanto Temos em Caixa
                </span>
              </div>

              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Saldo Total Consolidado em Caixa
              </p>

              {showNumbers ? (
                <p className="text-3xl font-black text-white mt-1">
                  R$ {summary.consolidatedCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              ) : (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                    <Clock size={14} /> Em consolidação contábil 2026
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-xs relative z-10">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium">Caixa Central Livre:</span>
                <strong className="text-white">
                  {showNumbers
                    ? `R$ ${summary.centralCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Reserva Institucional'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium">Saldo Alocado nos Projetos:</span>
                <strong className="text-emerald-400">
                  {showNumbers
                    ? `R$ ${summary.projectsCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Fundo de Execução'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* PILAR 4: CADA PROJETO EXECUTADO */}
        <section className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
                <Layers size={12} /> 4. Projetos Executados
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Cada Projeto Executado pela YAH Hope
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Veja para onde os recursos são direcionados e o impacto gerado em cada frente de atuação.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.executedProjects.map((proj) => {
              const isNutri = proj.id === 'nutrition';
              return (
                <div
                  key={proj.id}
                  className={cn(
                    'rounded-3xl p-6 border-2 flex flex-col justify-between transition-all',
                    isNutri ? 'border-emerald-200/80 bg-emerald-50/20' : 'border-slate-200/80 bg-slate-50/40'
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                            isNutri ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          )}
                        >
                          <Building2 size={22} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            {proj.category}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-900">{proj.name}</h3>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 shrink-0">
                        ✓ {proj.status}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">{proj.description}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/70 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Recursos Repassados
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-700 mt-0.5 block">
                        {showNumbers
                          ? `R$ ${proj.repassedAmt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'Em consolidação'}
                      </span>
                    </div>
                    <div className="border-l border-slate-100 pl-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Despesas Executadas
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
                        {showNumbers
                          ? `R$ ${proj.spentAmt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'Em consolidação'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RODAPÉ DE COMPROMISSO E INTEGRIDADE */}
        <section className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Sparkles size={15} /> Compromisso YAH Hope com cada doador
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Obrigado por transformar vidas conosco em 2026!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Guarde o seu Cartão de Agradecimento. Sempre que quiser consultar a evolução das nossas entradas, saídas, saldo em caixa e projetos executados, basta apontar a câmera do celular para o QR Code ou acessar <strong>{ACCOUNTABILITY_2026_DOMAIN}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="https://yahhope.com/mantenedor"
              className="px-5 py-3.5 rounded-2xl bg-[#F49853] hover:bg-[#e08743] text-slate-950 font-black text-xs sm:text-sm transition-all"
            >
              Conhecer Programa de Mantenedores
            </a>
            <a
              href="https://yahhope.com"
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              Voltar ao Site Principal
            </a>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
