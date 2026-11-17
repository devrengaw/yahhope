import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Search,
  Tag,
  Edit2,
  Trash2,
  Repeat,
  Heart,
  Users,
  Send,
  Building2,
  Target,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Check,
  EyeOff,
  CreditCard,
  Settings2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TransactionModal } from '../../components/admin/finance/TransactionModal';
import { CategoryModal } from '../../components/admin/finance/CategoryModal';
import { SupportersList } from '../../components/admin/finance/SupportersList';
import { SponsorshipQuotasManager } from '../../components/admin/finance/SponsorshipQuotasManager';
import { MonthlyExpensesManager } from '../../components/admin/finance/MonthlyExpensesManager';
import { ExpenseModal, ExpensePayload } from '../../components/admin/finance/ExpenseModal';
import { ProjectRepasseModal, RepassePayload } from '../../components/admin/finance/ProjectRepasseModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useFundraising, saveStoredRulerLink } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';
import { isSpamFinanceTransaction, purgeSpamFinanceTransactions, deduplicateFinanceTransactions } from '../../utils/userCleanup';
import { ensureCurrentMonthRecurringTransactions } from '../../services/financeTransactionService';
import { Project } from '../../lib/mockData';
import { 
  getLocalCategories, 
  fetchAndSyncCategories, 
  saveCategory as persistCategory, 
  deleteCategory as removePersistedCategory 
} from '../../services/financeCategoryService';
import {
  GatewayFeeConfig,
  getGatewayFeeConfig,
  saveGatewayFeeConfig,
  resolveTransactionGatewayAmounts,
  buildStripeNetNoteTag
} from '../../services/gatewayFeeService';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  date: string;
  status: 'pending' | 'completed';
  account: string;
  expense_type?: 'fixed' | 'variable';
  recurrence?: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly' | 'none';
  due_day?: number;
  module?: string;
  currency?: string;
  original_amount?: number;
  exchange_rate?: number;
  notes?: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function parseDateParts(dateStr?: string) {
  if (!dateStr) return { year: 0, month: 0, key: 'unknown', label: 'Sem data' };
  const match = dateStr.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    return {
      year,
      month,
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${MONTH_NAMES[month] || ''} de ${year}`
    };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = d.getMonth();
    return {
      year,
      month,
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${MONTH_NAMES[month] || ''} de ${year}`
    };
  }
  return { year: 0, month: 0, key: 'unknown', label: 'Sem data' };
}

export function formatTransactionDate(dateStr?: string): string {
  if (!dateStr) return 'Sem data';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('pt-BR');
  }
  return dateStr;
}

type FinanceMainTab = 'overview' | 'incomes_ruler' | 'expenses' | 'supporters_quotas' | 'categories';

export function Finance() {
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // Contexto da Régua de Campanhas conectado diretamente ao Financeiro
  const {
    campaigns,
    activeCampaign,
    allDonations,
    calculateCampaignProgress,
    syncRulerWithFinance,
    setTransactionRulerLink,
    getTransactionRulerStatus,
    updateCampaign,
    createCampaign,
    toggleCampaignActive,
    resetCampaignMonth,
    approveDonation,
    deleteDonation,
    refreshFundraising
  } = useFundraising();

  const initialTabParam = searchParams.get('tab');
  const resolveTab = (raw: string | null): FinanceMainTab => {
    if (raw === 'overview' || raw === 'projects') return 'overview';
    if (raw === 'incomes_ruler' || raw === 'transactions' || raw === 'incomes') return 'incomes_ruler';
    if (raw === 'expenses') return 'expenses';
    if (raw === 'supporters_quotas' || raw === 'supporters' || raw === 'sponsorship') return 'supporters_quotas';
    if (raw === 'categories') return 'categories';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<FinanceMainTab>(() => resolveTab(initialTabParam));
  const [supportersSubTab, setSupportersSubTab] = useState<'list' | 'quotas'>('list');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) {
      setActiveTab(resolveTab(t));
      if (t === 'sponsorship') setSupportersSubTab('quotas');
      if (t === 'supporters') setSupportersSubTab('list');
    }
  }, [searchParams]);

  const handleChangeTab = (tab: FinanceMainTab) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>(getLocalCategories());
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const cached = localStorage.getItem('yah_hope_projects_v2');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Modais
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<'income' | 'expense'>('income');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalType, setExpenseModalType] = useState<'fixed' | 'variable'>('fixed');
  const [isRepasseModalOpen, setIsRepasseModalOpen] = useState(false);
  const [repasseDefaultModule, setRepasseDefaultModule] = useState<string>('nutrition');
  const [repasseDefaultAmount, setRepasseDefaultAmount] = useState<number | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);

  // Controles de filtro da aba de Entradas & Extrato
  const [filterType, setFilterType] = useState<'income' | 'all' | 'expense'>('income');
  const [filterOrigin, setFilterOrigin] = useState<'all' | 'padrinhos' | 'mantenedores' | 'doacoes' | 'repasses' | 'expenses'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Período Global (padrão: Mês Atual para máxima clareza operacional, ou 'all' para histórico completo)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthName = `${MONTH_NAMES[currentMonth]} de ${currentYear}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Configuração de Taxas de Gateway (Stripe / InfinitePay)
  const [gatewayFeeConfig, setGatewayFeeConfig] = useState<GatewayFeeConfig>(() => getGatewayFeeConfig());
  const [isFeeConfigModalOpen, setIsFeeConfigModalOpen] = useState(false);
  const [isSyncingStripeApi, setIsSyncingStripeApi] = useState(false);

  // Estado de edição rápida da Régua dentro do Financeiro
  const [isQuickRulerConfigOpen, setIsQuickRulerConfigOpen] = useState(false);
  const [isSyncingRuler, setIsSyncingRuler] = useState(false);
  const [rulerFeedback, setRulerFeedback] = useState<string | null>(null);
  const [editingCampId, setEditingCampId] = useState<string>('');
  const [editCampTitle, setEditCampTitle] = useState('');
  const [editCampTarget, setEditCampTarget] = useState('');
  const [editCampType, setEditCampType] = useState<'monthly' | 'specific'>('monthly');

  // Helper para identificar se uma transação de entrada é um Repasse interno entre caixa central e projeto
  const isInternalRepasse = (t: Transaction): boolean => {
    if (t.type !== 'income') return false;
    const mod = (t.module || 'global').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return (mod !== 'global' && mod !== '') || desc.includes('repasse orçamentário') || desc.startsWith('repasse ');
  };

  // Classificador unificado de origem da transação
  const classifyTransactionOrigin = (t: Transaction): 'padrinhos' | 'mantenedores' | 'doacoes' | 'repasses' | 'expenses' => {
    if (t.type === 'expense') return 'expenses';
    if (isInternalRepasse(t)) return 'repasses';

    const desc = (t.description || '').toLowerCase();
    const referenceGross = Number(t.original_amount || t.amount || 0);
    if (
      desc.includes('mantenedor') ||
      desc.includes('apoio geral') ||
      desc.includes('fundo casa nutri') ||
      t.category_id === 'cat_monthly_maintainer' ||
      (desc.includes('recorrência mensal') && referenceGross < 80)
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

  const fetchData = async (customFeeCfg?: GatewayFeeConfig) => {
    const activeFeeCfg = customFeeCfg || gatewayFeeConfig;
    try {
      purgeSpamFinanceTransactions();
      const [txRes, syncedCategories, projRes] = await Promise.all([
        supabase.from('finance_transactions').select('*').order('date', { ascending: false }),
        fetchAndSyncCategories(),
        supabase.from('projects').select('*').order('created_at', { ascending: false })
      ]);
      if (txRes.data) {
        const nonSpamTxs = txRes.data
          .filter(t => !isSpamFinanceTransaction(t))
          .map(t => {
            const desc = (t.description || '').toLowerCase();
            const isPadrinhoTx = t.type === 'income' && (
              t.category_id === 'cat_sponsorship' ||
              desc.includes('apadrinh') ||
              desc.includes('padrinho')
            );
            // REGRA DE OURO: Corrige apenas mocks legados <= R$ 35, preservando valores líquidos descontados de taxa Stripe (ex: R$ 86,02)
            if (isPadrinhoTx && t.amount > 0 && t.amount <= 35 && (!t.original_amount || t.original_amount <= 35)) {
              return { ...t, amount: 90 };
            }
            return t;
          });
        const { cleanList: cleanTxs, duplicateIds } = deduplicateFinanceTransactions(nonSpamTxs);
        if (duplicateIds.length > 0) {
          supabase.from('finance_transactions').delete().in('id', duplicateIds).then(() => {}, () => {});
        }
        const updatedTxs = await ensureCurrentMonthRecurringTransactions(cleanTxs);

        // Aplica o cálculo do Valor Líquido Repassado (descontando taxas Stripe) nas transações de entrada
        const netNormalizedTxs = updatedTxs.map(t => {
          if (t.type !== 'income' || isInternalRepasse(t)) return t;
          const gw = resolveTransactionGatewayAmounts(t, activeFeeCfg);
          if (!gw.isGatewayTx || gw.feeAmount <= 0) return t;

          const effectiveAmt = activeFeeCfg.useNetAmountInFinance ? gw.netAmount : gw.grossAmount;
          const nextNotes = buildStripeNetNoteTag(gw.grossAmount, gw.feeAmount, gw.netAmount, t.notes);

          // Se no banco ainda estava salvo com o valor bruto (sem tag STRIPE_NET), persiste o valor líquido no Supabase
          if (
            activeFeeCfg.useNetAmountInFinance &&
            (!gw.isExactFromApi || Math.abs(Number(t.amount) - gw.netAmount) > 0.01) &&
            t.id &&
            !t.id.startsWith('local_')
          ) {
            supabase
              .from('finance_transactions')
              .update({
                amount: gw.netAmount,
                original_amount: gw.grossAmount,
                notes: nextNotes
              })
              .eq('id', t.id)
              .then(() => {}, () => {});
          }

          return {
            ...t,
            amount: effectiveAmt,
            original_amount: gw.grossAmount,
            notes: nextNotes
          };
        });

        setTransactions(netNormalizedTxs);
      }
      if (syncedCategories) setCategories(syncedCategories);
      if (projRes.data && projRes.data.length > 0) {
        setProjects(projRes.data);
      } else {
        try {
          const cached = localStorage.getItem('yah_hope_projects_v2');
          if (cached) setProjects(JSON.parse(cached));
        } catch {}
      }
    } catch (e) {
      console.error('Error fetching finance data:', e);
    }
  };

  useEffect(() => {
    fetchData();

    const channels = supabase.channel('finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_categories' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  // Lista de meses disponíveis para o seletor global
  const availableMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number; incomeTotal: number; expenseTotal: number }>();

    map.set(currentMonthKey, {
      key: currentMonthKey,
      label: currentMonthName,
      count: 0,
      incomeTotal: 0,
      expenseTotal: 0
    });

    transactions.forEach(t => {
      const { key, label } = parseDateParts(t.date);
      if (key === 'unknown') return;
      if (!map.has(key)) {
        map.set(key, { key, label, count: 0, incomeTotal: 0, expenseTotal: 0 });
      }
      const item = map.get(key)!;
      item.count += 1;
      if (t.type === 'income' && !isInternalRepasse(t)) item.incomeTotal += t.amount;
      else if (t.type === 'expense') item.expenseTotal += t.amount;
    });

    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [transactions, currentMonthKey, currentMonthName]);

  const selectedPeriodLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'Todos os Meses (Histórico)';
    const found = availableMonths.find(m => m.key === selectedMonth);
    return found ? found.label : currentMonthName;
  }, [selectedMonth, availableMonths, currentMonthName]);

  // ============================================================================
  // CÁLCULO CENTRAL DE FLUXO DO DINHEIRO (ENTRADAS -> REPASSES -> SAÍDAS -> SALDO)
  // ============================================================================
  const flowStats = useMemo(() => {
    const matchesPeriod = (dateStr?: string) => {
      if (selectedMonth === 'all') return true;
      const { key } = parseDateParts(dateStr);
      return key === selectedMonth;
    };

    const matchesCurrentMonth = (dateStr?: string) => {
      const { key } = parseDateParts(dateStr);
      return key === currentMonthKey;
    };

    // 1. Entradas Reais Externas (excluindo repasses internos)
    const allExternalIncomes = transactions.filter(t => t.type === 'income' && !isInternalRepasse(t));
    const periodExternalIncomes = allExternalIncomes.filter(t => matchesPeriod(t.date));
    const currentMonthExternalIncomes = allExternalIncomes.filter(t => matchesCurrentMonth(t.date));

    const periodIncomeTotal = periodExternalIncomes.reduce((acc, t) => acc + t.amount, 0);
    const periodGrossIncomeTotal = periodExternalIncomes.reduce((acc, t) => {
      const gw = resolveTransactionGatewayAmounts(t, gatewayFeeConfig);
      return acc + (gw.isGatewayTx ? gw.grossAmount : t.amount);
    }, 0);
    const periodGatewayFeesTotal = Number(Math.max(0, periodGrossIncomeTotal - periodIncomeTotal).toFixed(2));

    const historicalIncomeTotal = allExternalIncomes.reduce((acc, t) => acc + t.amount, 0);
    const currentMonthIncomeTotal = currentMonthExternalIncomes.reduce((acc, t) => acc + t.amount, 0);

    // Breakdown de Entradas no período selecionado
    const padrinhosIncome = periodExternalIncomes
      .filter(t => classifyTransactionOrigin(t) === 'padrinhos')
      .reduce((acc, t) => acc + t.amount, 0);

    const mantenedoresIncome = periodExternalIncomes
      .filter(t => classifyTransactionOrigin(t) === 'mantenedores')
      .reduce((acc, t) => acc + t.amount, 0);

    const doacoesIncome = periodExternalIncomes
      .filter(t => classifyTransactionOrigin(t) === 'doacoes')
      .reduce((acc, t) => acc + t.amount, 0);

    // 2. Repasses para Projetos
    const allRepasses = transactions.filter(t => isInternalRepasse(t));
    const periodRepasses = allRepasses.filter(t => matchesPeriod(t.date));
    const periodRepassedTotal = periodRepasses.reduce((acc, t) => acc + t.amount, 0);
    const historicalRepassedTotal = allRepasses.reduce((acc, t) => acc + t.amount, 0);

    // 3. Despesas / Custos
    const allExpenses = transactions.filter(t => t.type === 'expense');
    const periodExpenses = allExpenses.filter(t => matchesPeriod(t.date));

    const periodCompletedExpenses = periodExpenses
      .filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0);
    const periodCompletedCount = periodExpenses.filter(t => t.status === 'completed').length;

    const periodPendingExpenses = periodExpenses
      .filter(t => t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);
    const periodPendingCount = periodExpenses.filter(t => t.status === 'pending').length;

    const periodTotalExpenses = periodCompletedExpenses + periodPendingExpenses;

    // Separação: Despesas diretas do Caixa Central (global) vs Despesas executadas dentro dos Projetos
    const periodGlobalExpensesCompleted = periodExpenses
      .filter(t => t.status === 'completed' && (!t.module || t.module === 'global'))
      .reduce((acc, t) => acc + t.amount, 0);

    const periodProjectExpensesCompleted = periodExpenses
      .filter(t => t.status === 'completed' && t.module && t.module !== 'global')
      .reduce((acc, t) => acc + t.amount, 0);

    // 4. Saldos Transparentes:
    // - Caixa Central Livre (Disponível para alocar/repassar): Entradas Externas - Despesas Globais - Repasses enviados aos projetos
    const centralAvailableCash = periodIncomeTotal - periodGlobalExpensesCompleted - periodRepassedTotal;
    // - Saldo Atual dentro dos Projetos: Repasses recebidos pelos projetos - Despesas pagas pelos projetos
    const projectsInternalBalance = periodRepassedTotal - periodProjectExpensesCompleted;
    // - Saldo Consolidado Total da Organização (Caixa Central + Projetos): Entradas Externas - Todas as Despesas Pagas
    const consolidatedCashBalance = periodIncomeTotal - periodCompletedExpenses;
    const projectedConsolidatedBalance = periodIncomeTotal - periodTotalExpenses;

    // 5. Custo Fixo Estrutural Mensal
    const fixedExpensesList = allExpenses.filter(t => t.expense_type === 'fixed');
    const fixedExpense = fixedExpensesList.reduce((acc, t) => {
      const rec = t.recurrence || 'monthly';
      if (rec === 'bimonthly') return acc + t.amount / 2;
      if (rec === 'quarterly') return acc + t.amount / 3;
      if (rec === 'semiannual') return acc + t.amount / 6;
      if (rec === 'yearly') return acc + t.amount / 12;
      return acc + t.amount;
    }, 0);

    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
    const projectsFixedCost = activeProjects.reduce((acc, p) => {
      const pNameLower = (p.name || '').toLowerCase();
      const alreadyInTransactions = allExpenses.some(t => {
        const d = (t.description || '').toLowerCase();
        return d === `orçamento: ${pNameLower}` || (pNameLower.includes('nutri') && t.module === 'nutrition' && t.expense_type === 'fixed');
      });
      if (alreadyInTransactions) return acc;
      return acc + (Number(p.budget) || 0);
    }, 0);

    const totalMonthlyFixed = fixedExpense + projectsFixedCost;

    return {
      periodIncomeTotal,
      periodGrossIncomeTotal,
      periodGatewayFeesTotal,
      historicalIncomeTotal,
      currentMonthIncomeTotal,
      padrinhosIncome,
      mantenedoresIncome,
      doacoesIncome,
      periodRepasses,
      allRepasses,
      periodRepassedTotal,
      historicalRepassedTotal,
      periodCompletedExpenses,
      periodCompletedCount,
      periodPendingExpenses,
      periodPendingCount,
      periodTotalExpenses,
      centralAvailableCash,
      projectsInternalBalance,
      consolidatedCashBalance,
      projectedConsolidatedBalance,
      totalMonthlyFixed,
      fixedExpense,
      projectsFixedCost
    };
  }, [transactions, projects, selectedMonth, currentMonthKey, gatewayFeeConfig]);

  // ============================================================================
  // PAINEL DE PROJETOS E REPASSES (CASA NUTRI, COMUNICAÇÃO E PROJETOS ATIVOS)
  // ============================================================================
  const projectCardsData = useMemo(() => {
    const matchesPeriod = (dateStr?: string) => {
      if (selectedMonth === 'all') return true;
      const { key } = parseDateParts(dateStr);
      return key === selectedMonth;
    };

    const allRepasses = transactions.filter(t => isInternalRepasse(t));
    const allExpenses = transactions.filter(t => t.type === 'expense');

    const computeModuleStats = (moduleKey: string, nameLabel: string, fallbackBudget: number) => {
      const nameLower = nameLabel.toLowerCase();
      const repasses = allRepasses.filter(r => {
        const m = (r.module || '').toLowerCase();
        const d = (r.description || '').toLowerCase();
        const isMatch = m === moduleKey.toLowerCase() || d.includes(nameLower);
        return isMatch && matchesPeriod(r.date);
      });
      const repassed = repasses.reduce((acc, r) => acc + r.amount, 0);

      const modExpensesAll = allExpenses.filter(t => {
        const m = (t.module || '').toLowerCase();
        const d = (t.description || '').toLowerCase();
        return m === moduleKey.toLowerCase() || (moduleKey !== 'nutrition' && moduleKey !== 'communication' && d.includes(nameLower));
      });

      // Custo fixo mensal amortizado deste módulo
      const fixedMonthly = modExpensesAll
        .filter(t => t.expense_type === 'fixed')
        .reduce((acc, t) => {
          const rec = t.recurrence || 'monthly';
          if (rec === 'bimonthly') return acc + t.amount / 2;
          if (rec === 'quarterly') return acc + t.amount / 3;
          if (rec === 'semiannual') return acc + t.amount / 6;
          if (rec === 'yearly') return acc + t.amount / 12;
          return acc + t.amount;
        }, 0);

      const periodExecExpenses = modExpensesAll
        .filter(t => matchesPeriod(t.date))
        .reduce((acc, t) => acc + t.amount, 0);

      const monthlyTargetDemand = Math.max(fixedMonthly, periodExecExpenses, fallbackBudget);
      const remainingToRepass = Math.max(0, Number((monthlyTargetDemand - repassed).toFixed(2)));
      const balanceInProject = repassed - periodExecExpenses;
      const coveragePct = monthlyTargetDemand > 0 ? Math.min(100, Math.round((repassed / monthlyTargetDemand) * 100)) : (repassed > 0 ? 100 : 0);

      return {
        moduleKey,
        name: nameLabel,
        repassed,
        realExpenses: periodExecExpenses,
        monthlyTargetDemand,
        remainingToRepass,
        balanceInProject,
        coveragePct,
        repassesCount: repasses.length
      };
    };

    const nutriProj = projects.find(p => (p.name || '').toLowerCase().includes('nutri'));
    const commProj = projects.find(p => (p.name || '').toLowerCase().includes('comunica') || p.module === 'communication');

    const coreList = [
      {
        ...computeModuleStats('nutrition', nutriProj?.name || 'Casa Nutri (Nutrição Infantil)', Number(nutriProj?.budget || 0)),
        description: nutriProj?.description || 'Atendimento clínico, suplementação, cestas nutricionais e equipe local em Moçambique.',
        panelLink: '/nutrition/finance',
        accent: 'emerald' as const
      },
      {
        ...computeModuleStats('communication', commProj?.name || 'Comunicação & Captação', Number(commProj?.budget || 0)),
        description: commProj?.description || 'Ferramentas digitais, mídia, produção de conteúdo, disparos de e-mail e transparência.',
        panelLink: '/communication/costs',
        accent: 'purple' as const
      }
    ];

    // Adiciona demais projetos cadastrados que não sejam duplicatas de Casa Nutri ou Comunicação
    const extraProjectCards = projects
      .filter(p => {
        const n = (p.name || '').toLowerCase();
        return !n.includes('nutri') && !n.includes('comunica') && p.module !== 'communication';
      })
      .map(p => ({
        ...computeModuleStats(p.id, p.name, Number(p.budget || 0)),
        description: p.description || 'Projeto monitorado pela gestão central YAH Hope.',
        panelLink: '/admin/projects',
        accent: 'blue' as const
      }));

    const allCards = [...coreList, ...extraProjectCards];
    const totalDemand = allCards.reduce((acc, c) => acc + c.monthlyTargetDemand, 0);
    const totalRemainingToRepass = allCards.reduce((acc, c) => acc + c.remainingToRepass, 0);

    return {
      cards: allCards,
      totalDemand,
      totalRemainingToRepass
    };
  }, [transactions, projects, selectedMonth]);

  // ============================================================================
  // ESTATÍSTICAS DA RÉGUA DE CAMPANHAS CONECTADA AO FINANCEIRO
  // ============================================================================
  const rulerSummary = useMemo(() => {
    const activeList = campaigns.filter(c => c && c.is_active !== false);
    const list = activeList.length > 0 ? activeList : campaigns;

    const totalGoal = list.reduce((sum, c) => sum + (c.target_amount || 0), 0);
    const totalRaisedInRuler = list.reduce((sum, c) => {
      const p = calculateCampaignProgress(c);
      return sum + p.currentAmount;
    }, 0);

    const percentage = totalGoal > 0 ? Math.min(Math.round((totalRaisedInRuler / totalGoal) * 100), 100) : 0;
    const pendingSiteDonations = allDonations.filter(d => d.status === 'pending');

    return {
      campaignsList: list,
      totalGoal,
      totalRaisedInRuler,
      percentage,
      pendingSiteDonations
    };
  }, [campaigns, calculateCampaignProgress, allDonations]);

  // Sincroniza formulário rápido de campanha quando abrir
  useEffect(() => {
    const targetCamp = campaigns.find(c => c.id === editingCampId) || activeCampaign || campaigns[0];
    if (targetCamp) {
      setEditingCampId(targetCamp.id);
      setEditCampTitle(targetCamp.title);
      setEditCampTarget(String(targetCamp.target_amount || 20000));
      setEditCampType(targetCamp.type || 'monthly');
    }
  }, [campaigns, activeCampaign, isQuickRulerConfigOpen]);

  // ============================================================================
  // FILTRAGEM E AGRUPAMENTO DE TRANSAÇÕES
  // ============================================================================
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesSearch =
          (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.account || '').toLowerCase().includes(searchTerm.toLowerCase());
        const { key } = parseDateParts(t.date);
        const matchesMonth = selectedMonth === 'all' || key === selectedMonth;

        const txOrigin = classifyTransactionOrigin(t);
        // Se estiver vendo "Todas as Entradas" (filterType === 'income' e filterOrigin === 'all'), oculta repasses internos para mostrar apenas entradas reais (a menos que filtre explicitamente por 'repasses')
        if (filterType === 'income' && filterOrigin === 'all' && txOrigin === 'repasses') {
          return false;
        }
        const matchesOrigin = filterOrigin === 'all' || filterOrigin === txOrigin;

        return matchesType && matchesSearch && matchesMonth && matchesOrigin;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });
  }, [transactions, filterType, filterOrigin, searchTerm, selectedMonth]);

  const transactionsByMonth = useMemo(() => {
    const groups: {
      key: string;
      label: string;
      transactions: Transaction[];
      totalIncome: number;
      totalExpense: number;
      balance: number;
    }[] = [];

    const map = new Map<string, typeof groups[0]>();

    if (selectedMonth === 'all' || selectedMonth === currentMonthKey) {
      if (!map.has(currentMonthKey)) {
        const curGroup = {
          key: currentMonthKey,
          label: currentMonthName,
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          balance: 0
        };
        map.set(currentMonthKey, curGroup);
        groups.push(curGroup);
      }
    }

    filteredTransactions.forEach(t => {
      const { key, label } = parseDateParts(t.date);

      if (!map.has(key)) {
        const group = {
          key,
          label,
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          balance: 0
        };
        map.set(key, group);
        groups.push(group);
      }

      const group = map.get(key)!;
      group.transactions.push(t);
      if (t.type === 'income') {
        if (!isInternalRepasse(t) || filterOrigin === 'repasses') {
          group.totalIncome += t.amount;
        }
      } else {
        group.totalExpense += t.amount;
      }
      group.balance = group.totalIncome - group.totalExpense;
    });

    return groups.sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredTransactions, filterOrigin, selectedMonth, currentMonthKey, currentMonthName]);

  // ============================================================================
  // HANDLERS DE SALVAMENTO E ATUALIZAÇÃO
  // ============================================================================
  const handleSaveTransaction = async (
    newTx: Omit<Transaction, 'id'> & { rulerTarget?: 'auto' | 'excluded' | string }
  ) => {
    try {
      const basePayload: any = {
        description: newTx.description,
        amount: Number(newTx.amount),
        type: newTx.type,
        category_id: newTx.category_id || null,
        date: newTx.date,
        status: newTx.status || 'completed',
        account: newTx.account || 'Conta Principal',
        ...(newTx.expense_type ? { expense_type: newTx.expense_type } : {}),
        ...(newTx.recurrence ? { recurrence: newTx.recurrence } : {}),
        module: newTx.module || 'global'
      };

      const fullPayload: any = {
        ...basePayload,
        currency: newTx.currency || 'BRL',
        ...(newTx.original_amount !== undefined ? { original_amount: newTx.original_amount } : {}),
        ...(newTx.exchange_rate !== undefined ? { exchange_rate: newTx.exchange_rate } : {}),
        ...(newTx.notes ? { notes: newTx.notes } : {})
      };

      let { data, error } = await supabase.from('finance_transactions').insert([fullPayload]).select();

      if (error && error.message?.includes('column')) {
        const retry = await supabase.from('finance_transactions').insert([basePayload]).select();
        data = retry.data;
        error = retry.error;
      }

      if (error && (error.message?.includes('foreign key') || error.code === '23503')) {
        const retryNoCat = await supabase.from('finance_transactions').insert([{ ...basePayload, category_id: null }]).select();
        data = retryNoCat.data;
        error = retryNoCat.error;
      }

      if (error) throw error;

      const savedTx: Transaction = {
        ...(data && data[0] ? (data[0] as Transaction) : { id: 'tx_' + Date.now(), ...basePayload }),
        currency: newTx.currency || 'BRL',
        original_amount: newTx.original_amount,
        exchange_rate: newTx.exchange_rate,
        notes: newTx.notes
      };

      if (newTx.type === 'income' && newTx.rulerTarget) {
        saveStoredRulerLink(savedTx.id, newTx.rulerTarget);
      }

      setTransactions(prev => [savedTx, ...prev]);

      // Atualiza imediatamente a régua de campanhas se for uma receita
      if (newTx.type === 'income') {
        await refreshFundraising();
      }
    } catch (e) {
      console.error('Error saving transaction, adding locally:', e);
      const localTx: Transaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        ...newTx,
        module: newTx.module || 'global',
        currency: newTx.currency || 'BRL'
      };
      if (newTx.type === 'income' && newTx.rulerTarget) {
        saveStoredRulerLink(localTx.id, newTx.rulerTarget);
      }
      setTransactions(prev => [localTx, ...prev]);
    }
  };

  const handleSaveCategory = async (cat: Omit<TransactionCategory, 'id'> & { id?: string }) => {
    const id = cat.id || ('cat_' + Math.random().toString(36).substring(2, 9));
    const fullCat: TransactionCategory = {
      id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon || 'Tag'
    };
    await persistCategory(fullCat);
    const updated = await fetchAndSyncCategories();
    setCategories(updated);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    if (await confirm('Tem certeza que deseja excluir esta categoria? Transações vinculadas a ela não serão excluídas, mas perderão a referência.')) {
      await removePersistedCategory(id);
      const updated = await fetchAndSyncCategories();
      setCategories(updated);
    }
  };

  const handleSaveExpense = async (newExpense: ExpensePayload) => {
    try {
      const payload: any = {
        description: newExpense.description,
        amount: newExpense.amount,
        type: newExpense.type,
        category_id: newExpense.category_id,
        date: newExpense.date,
        status: newExpense.status,
        account: newExpense.account,
        expense_type: newExpense.expense_type,
        recurrence: newExpense.recurrence,
        notes: newExpense.notes,
        module: newExpense.module || 'global'
      };

      let { data, error } = await supabase.from('finance_transactions').insert([{
        ...payload,
        currency: newExpense.currency || 'BRL',
        original_amount: newExpense.original_amount,
        exchange_rate: newExpense.exchange_rate
      }]).select();

      if (error && error.message?.includes('column')) {
        const retry = await supabase.from('finance_transactions').insert([payload]).select();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      if (data && data[0]) {
        const savedTx: Transaction = {
          ...(data[0] as Transaction),
          module: newExpense.module || (data[0] as any).module || 'global',
          currency: newExpense.currency || 'BRL',
          original_amount: newExpense.original_amount,
          exchange_rate: newExpense.exchange_rate
        };
        setTransactions(prev => [savedTx, ...prev]);
      }
    } catch (e) {
      console.warn('Erro ao salvar despesa no Supabase, adicionando localmente:', e);
      const localTx: Transaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        description: newExpense.description,
        amount: newExpense.amount,
        type: newExpense.type,
        category_id: newExpense.category_id,
        date: newExpense.date,
        status: newExpense.status,
        account: newExpense.account,
        expense_type: newExpense.expense_type,
        recurrence: newExpense.recurrence,
        notes: newExpense.notes,
        module: newExpense.module || 'global',
        currency: newExpense.currency || 'BRL',
        original_amount: newExpense.original_amount,
        exchange_rate: newExpense.exchange_rate
      };
      setTransactions(prev => [localTx, ...prev]);
    }
  };

  const handleSaveRepasse = async (repasse: RepassePayload) => {
    try {
      const incomeCat = categories.find(c => c.type === 'income');
      const basePayload: any = {
        description: repasse.description,
        amount: repasse.amount,
        type: 'income' as const,
        category_id: repasse.category_id || incomeCat?.id || null,
        date: repasse.date,
        status: 'completed' as const,
        account: repasse.account,
        notes: repasse.notes,
        module: repasse.module
      };

      const fullPayload: any = {
        ...basePayload,
        currency: repasse.currency || 'BRL',
        ...(repasse.original_amount !== undefined ? { original_amount: repasse.original_amount } : {}),
        ...(repasse.exchange_rate !== undefined ? { exchange_rate: repasse.exchange_rate } : {})
      };

      let { data, error } = await supabase.from('finance_transactions').insert([fullPayload]).select();
      if (error && error.message?.includes('column')) {
        const retry = await supabase.from('finance_transactions').insert([basePayload]).select();
        data = retry.data;
        error = retry.error;
      }
      if (error) throw error;
      if (data && data[0]) {
        const savedRepasse: Transaction = {
          ...(data[0] as Transaction),
          currency: repasse.currency || 'BRL',
          original_amount: repasse.original_amount,
          exchange_rate: repasse.exchange_rate,
          module: repasse.module
        };
        setTransactions(prev => [savedRepasse, ...prev]);
      }
    } catch (e) {
      console.warn('Erro ao salvar repasse no Supabase, adicionando localmente:', e);
      const localTx: Transaction = {
        id: 'tx_repasse_' + Math.random().toString(36).substring(2, 9),
        description: repasse.description,
        amount: repasse.amount,
        type: 'income',
        category_id: repasse.category_id || categories.find(c => c.type === 'income')?.id || '',
        date: repasse.date,
        status: 'completed',
        account: repasse.account,
        notes: repasse.notes,
        module: repasse.module,
        currency: repasse.currency || 'BRL',
        original_amount: repasse.original_amount,
        exchange_rate: repasse.exchange_rate
      };
      setTransactions(prev => [localTx, ...prev]);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await supabase.from('finance_transactions').delete().eq('id', id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      await refreshFundraising();
    } catch {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'completed' | 'pending') => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await supabase.from('finance_transactions').update({ status: nextStatus }).eq('id', id);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
      await refreshFundraising();
    } catch {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    }
  };

  const handleUpdatePayment = async (
    id: string, 
    updates: { 
      status?: 'completed' | 'pending'; 
      amount?: number; 
      original_amount?: number; 
      exchange_rate?: number; 
      currency?: string;
      date?: string; 
      notes?: string; 
      category_id?: string;
      description?: string;
    }
  ) => {
    try {
      const payload: any = {
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
        ...(updates.currency ? { currency: updates.currency } : {}),
        ...(updates.date ? { date: updates.date } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        ...(updates.category_id !== undefined ? { category_id: updates.category_id } : {}),
        ...(updates.description ? { description: updates.description } : {})
      };

      let { error } = await supabase.from('finance_transactions').update({
        ...payload,
        ...(updates.original_amount !== undefined ? { original_amount: updates.original_amount } : {}),
        ...(updates.exchange_rate !== undefined ? { exchange_rate: updates.exchange_rate } : {})
      }).eq('id', id);

      if (error && error.message?.includes('column')) {
        await supabase.from('finance_transactions').update(payload).eq('id', id);
      }

      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      await refreshFundraising();
    } catch (e) {
      console.error('Error updating payment in Finance:', e);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  const handleSyncRulerNow = async () => {
    setIsSyncingRuler(true);
    setRulerFeedback(null);
    try {
      const res = await syncRulerWithFinance();
      setRulerFeedback(res.message);
      setTimeout(() => setRulerFeedback(null), 6000);
    } finally {
      setIsSyncingRuler(false);
    }
  };

  const handleSaveQuickCampaignEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampId || !editCampTitle || !editCampTarget) return;
    await updateCampaign(
      {
        title: editCampTitle,
        target_amount: parseFloat(editCampTarget),
        type: editCampType
      },
      editingCampId
    );
    setRulerFeedback('Meta e configurações da régua atualizadas com sucesso!');
    setTimeout(() => setRulerFeedback(null), 5000);
    setIsQuickRulerConfigOpen(false);
  };

  const handleExportCurrentViewCSV = () => {
    if (activeTab === 'supporters_quotas') {
      const btn = document.querySelector('button[title="Baixar planilha de apoiadores"]') as HTMLButtonElement;
      if (btn) {
        btn.click();
        return;
      }
    }
    if (activeTab === 'expenses') {
      const btn = document.querySelector('button[title="Baixar planilha de despesas"]') as HTMLButtonElement;
      if (btn) {
        btn.click();
        return;
      }
    }

    const headers = ['Data', 'Tipo', 'Classificação', 'Descrição', 'Conta / Origem', 'Setor / Módulo', 'Status', 'Valor (R$)', 'Moeda Original'];
    const rows = filteredTransactions.map(t => {
      const orig = classifyTransactionOrigin(t);
      const origLabel =
        orig === 'padrinhos' ? 'Padrinho' :
        orig === 'mantenedores' ? 'Mantenedor Mensal' :
        orig === 'doacoes' ? 'Doação Geral' :
        orig === 'repasses' ? 'Repasse Projeto' : 'Despesa';
      return [
        t.date || '',
        t.type === 'income' ? 'Entrada' : 'Saída',
        origLabel,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.account || '').replace(/"/g, '""')}"`,
        t.module || 'global',
        t.status === 'completed' ? 'Efetivado' : 'Pendente',
        (Number(t.amount) || 0).toFixed(2),
        t.currency || 'BRL'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_financeiro_yahhope_${selectedMonth}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openQuickRepasse = (moduleKey: string, suggestedAmt?: number) => {
    setRepasseDefaultModule(moduleKey);
    setRepasseDefaultAmount(suggestedAmt && suggestedAmt > 0 ? suggestedAmt : undefined);
    setIsRepasseModalOpen(true);
  };

  return (
    <div className="space-y-7 pb-14 animate-in fade-in duration-500">
      
      {/* =====================================================================
          HEADER TOPO: TÍTULO + SELETOR DE MÊS GLOBAL + AÇÕES DIRETAS
      ===================================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Finanças & Captação Integradas
            </span>
            <span className="text-xs font-bold text-slate-400">
              • Stripe, InfinitePay, Padrinhos, Projetos e Régua Conectados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-2xl shadow-md">
              <DollarSign className="text-amber-400" size={24} />
            </div>
            Central Financeira YAH Hope
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Acompanhe de forma clara o que entrou, repasse recursos para os projetos e mantenha a régua das campanhas sempre fiel.
          </p>
        </div>

        {/* Barra de Controles Globais: Seletor de Período + Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Seletor de Período Global */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <Calendar size={15} className="text-slate-500 ml-2.5 mr-1.5 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none cursor-pointer shadow-2xs"
              title="Selecione o mês de referência para os indicadores e lançamentos"
            >
              <option value={currentMonthKey}>📅 Mês Atual: {currentMonthName}</option>
              <option value="all">🌐 Todos os Meses (Histórico Acumulado)</option>
              <optgroup label="Filtrar Mês Específico">
                {availableMonths
                  .filter(m => m.key !== currentMonthKey)
                  .map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({m.count} lançamentos)
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Botão: + Nova Entrada */}
          <button
            type="button"
            onClick={() => {
              setTxModalDefaultType('income');
              setIsTxModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Nova Entrada
          </button>

          {/* Botão: Repassar a Projeto */}
          <button
            type="button"
            onClick={() => openQuickRepasse('nutrition')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Send size={14} className="text-emerald-400" />
            Repassar a Projeto
          </button>

          {/* Botão: + Novo Custo */}
          <button
            type="button"
            onClick={() => {
              setExpenseModalType('fixed');
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Novo Custo
          </button>

          {/* Botão: Categorias */}
          <button
            type="button"
            onClick={() => handleChangeTab('categories')}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer",
              activeTab === 'categories'
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            title="Gerenciar Categorias Financeiras"
          >
            <Tag size={15} />
            <span className="hidden sm:inline">Categorias</span>
          </button>

          {/* Botão: Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCurrentViewCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs transition-all cursor-pointer"
            title="Exportar relatório em CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          PAINEL TOPO: FLUXO DO DINHEIRO (4 CARDS CONECTADOS E CLAROS)
      ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* CARD 1: ENTRADAS (DE ONDE VEIO O DINHEIRO) */}
        <div
          onClick={() => {
            setFilterType('income');
            setFilterOrigin('all');
            handleChangeTab('incomes_ruler');
          }}
          className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-500/5 hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-105 transition-transform">
                <TrendingUp size={22} />
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[10px] rounded-lg uppercase tracking-wider">
                1. Entradas ({selectedMonth === 'all' ? 'Histórico' : MONTH_NAMES[parseInt(selectedMonth.split('-')[1] || '1', 10) - 1]})
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-wider">
              {gatewayFeeConfig.useNetAmountInFinance ? 'Arrecadação Líquida (Pós-Taxas)' : 'Arrecadação Bruta Externa'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              R$ {flowStats.periodIncomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {flowStats.periodGatewayFeesTotal > 0 && (
              <p className="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Bruto: R$ {flowStats.periodGrossIncomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[10px] font-black">
                  Taxas Stripe: -R$ {flowStats.periodGatewayFeesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </div>

          {/* Divisão Clara: Padrinhos + Mantenedores + Doações */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 font-bold">
                <Heart size={11} className="text-rose-500 fill-rose-500" /> Padrinhos (Cotas):
              </span>
              <strong className="text-slate-900">R$ {flowStats.padrinhosIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 font-bold">
                <Repeat size={11} className="text-blue-500" /> Mantenedores:
              </span>
              <strong className="text-slate-900">R$ {flowStats.mantenedoresIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 font-bold">
                <DollarSign size={11} className="text-emerald-600" /> Doações / Ofertas:
              </span>
              <strong className="text-slate-900">R$ {flowStats.doacoesIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* CARD 2: REPASSADO AOS PROJETOS (PARA ONDE FOI ENVIADO) */}
        <div
          onClick={() => handleChangeTab('overview')}
          className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-lg shadow-indigo-500/5 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-105 transition-transform">
                <Send size={22} />
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 font-black text-[10px] rounded-lg uppercase tracking-wider">
                2. Repasses a Projetos
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-wider">
              Transferido aos Projetos
            </p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-950 mt-1">
              R$ {flowStats.periodRepassedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-bold">Demanda dos Projetos:</span>
              <strong className="text-slate-800">R$ {projectCardsData.totalDemand.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-bold">Falta repassar no período:</span>
              <strong className={projectCardsData.totalRemainingToRepass > 0 ? "text-amber-600" : "text-emerald-600"}>
                {projectCardsData.totalRemainingToRepass > 0
                  ? `R$ ${projectCardsData.totalRemainingToRepass.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : '100% Coberto ✓'}
              </strong>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openQuickRepasse('nutrition', projectCardsData.cards[0]?.remainingToRepass);
              }}
              className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Send size={11} /> Repassar Agora
            </button>
          </div>
        </div>

        {/* CARD 3: CUSTOS & SAÍDAS OPERACIONAIS */}
        <div
          onClick={() => handleChangeTab('expenses')}
          className="bg-white p-6 rounded-3xl border border-rose-100 shadow-lg shadow-rose-500/5 hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-105 transition-transform">
                <TrendingDown size={22} />
              </div>
              <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 font-black text-[10px] rounded-lg uppercase tracking-wider">
                3. Custos & Despesas
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-wider">
              Saídas Pagas no Período
            </p>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              R$ {flowStats.periodCompletedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <Clock size={11} /> A pagar ({flowStats.periodPendingCount}):
              </span>
              <strong className="text-amber-700">
                R$ {flowStats.periodPendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-bold">Custo Fixo Mensal:</span>
              <strong className="text-slate-800">
                R$ {flowStats.totalMonthlyFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>

        {/* CARD 4: SALDO EM CAIXA (CAIXA CENTRAL LIVRE VS SALDO NOS PROJETOS) */}
        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-white/10 rounded-2xl text-emerald-400">
                <Wallet size={22} />
              </div>
              <span className={cn(
                "px-2.5 py-1 font-black text-[10px] rounded-lg uppercase tracking-wider",
                flowStats.consolidatedCashBalance >= 0 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              )}>
                4. Posição de Caixa
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-wider">
              Caixa Central Livre (Para Alocar)
            </p>
            <p className={cn(
              "text-2xl sm:text-3xl font-black mt-1",
              flowStats.centralAvailableCash >= 0 ? "text-white" : "text-rose-400"
            )}>
              R$ {flowStats.centralAvailableCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-[11px] relative z-10">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-medium">Saldo nos Projetos:</span>
              <strong className={flowStats.projectsInternalBalance >= 0 ? "text-emerald-400" : "text-rose-400"}>
                R$ {flowStats.projectsInternalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-medium">Saldo Total Consolidado:</span>
              <strong className="text-white">
                R$ {flowStats.consolidatedCashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* =====================================================================
          NAVEGAÇÃO PRINCIPAL POR PROPOSTA DE USO (4 ABAS PRINCIPAIS + CATEGORIAS)
      ===================================================================== */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        
        <div className="px-6 sm:px-8 pt-4 bg-slate-50/60 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => handleChangeTab('overview')}
              className={cn(
                "px-4 sm:px-5 py-3.5 font-black text-xs sm:text-sm transition-all relative flex items-center gap-2 rounded-t-2xl cursor-pointer",
                activeTab === 'overview'
                  ? "bg-white text-slate-900 shadow-xs border-t border-x border-slate-200/80 -mb-px"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Send size={16} className={activeTab === 'overview' ? "text-emerald-600" : "text-slate-400"} />
              <span>1. Visão Geral & Repasses aos Projetos</span>
            </button>

            <button
              type="button"
              onClick={() => handleChangeTab('incomes_ruler')}
              className={cn(
                "px-4 sm:px-5 py-3.5 font-black text-xs sm:text-sm transition-all relative flex items-center gap-2 rounded-t-2xl cursor-pointer",
                activeTab === 'incomes_ruler'
                  ? "bg-white text-slate-900 shadow-xs border-t border-x border-slate-200/80 -mb-px"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Target size={16} className={activeTab === 'incomes_ruler' ? "text-emerald-600" : "text-slate-400"} />
              <span>2. Entradas & Régua de Campanhas</span>
              {rulerSummary.pendingSiteDonations.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                  {rulerSummary.pendingSiteDonations.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleChangeTab('expenses')}
              className={cn(
                "px-4 sm:px-5 py-3.5 font-black text-xs sm:text-sm transition-all relative flex items-center gap-2 rounded-t-2xl cursor-pointer",
                activeTab === 'expenses'
                  ? "bg-white text-slate-900 shadow-xs border-t border-x border-slate-200/80 -mb-px"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Repeat size={16} className={activeTab === 'expenses' ? "text-rose-600" : "text-slate-400"} />
              <span>3. Custos & Despesas</span>
            </button>

            <button
              type="button"
              onClick={() => handleChangeTab('supporters_quotas')}
              className={cn(
                "px-4 sm:px-5 py-3.5 font-black text-xs sm:text-sm transition-all relative flex items-center gap-2 rounded-t-2xl cursor-pointer",
                activeTab === 'supporters_quotas'
                  ? "bg-white text-slate-900 shadow-xs border-t border-x border-slate-200/80 -mb-px"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Heart size={16} className={activeTab === 'supporters_quotas' ? "text-rose-500 fill-rose-500" : "text-slate-400"} />
              <span>4. Padrinhos, Mantenedores & Cotas</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            ABA 1: VISÃO GERAL & REPASSES AOS PROJETOS
        =================================================================== */}
        {activeTab === 'overview' && (
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Banner Explicativo do Fluxo Caixa Central -> Projetos */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-lg">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                  <Sparkles size={13} /> Central de Distribuição para Projetos ({selectedPeriodLabel})
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Repasse o dinheiro arrecadado para cobrir os custos dos projetos
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Todas as doações (Stripe, InfinitePay, PIX, Padrinhos e Mantenedores) entram no <strong>Caixa Central</strong>. Abaixo você vê quanto cada frente precisa no mês e faz o repasse em 1 clique (com conversão automática para Meticais na Casa Nutri).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                    Disponível no Caixa Central
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    R$ {flowStats.centralAvailableCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openQuickRepasse('nutrition', projectCardsData.cards[0]?.remainingToRepass)}
                  className="px-5 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Send size={16} />
                  + Novo Repasse a Projeto
                </button>
              </div>
            </div>

            {/* Grid de Cards dos Projetos (Casa Nutri, Comunicação e Demais Projetos) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Situação Financeira por Projeto / Setor ({selectedPeriodLabel})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Compare a necessidade de cada projeto com o valor já repassado e as despesas reais executadas pelo setor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projectCardsData.cards.map((proj) => {
                  const isNutri = proj.moduleKey === 'nutrition';
                  const isComm = proj.moduleKey === 'communication';

                  return (
                    <div
                      key={proj.moduleKey}
                      className={cn(
                        "rounded-3xl p-6 border-2 transition-all flex flex-col justify-between bg-white shadow-sm hover:shadow-md",
                        isNutri
                          ? "border-emerald-200/80"
                          : isComm
                          ? "border-purple-200/80"
                          : "border-slate-200"
                      )}
                    >
                      <div>
                        {/* Cabeçalho do Projeto */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
                              isNutri
                                ? "bg-emerald-100 text-emerald-700"
                                : isComm
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            )}>
                              {isNutri ? <Building2 size={24} /> : <Layers size={24} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base sm:text-lg font-black text-slate-900">
                                  {proj.name}
                                </h4>
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  proj.remainingToRepass === 0 && proj.monthlyTargetDemand > 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : proj.repassed > 0
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                                )}>
                                  {proj.remainingToRepass === 0 && proj.monthlyTargetDemand > 0
                                    ? '✓ Meta do Mês Coberta'
                                    : `${proj.coveragePct}% Coberto`}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {proj.description}
                              </p>
                            </div>
                          </div>

                          <Link
                            to={proj.panelLink}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                            title="Abrir painel de custos detalhado deste setor"
                          >
                            <span>Painel do Setor</span>
                            <ExternalLink size={12} />
                          </Link>
                        </div>

                        {/* 3 Indicadores do Projeto: Demanda | Repassado | Gasto Real & Saldo */}
                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Custo / Demanda
                            </span>
                            <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
                              R$ {proj.monthlyTargetDemand.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Gasto real: R$ {proj.realExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="border-x border-slate-200/70 px-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Já Repassado
                            </span>
                            <span className="text-sm sm:text-base font-black text-emerald-600 mt-0.5 block">
                              R$ {proj.repassed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {proj.repassesCount} {proj.repassesCount === 1 ? 'transferência' : 'transferências'}
                            </span>
                          </div>

                          <div className="pl-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Saldo no Projeto
                            </span>
                            <span className={cn(
                              "text-sm sm:text-base font-black mt-0.5 block",
                              proj.balanceInProject >= 0 ? "text-slate-900" : "text-rose-600"
                            )}>
                              R$ {proj.balanceInProject.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold",
                              proj.remainingToRepass > 0 ? "text-amber-600" : "text-emerald-600"
                            )}>
                              {proj.remainingToRepass > 0
                                ? `Falta R$ ${proj.remainingToRepass.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                : 'Orçamento em dia'}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Cobertura do Orçamento */}
                        <div className="space-y-1.5 mb-5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-500">Cobertura do custo do período pelos repasses</span>
                            <span className="text-slate-900">{proj.coveragePct}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                isNutri ? "bg-emerald-500" : isComm ? "bg-purple-500" : "bg-blue-500"
                              )}
                              style={{ width: `${proj.coveragePct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação Direta de Repasse */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                        {proj.remainingToRepass > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openQuickRepasse(proj.moduleKey, proj.remainingToRepass)}
                              className={cn(
                                "flex-1 py-3 px-4 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer",
                                isNutri
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : isComm
                                  ? "bg-purple-600 hover:bg-purple-700"
                                  : "bg-slate-900 hover:bg-slate-800"
                              )}
                            >
                              <Send size={14} />
                              Repassar Restante: R$ {proj.remainingToRepass.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </button>
                            <button
                              type="button"
                              onClick={() => openQuickRepasse(proj.moduleKey)}
                              className="py-3 px-4 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            >
                              Outro Valor
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openQuickRepasse(proj.moduleKey)}
                            className={cn(
                              "w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer",
                              isNutri
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200"
                                : isComm
                                ? "bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                            )}
                          >
                            <Send size={14} />
                            Fazer Repasse para {proj.name}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duas Colunas Inferiores: Histórico de Repasses Realizados + Resumo da Régua e Últimas Entradas */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2">
              
              {/* Coluna Esquerda (7 cols): Histórico de Repasses Realizados */}
              <div className="xl:col-span-7 bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Send size={15} className="text-emerald-600" />
                      Histórico de Repasses Realizados ({flowStats.periodRepasses.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Transferências enviadas do Caixa Central para os projetos em {selectedPeriodLabel}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/70">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-100">
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Projeto Destino</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {flowStats.periodRepasses.map(r => {
                        const matchedProject = projects.find(p => p.id === r.module || p.name.toLowerCase() === (r.module || '').toLowerCase());
                        const destLabel = r.module === 'nutrition' ? 'Casa Nutri' : r.module === 'communication' ? 'Comunicação' : (matchedProject?.name || r.module || 'Projeto');
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                              {formatTransactionDate(r.date)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                                r.module === 'nutrition'
                                  ? "bg-emerald-100 text-emerald-800"
                                  : r.module === 'communication'
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              )}>
                                {destLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {r.description}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-emerald-600 whitespace-nowrap">
                              <div>R$ {r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                              {r.currency === 'MZN' && r.original_amount && (
                                <div className="text-[10px] font-bold text-slate-400">
                                  {r.original_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (await confirm('Deseja excluir este registro de repasse?')) {
                                    handleDeleteTransaction(r.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Excluir repasse"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {flowStats.periodRepasses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-medium text-xs">
                            Nenhum repasse registrado neste período. Use os botões acima para transferir recursos aos projetos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coluna Direita (5 cols): Resumo da Régua de Campanhas + Atalho para Entradas */}
              <div className="xl:col-span-5 bg-emerald-50/50 rounded-3xl p-6 border border-emerald-200/70 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Target size={12} /> Régua da Campanha Ao Vivo
                    </span>
                    <Link
                      to={`/campanha?id=${activeCampaign?.id || ''}`}
                      target="_blank"
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      Ver Régua Pública <ExternalLink size={12} />
                    </Link>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      {activeCampaign?.title || 'Campanha Mensal Ativa'}
                    </h4>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-black text-emerald-700">
                        R$ {rulerSummary.totalRaisedInRuler.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Meta: R$ {rulerSummary.totalGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({rulerSummary.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-emerald-200 mt-2 p-0.5">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${rulerSummary.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-emerald-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Entradas do Mês Atual (Financeiro):</span>
                      <strong className="text-slate-900">
                        R$ {flowStats.currentMonthIncomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Estágios Ativos na Régua:</span>
                      <strong className="text-emerald-700">{rulerSummary.campaignsList.length} estágio(s)</strong>
                    </div>
                    {rulerSummary.pendingSiteDonations.length > 0 && (
                      <div className="flex justify-between text-amber-700 pt-1 border-t border-slate-100">
                        <span className="font-bold">Doações aguardando aprovação:</span>
                        <strong>{rulerSummary.pendingSiteDonations.length} pendente(s)</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleChangeTab('incomes_ruler')}
                    className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Gerenciar Entradas & Régua <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncRulerNow}
                    disabled={isSyncingRuler}
                    className="py-3 px-4 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Sincronizar régua pública com as entradas reais do financeiro"
                  >
                    <RefreshCw size={14} className={isSyncingRuler ? "animate-spin" : ""} />
                    Sincronizar
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 2: ENTRADAS & RÉGUA DE CAMPANHAS (CONECTADOS EM TEMPO REAL)
        =================================================================== */}
        {activeTab === 'incomes_ruler' && (
          <div className="divide-y divide-slate-100">
            
            {/* PAINEL INTEGRADO DA RÉGUA DE CAMPANHAS */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                      Ligação Direta: Finanças ↔ Régua da Campanha
                    </span>
                    {rulerFeedback && (
                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                        ✓ {rulerFeedback}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Controle da Régua Pública & Entradas Financeiras
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Toda entrada confirmada de Padrinhos, Mantenedores e Doações (Stripe, InfinitePay ou PIX) atualiza automaticamente a régua do mês. Você pode incluir ou ocultar qualquer lançamento com 1 clique na tabela abaixo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncRulerNow}
                    disabled={isSyncingRuler}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isSyncingRuler ? "animate-spin" : ""} />
                    {isSyncingRuler ? 'Sincronizando...' : 'Sincronizar Régua com Entradas'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFeeConfigModalOpen(prev => !prev)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer",
                      isFeeConfigModalOpen
                        ? "bg-amber-50 border-amber-300 text-amber-900"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                    title="Configurar taxas da Stripe e sincronizar valores líquidos repassados"
                  >
                    <CreditCard size={14} className="text-amber-600" />
                    Taxas Stripe (Líquido)
                    {isFeeConfigModalOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQuickRulerConfigOpen(prev => !prev)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Settings2 size={14} />
                    Editar Meta da Régua
                    {isQuickRulerConfigOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <Link
                    to="/admin/fundraising"
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    <Target size={14} className="text-emerald-600" />
                    Estágios & Telão
                  </Link>

                  <Link
                    to={`/campanha?id=${activeCampaign?.id || ''}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Ver Régua no Site <ExternalLink size={13} />
                  </Link>
                </div>
              </div>

              {/* Cards dos Estágios da Régua */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rulerSummary.campaignsList.map((camp, idx) => {
                  const st = calculateCampaignProgress(camp);
                  return (
                    <div
                      key={camp.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Estágio #{camp.priority ?? idx + 1} • {camp.type === 'specific' ? 'Acumulativa' : 'Meta Mensal'}
                          </span>
                          <span className="text-xs font-black text-emerald-600">{st.percentage}%</span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm line-clamp-1">{camp.title}</h4>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex justify-between text-xs mb-1.5">
                          <strong className="text-slate-900">
                            R$ {st.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                          <span className="text-slate-400 font-bold">
                            de R$ {st.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${st.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Painel Expansível de Edição Rápida de Meta da Campanha sem sair do Financeiro */}
              {isQuickRulerConfigOpen && (
                <form
                  onSubmit={handleSaveQuickCampaignEdit}
                  className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-md space-y-4 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Target size={16} className="text-emerald-600" />
                      Ajuste Rápido de Meta e Configuração da Régua
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsQuickRulerConfigOpen(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                        Selecionar Estágio
                      </label>
                      <select
                        value={editingCampId}
                        onChange={e => {
                          const c = campaigns.find(item => item.id === e.target.value);
                          setEditingCampId(e.target.value);
                          if (c) {
                            setEditCampTitle(c.title);
                            setEditCampTarget(String(c.target_amount));
                            setEditCampType(c.type || 'monthly');
                          }
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        {campaigns.map((c, i) => (
                          <option key={c.id} value={c.id}>
                            #{c.priority ?? i + 1} - {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                        Título na Régua
                      </label>
                      <input
                        type="text"
                        value={editCampTitle}
                        onChange={e => setEditCampTitle(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                        Meta (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCampTarget}
                        onChange={e => setEditCampTarget(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-700"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        Salvar Meta
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Painel Expansível: Taxas da Stripe & Valor Líquido Repassado */}
              {isFeeConfigModalOpen && (
                <div className="bg-white p-5 rounded-2xl border-2 border-amber-200 shadow-md space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <CreditCard size={16} className="text-amber-600" />
                        Cálculo do Valor Líquido Repassado pela Stripe (Desconto de Taxas)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        O caixa contabiliza o <strong>valor líquido efetivamente repassado</strong> pela Stripe (sem afetar a cota de R$ 90 dos Padrinhos). Ao clicar em sincronizar com a Stripe, o sistema busca o <code>balance_transaction.net</code> exato de cada pagamento na API.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSyncingStripeApi}
                      onClick={async () => {
                        setIsSyncingStripeApi(true);
                        try {
                          await supabase.functions.invoke('stripe-webhook', { body: { action: 'sync_stripe' } });
                          await fetchData(gatewayFeeConfig);
                          await refreshFundraising();
                          setRulerFeedback('Valores líquidos da Stripe sincronizados com sucesso!');
                          setTimeout(() => setRulerFeedback(null), 5000);
                        } catch {
                          await fetchData(gatewayFeeConfig);
                        } finally {
                          setIsSyncingStripeApi(false);
                        }
                      }}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isSyncingStripeApi ? "animate-spin text-amber-400" : "text-amber-400"} />
                      {isSyncingStripeApi ? 'Consultando Stripe...' : 'Buscar Líquido Exato na API Stripe'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                        Taxa Stripe PIX (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={gatewayFeeConfig.stripePixPercent}
                        onChange={e => {
                          const next = { ...gatewayFeeConfig, stripePixPercent: parseFloat(e.target.value) || 0 };
                          setGatewayFeeConfig(next);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                        Taxa Stripe Cartão (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={gatewayFeeConfig.stripeCardPercent}
                        onChange={e => {
                          const next = { ...gatewayFeeConfig, stripeCardPercent: parseFloat(e.target.value) || 0 };
                          setGatewayFeeConfig(next);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                        Tarifa Fixa Cartão (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={gatewayFeeConfig.stripeCardFixedBrl}
                        onChange={e => {
                          const next = { ...gatewayFeeConfig, stripeCardFixedBrl: parseFloat(e.target.value) || 0 };
                          setGatewayFeeConfig(next);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          saveGatewayFeeConfig(gatewayFeeConfig);
                          // Limpa tags calculadas localmente para recalcular com a nova taxa e atualizar no banco
                          const recalculated = transactions.map(t => {
                            if (t.type !== 'income' || isInternalRepasse(t)) return t;
                            const cleanTx = { ...t, amount: t.original_amount || t.amount, notes: (t.notes || '').replace(/\[STRIPE_NET:[^\]]+\]/g, '').trim() };
                            const gw = resolveTransactionGatewayAmounts(cleanTx, gatewayFeeConfig);
                            if (!gw.isGatewayTx) return t;
                            const nextNotes = buildStripeNetNoteTag(gw.grossAmount, gw.feeAmount, gw.netAmount, cleanTx.notes);
                            if (t.id && !t.id.startsWith('local_')) {
                              supabase.from('finance_transactions').update({
                                amount: gw.netAmount,
                                original_amount: gw.grossAmount,
                                notes: nextNotes
                              }).eq('id', t.id).then(() => {}, () => {});
                            }
                            return { ...t, amount: gw.netAmount, original_amount: gw.grossAmount, notes: nextNotes };
                          });
                          setTransactions(recalculated);
                          await refreshFundraising();
                          setRulerFeedback('Taxas Stripe aplicadas e salvas no caixa!');
                          setTimeout(() => setRulerFeedback(null), 4000);
                          setIsFeeConfigModalOpen(false);
                        }}
                        className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        Aplicar Taxas no Caixa
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Alerta de Doações Pendentes vindas do site para aprovação em 1 clique */}
              {rulerSummary.pendingSiteDonations.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle size={15} className="text-amber-600" />
                      {rulerSummary.pendingSiteDonations.length} Doação(ões) iniciada(s) no site aguardando confirmação
                    </span>
                  </div>
                  <div className="divide-y divide-amber-200/60 bg-white rounded-xl border border-amber-200/80 overflow-hidden">
                    {rulerSummary.pendingSiteDonations.slice(0, 5).map(pd => (
                      <div key={pd.id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <strong className="text-slate-900">{pd.donor_name}</strong>
                          {pd.donor_email && <span className="text-slate-400 ml-1.5">({pd.donor_email})</span>}
                          <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                            {pd.payment_method}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong className="text-amber-700 font-black">
                            R$ {pd.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                          <button
                            type="button"
                            onClick={() => approveDonation(pd.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={12} /> Confirmar na Régua
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDonation(pd.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Remover registro pendente"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BARRA DE FILTROS DE ENTRADAS & EXTRATO */}
            <div className="p-6 sm:p-8 bg-slate-50/40 space-y-4">
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nome do doador, descrição, Stripe, InfinitePay..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Alternador: Apenas Entradas vs Extrato Completo (Entradas + Saídas) */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => { setFilterType('income'); setFilterOrigin('all'); }}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                        filterType === 'income' ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      📥 Apenas Entradas
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilterType('all'); setFilterOrigin('all'); }}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                        filterType === 'all' ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      📋 Extrato Completo (Entradas + Saídas)
                    </button>
                  </div>
                </div>
              </div>

              {/* Pílulas de Origem do Recurso */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Filter size={12} /> Origem:
                </span>

                <button
                  type="button"
                  onClick={() => setFilterOrigin('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    filterOrigin === 'all'
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Todas ({transactions.filter(t => filterType === 'income' ? (t.type === 'income' && !isInternalRepasse(t)) : true).length})
                </button>

                <button
                  type="button"
                  onClick={() => { setFilterType('income'); setFilterOrigin('padrinhos'); }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    filterOrigin === 'padrinhos'
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                  )}
                >
                  <Heart size={12} fill={filterOrigin === 'padrinhos' ? "currentColor" : "none"} />
                  Padrinhos (Cotas ≥ R$ 90)
                </button>

                <button
                  type="button"
                  onClick={() => { setFilterType('income'); setFilterOrigin('mantenedores'); }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    filterOrigin === 'mantenedores'
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                  )}
                >
                  <Repeat size={12} />
                  Mantenedores Mensais
                </button>

                <button
                  type="button"
                  onClick={() => { setFilterType('income'); setFilterOrigin('doacoes'); }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    filterOrigin === 'doacoes'
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                  )}
                >
                  <DollarSign size={12} />
                  Doações Gerais (Stripe / InfinitePay / PIX)
                </button>

                <button
                  type="button"
                  onClick={() => { setFilterType('income'); setFilterOrigin('repasses'); }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    filterOrigin === 'repasses'
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200"
                  )}
                >
                  <Send size={12} />
                  Repasses a Projetos
                </button>
              </div>
            </div>

            {/* LISTAGEM AGRUPADA POR MÊS COM CONTROLE DE VÍNCULO COM A RÉGUA */}
            {filteredTransactions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Filter className="text-slate-300" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Nenhum lançamento encontrado neste filtro</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Experimente mudar o seletor de mês no topo para "Todos os Meses" ou ajustar o filtro de origem.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactionsByMonth.map(monthGroup => (
                  <div key={monthGroup.key}>
                    <div className="bg-slate-50/90 px-6 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-600" />
                        <span className="font-black text-xs text-slate-900 uppercase tracking-wider">
                          {monthGroup.label}
                        </span>
                        <span className="text-[11px] bg-slate-200/80 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                          {monthGroup.transactions.length} {monthGroup.transactions.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          Entradas: + R$ {monthGroup.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {filterType === 'all' && (
                          <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                            Saídas: - R$ {monthGroup.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/40 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-100">
                            <th className="px-6 py-3.5">Status / Data</th>
                            <th className="px-6 py-3.5">Descrição & Categoria</th>
                            <th className="px-6 py-3.5">Origem / Vínculo</th>
                            <th className="px-6 py-3.5">Gateway / Conta</th>
                            <th className="px-6 py-3.5">Régua da Campanha</th>
                            <th className="px-6 py-3.5 text-right">Valor</th>
                            <th className="px-6 py-3.5 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {monthGroup.transactions.map(t => {
                            const category = categories.find(c => c.id === t.category_id);
                            const txOrigin = classifyTransactionOrigin(t);
                            const isExternalIncome = t.type === 'income' && !isInternalRepasse(t);
                            const rulerStatus = getTransactionRulerStatus(t);

                            return (
                              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(t.id, t.status)}
                                      title="Clique para alternar entre Efetivado e Pendente"
                                      className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer",
                                        t.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                      )}
                                    >
                                      {t.status === 'completed' ? <CheckCircle2 size={17} /> : <Clock size={17} />}
                                    </button>
                                    <div>
                                      <p className="text-xs font-black text-slate-900">{formatTransactionDate(t.date)}</p>
                                      <p className={cn(
                                        "text-[10px] font-bold uppercase",
                                        t.status === 'completed' ? "text-emerald-600" : "text-amber-600"
                                      )}>
                                        {t.status === 'completed' ? 'Confirmado' : 'Pendente'}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">{t.description}</p>
                                    {t.currency === 'MZN' && (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                                        🇲🇿 MZN
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase">
                                    <span className={cn("w-2 h-2 rounded-full", category?.color || 'bg-slate-300')} />
                                    {category?.name || (t.type === 'income' ? 'Receita / Doação' : 'Despesa')}
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  {txOrigin === 'padrinhos' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                      <Heart size={10} className="fill-rose-600 text-rose-600" /> Padrinho
                                    </span>
                                  ) : txOrigin === 'mantenedores' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                      <Repeat size={10} /> Mantenedor
                                    </span>
                                  ) : txOrigin === 'repasses' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      <Send size={10} /> Repasse Interno
                                    </span>
                                  ) : txOrigin === 'expenses' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                      {t.expense_type === 'fixed' ? 'Custo Fixo' : 'Despesa Variável'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Doação / Oferta
                                    </span>
                                  )}
                                </td>

                                <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                  <span className="inline-flex items-center gap-1.5">
                                    <CreditCard size={13} className="text-slate-400" />
                                    {t.account || 'Conta Principal'}
                                  </span>
                                </td>

                                {/* Coluna Interativa: Ligação Direta com a Régua de Campanhas */}
                                <td className="px-6 py-4">
                                  {isExternalIncome ? (
                                    <select
                                      value={
                                        !rulerStatus.included
                                          ? 'excluded'
                                          : rulerStatus.campaignId || 'auto'
                                      }
                                      onChange={(e) => setTransactionRulerLink(t.id, e.target.value, t.notes)}
                                      className={cn(
                                        "px-2.5 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer focus:outline-none transition-colors",
                                        !rulerStatus.included
                                          ? "bg-slate-100 text-slate-500 border-slate-200"
                                          : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                      )}
                                      title="Escolha se esta entrada soma na régua pública da campanha"
                                    >
                                      <option value="auto">✓ Na Régua (Automático)</option>
                                      {campaigns.map((c, idx) => (
                                        <option key={c.id} value={c.id}>
                                          🎯 Estágio #{c.priority ?? idx + 1}: {c.title}
                                        </option>
                                      ))}
                                      <option value="excluded">🚫 Fora da Régua</option>
                                    </select>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400">—</span>
                                  )}
                                </td>

                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                  {(() => {
                                    const gw = isExternalIncome ? resolveTransactionGatewayAmounts(t, gatewayFeeConfig) : null;
                                    return (
                                      <>
                                        <p className={cn(
                                          "text-sm sm:text-base font-black",
                                          t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                          {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        {gw && gw.isGatewayTx && gw.feeAmount > 0 && (
                                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                            Bruto: R$ {gw.grossAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} •{' '}
                                            <span className="text-amber-600">Taxa: -R$ {gw.feeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                          </p>
                                        )}
                                        {t.currency === 'MZN' && t.original_amount && (
                                          <p className="text-[10px] font-bold text-slate-400">
                                            {t.original_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT
                                          </p>
                                        )}
                                      </>
                                    );
                                  })()}
                                </td>

                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(t.id, t.status)}
                                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                      title={t.status === 'completed' ? 'Marcar como Pendente' : 'Marcar como Confirmado'}
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (await confirm('Deseja realmente excluir este lançamento financeiro?')) {
                                          handleDeleteTransaction(t.id);
                                        }
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Excluir lançamento"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            ABA 3: CUSTOS & DESPESAS (FIXOS E VARIÁVEIS POR PROJETO/CONTA)
        =================================================================== */}
        {activeTab === 'expenses' && (
          <MonthlyExpensesManager
            transactions={transactions}
            categories={categories}
            totalIncome={flowStats.historicalIncomeTotal}
            projects={projects}
            onSaveExpense={handleSaveExpense}
            onDeleteTransaction={handleDeleteTransaction}
            onToggleStatus={handleToggleStatus}
            onAddCategory={(newCat) => setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat])}
            onUpdatePayment={handleUpdatePayment}
          />
        )}

        {/* ===================================================================
            ABA 4: PADRINHOS, MANTENEDORES & COTAS (UNIFICADOS)
        =================================================================== */}
        {activeTab === 'supporters_quotas' && (
          <div>
            {/* Sub-barra de alternância rápida: Base de Apoiadores vs Mapa de Cotas por Criança */}
            <div className="px-6 sm:px-8 py-4 bg-amber-50/40 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Gestão Integrada de Padrinhos, Mantenedores e Cotas
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Sincronize assinaturas com a Stripe, acompanhe cada doador e calibre a ocupação de cotas por criança.
                </p>
              </div>

              <div className="flex bg-white p-1 rounded-2xl border border-amber-200 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSupportersSubTab('list')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                    supportersSubTab === 'list'
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Heart size={13} fill={supportersSubTab === 'list' ? "currentColor" : "none"} />
                  Base de Apoiadores & Stripe
                </button>
                <button
                  type="button"
                  onClick={() => setSupportersSubTab('quotas')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                    supportersSubTab === 'quotas'
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Users size={13} />
                  Mapa de Crianças & Cotas (R$ 90)
                </button>
              </div>
            </div>

            {supportersSubTab === 'list' ? (
              <SupportersList />
            ) : (
              <div className="p-6 sm:p-8">
                <SponsorshipQuotasManager />
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            ABA 5: CATEGORIAS FINANCEIRAS
        =================================================================== */}
        {activeTab === 'categories' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Categorias de Receitas e Despesas</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Organize a classificação contábil das entradas e saídas da associação.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setEditingCategory(null); setIsCatModalOpen(true); }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 self-start cursor-pointer"
              >
                <Plus size={15} /> Nova Categoria
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xs",
                      cat.color
                    )}>
                      {cat.name}
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => { setEditingCategory(cat); setIsCatModalOpen(true); }}
                        className="p-2 bg-white text-slate-400 hover:text-slate-900 rounded-lg transition-all shadow-2xs cursor-pointer"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-lg transition-all shadow-2xs cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      cat.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                    )} />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {cat.type === 'income' ? 'Receita / Entrada' : 'Despesa / Saída'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200/60 flex justify-between items-center text-slate-400">
                    <p className="text-[10px] font-black uppercase tracking-widest">Total Vinculado</p>
                    <p className="text-sm font-black text-slate-900">
                      R$ {transactions
                        .filter(t => t.category_id === cat.id)
                        .reduce((acc, t) => acc + t.amount, 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* =====================================================================
          MODAIS DE OPERAÇÃO FINANCEIRA
      ===================================================================== */}
      <TransactionModal 
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        defaultType={txModalDefaultType}
        campaigns={campaigns}
        onAddCategory={(newCat) => setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat])}
      />

      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => { setIsCatModalOpen(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        category={editingCategory}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        categories={categories}
        defaultExpenseType={expenseModalType}
        onAddCategory={(newCat) => setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat])}
      />

      <ProjectRepasseModal
        isOpen={isRepasseModalOpen}
        onClose={() => setIsRepasseModalOpen(false)}
        onSave={handleSaveRepasse}
        defaultModule={repasseDefaultModule}
        defaultAmount={repasseDefaultAmount}
        categories={categories}
        projects={projects}
        transactions={transactions}
        availableCentralCash={flowStats.centralAvailableCash}
      />
    </div>
  );
}
