import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useImpact } from '../../../contexts/ImpactContext';
import { useFundraising } from '../../../contexts/FundraisingContext';
import { useBlog } from '../../../contexts/BlogContext';
import { usePatients } from '../../../contexts/PatientContext';
import { sponsorshipService, ChildSponsorshipDetail, SupporterCommitmentSummary } from '../../../services/sponsorshipService';
import { ManageMonthlyPlanModal } from '../../../components/portal/ManageMonthlyPlanModal';
import { 
  Heart, 
  Gift, 
  Activity, 
  Star, 
  ArrowRight, 
  TrendingUp, 
  Sparkles, 
  Briefcase, 
  Newspaper,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Users,
  Target,
  MapPin,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function MobileDonorHome() {
  const { user } = useAuth();
  const { getPublishedItems } = useImpact();
  const { 
    allDonations, 
    activeCampaign, 
    campaign: defaultCamp,
    campaigns,
    calculateCampaignProgress
  } = useFundraising();
  const { posts } = useBlog();
  const { patients } = usePatients();
  const navigate = useNavigate();

  const [myChildren, setMyChildren] = useState<ChildSponsorshipDetail[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [monthlyCommitments, setMonthlyCommitments] = useState<SupporterCommitmentSummary | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const fetchCommitments = () => {
    sponsorshipService.getSupporterCommitments(user?.id, user?.email, user?.name)
      .then(res => setMonthlyCommitments(res))
      .catch(err => console.warn('Erro ao carregar compromissos:', err));
  };

  useEffect(() => {
    sponsorshipService.getSponsoredChildrenForUser(user?.id, user?.email, user?.name)
      .then(children => {
        setMyChildren(children);
        setIsLoadingChildren(false);
      })
      .catch(err => {
        console.error('Erro ao carregar crianças apadrinhadas:', err);
        setIsLoadingChildren(false);
      });

    fetchCommitments();
  }, [user?.id, user?.email, user?.name]);

  // Sincronização idêntica com a Régua da Campanha pública (Home.tsx / Campaign.tsx)
  const availableCampaigns = useMemo(() => {
    const list = campaigns || [];
    const active = list.filter(c => c && c.is_active !== false);
    if (active.length > 0) return active;
    if (list.length > 0) return list;
    if (defaultCamp) return [defaultCamp];
    return [];
  }, [campaigns, defaultCamp]);

  const totalRulerGoal = useMemo(() => {
    return availableCampaigns.reduce((sum, c) => sum + (c.target_amount || 0), 0);
  }, [availableCampaigns]);

  const totalRulerRaised = useMemo(() => {
    return availableCampaigns.reduce((sum, c) => {
      const p = calculateCampaignProgress(c);
      return sum + p.currentAmount;
    }, 0);
  }, [availableCampaigns, calculateCampaignProgress]);

  const rulerOverallPercentage = totalRulerGoal > 0 
    ? Math.min(Math.round((totalRulerRaised / totalRulerGoal) * 100), 100) 
    : 0;

  const stagesData = useMemo(() => {
    let runningTarget = 0;
    return availableCampaigns.map((camp, idx) => {
      const prevTarget = runningTarget;
      runningTarget += (camp.target_amount || 0);
      const threshold = runningTarget;
      const isReached = totalRulerRaised >= threshold;
      const isCurrent = !isReached && totalRulerRaised >= prevTarget;
      const isUpcoming = totalRulerRaised < prevTarget;
      
      const campStats = calculateCampaignProgress(camp);
      const stageNumber = idx + 1;

      let stageProgress = 0;
      if (isReached) {
        stageProgress = 100;
      } else if (isCurrent && camp.target_amount > 0) {
        const raisedInThisStage = Math.max(0, totalRulerRaised - prevTarget);
        stageProgress = Math.min(100, Math.round((raisedInThisStage / camp.target_amount) * 100));
      }

      return {
        campaign: camp,
        stageNumber,
        prevTarget,
        threshold,
        isReached,
        isCurrent,
        isUpcoming,
        campStats,
        stageProgress
      };
    });
  }, [availableCampaigns, totalRulerRaised, calculateCampaignProgress]);

  const currentActiveStage = useMemo(() => {
    return stagesData.find(s => s.isCurrent) || stagesData[0] || null;
  }, [stagesData]);

  const currentCampaign = currentActiveStage?.campaign || activeCampaign || defaultCamp;
  const currentStageProgress = currentActiveStage ? currentActiveStage.stageProgress : (currentCampaign?.target_amount ? Math.min(100, Math.round((totalRulerRaised / currentCampaign.target_amount) * 100)) : 0);
  const currentStageRaised = currentActiveStage ? (currentActiveStage.isReached ? currentActiveStage.campaign.target_amount : Math.max(0, totalRulerRaised - currentActiveStage.prevTarget)) : totalRulerRaised;
  const currentStageTarget = currentCampaign?.target_amount || 0;

  // Doações reais do usuário logado
  const userDonations = allDonations.filter(d => {
    const emailMatches = Boolean(d.donor_email && d.donor_email.toLowerCase().trim() === user?.email?.toLowerCase().trim());
    const userMatches = Boolean(user?.id && (d.sponsor_id === user.id || d.user_id === user.id));
    return (emailMatches || userMatches) && d.status === 'paid';
  });
  const totalUserDonated = userDonations.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const donationsCount = userDonations.length;

  // Informações do mês corrente para visão geral mensal
  const currentMonthInfo = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const rawMonthName = now.toLocaleDateString('pt-BR', { month: 'long' });
    const monthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);
    return {
      year: curYear,
      month: curMonth,
      name: monthName
    };
  }, []);

  // Doações do usuário estritamente no mês atual
  const userMonthlyDonations = useMemo(() => {
    return userDonations.filter(d => {
      const rawDate = d.paid_at || d.date;
      if (!rawDate) return false;
      const match = String(rawDate).match(/^(\d{4})-(\d{2})/);
      let dYear: number;
      let dMonth: number;
      if (match) {
        dYear = parseInt(match[1], 10);
        dMonth = parseInt(match[2], 10) - 1;
      } else {
        const dObj = new Date(rawDate);
        if (isNaN(dObj.getTime())) return false;
        dYear = dObj.getFullYear();
        dMonth = dObj.getMonth();
      }
      return dYear === currentMonthInfo.year && dMonth === currentMonthInfo.month;
    });
  }, [userDonations, currentMonthInfo]);

  const totalUserMonthlyDonated = useMemo(() => {
    return userMonthlyDonations.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [userMonthlyDonations]);
  const monthlyDonationsCount = userMonthlyDonations.length;

  // Ordenação das doações por data mais recente
  const sortedUserDonations = useMemo(() => {
    return [...userDonations].sort((a, b) => {
      const dateA = new Date(a.paid_at || a.date || 0).getTime();
      const dateB = new Date(b.paid_at || b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [userDonations]);

  const latestDonation = sortedUserDonations[0];

  // Cálculo real do impacto social baseado nas doações efetivas (R$ 5 = 1 refeição fortificada)
  const mealsProvided = Math.floor(totalUserDonated / 5);

  // Cálculo de idade da criança a partir de dob
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'Idade não informada';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 'Idade não informada';
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  };

  const isDonorOrSponsor = user?.role === 'SPONSOR' || myChildren.length > 0 || (user?.role !== 'ADMIN' && user?.role !== 'USER');
  const myChildIds = useMemo(() => new Set(myChildren.map(c => c.id)), [myChildren]);

  // Crianças reais do sistema: Para mantenedores/padrinhos, EXCLUSIVAMENTE suas crianças apadrinhadas
  const displayedPatients = useMemo(() => {
    if (isDonorOrSponsor) {
      const sponsoredFromPatients = patients.filter(c => myChildIds.has(c.id));
      if (sponsoredFromPatients.length > 0) return sponsoredFromPatients;
      return myChildren.map(c => ({
        id: c.id,
        name: c.name,
        dob: c.dob || '',
        status: (c.nutritional_status || 'Adequado') as any,
        community: c.community || 'Casa Nutri',
        photo_url: c.photo_url,
        registration_number: '',
        gender: (c.gender || 'M') as any,
        created_at: '',
        guardian_name: '',
        housing_type: '',
        sanitation: ''
      }));
    }
    return patients.slice(0, 4);
  }, [isDonorOrSponsor, patients, myChildIds, myChildren]);

  const publishedImpact = getPublishedItems().slice(0, 3);
  const latestPost = posts.find(p => p.status === 'published') || posts[0];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Hero Banner de Boas-Vindas */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-[2rem] p-6 sm:p-10 text-white shadow-2xl border border-slate-800/80">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Lado Esquerdo (7 cols): Saudação & Ações */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#F49853]/25 to-orange-500/10 border border-[#F49853]/40 px-3.5 py-1.5 rounded-full text-[#F49853] text-xs font-gotham-bold uppercase tracking-wider backdrop-blur-sm shadow-xs">
              <Heart size={14} fill="currentColor" className="animate-pulse text-[#F49853]" />
              <span>Aliança de Esperança • Mantenedor Ativo</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight">
                Ihale, <span className="bg-gradient-to-r from-white via-orange-50 to-[#F49853] bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'Mantenedor'}</span>!
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-gotham-light leading-relaxed max-w-xl">
                Sua fidelidade e generosidade sustentam o tratamento de crianças desnutridas na Casa Nutri e geram transformação real para famílias em extrema vulnerabilidade.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/portal/donations"
                className="group relative overflow-hidden bg-gradient-to-r from-[#F49853] to-orange-500 hover:from-[#e0853d] hover:to-orange-600 text-white font-gotham-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Heart size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                <span>Fazer Nova Contribuição</span>
              </Link>
              <Link
                to="/portal/my-donations"
                className="bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/25 text-white font-gotham-medium text-xs px-5 py-3.5 rounded-xl transition-all flex items-center gap-2 backdrop-blur-sm shadow-xs active:scale-98"
              >
                <Receipt size={16} className="text-orange-300" />
                <span>Histórico de Contribuições</span>
              </Link>
            </div>
          </div>

          {/* Lado Direito (5 cols): Card de Impacto Social Real do Usuário */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-md rounded-2xl p-6 border border-white/15 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[#F49853]">
                    <Sparkles size={16} />
                  </div>
                  <span className="text-[11px] font-gotham-bold uppercase tracking-wider text-orange-200">
                    Seu Impacto na Missão
                  </span>
                </div>
                <span className={`text-[10px] font-gotham-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                  donationsCount > 0
                    ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                    : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${donationsCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-300'}`}></span>
                  {donationsCount > 0 ? 'Mantenedor Ativo' : 'Cadastro Recente'}
                </span>
              </div>

              {/* Descrição real do impacto das contribuições */}
              <p className="text-xs text-slate-200 font-gotham-light leading-relaxed">
                {myChildren.length > 0 ? (
                  <>
                    Você apadrinha diretamente <strong className="font-gotham-bold text-white">{myChildren.length === 1 ? myChildren[0].name : `${myChildren.length} crianças`}</strong> na Casa Nutri, garantindo acompanhamento clínico e nutricional.
                  </>
                ) : totalUserDonated > 0 ? (
                  <>
                    Seu total de <strong className="font-gotham-bold text-white">R$ {totalUserDonated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> foi direcionado para o tratamento de crianças desnutridas e manutenção da Casa Nutri.
                  </>
                ) : (
                  <>
                    Suas futuras contribuições e apadrinhamentos serão convertidos diretamente em tratamento e refeições nutritivas com acompanhamento aqui.
                  </>
                )}
              </p>

              {/* Métricas Reais do Usuário */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="bg-black/25 rounded-xl p-3 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-gotham-medium block">
                    Refeições Viabilizadas
                  </span>
                  <span className="text-sm font-heading font-black text-amber-300 block">
                    {mealsProvided > 0 ? `~${mealsProvided} refeições` : '0 refeições'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-gotham-light block">
                    {totalUserDonated > 0 ? 'Nutrição terapêutica' : 'Aguardando 1ª doação'}
                  </span>
                </div>

                <div className="bg-black/25 rounded-xl p-3 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-gotham-medium block">
                    Última Contribuição
                  </span>
                  <span className="text-sm font-heading font-black text-white block">
                    {latestDonation 
                      ? `R$ ${latestDonation.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                      : 'R$ 0,00'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-gotham-light block truncate">
                    {latestDonation?.date 
                      ? `${new Date(latestDonation.paid_at || latestDonation.date).toLocaleDateString('pt-BR')} • ${latestDonation.payment_method?.toUpperCase() || 'PIX'}`
                      : 'Nenhuma ainda'}
                  </span>
                </div>
              </div>

              {/* Linha de status do doador */}
              <div className="pt-1 text-[11px] text-slate-300 font-gotham-medium flex items-center justify-between border-t border-white/10">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>
                    {donationsCount > 0 
                      ? `${donationsCount} ${donationsCount === 1 ? 'doação confirmada' : 'doações confirmadas'} no sistema` 
                      : 'Nenhuma doação registrada'}
                  </span>
                </span>
                {myChildren.length > 0 && (
                  <span className="text-xs text-rose-300 flex items-center gap-1 font-gotham-bold">
                    <Heart size={12} fill="currentColor" /> {myChildren.length} {myChildren.length === 1 ? 'afilhada' : 'afilhadas'}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Efeitos decorativos sutis de fundo */}
        <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-gradient-to-br from-[#F49853]/20 to-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Banner de Apoio Mensal Geral Ativo com Ações de Alteração e Cancelamento */}
      {monthlyCommitments?.generalMonthlySupport?.active && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/90 rounded-[1.75rem] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-orange-200 flex items-center justify-center text-[#F49853] shadow-xs shrink-0">
              <RefreshCw size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Apoio Mensal Ativo
                </span>
                <span className="text-xs text-slate-500 font-gotham-medium">
                  R$ {monthlyCommitments.generalMonthlySupport.monthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-heading font-black text-slate-900 mt-1">
                Apoio Mensal Geral • Casa Nutri
              </h4>
              <p className="text-xs text-slate-500 font-gotham-light">
                Ao alterar o valor, o novo valor substitui o anterior. Você pode cancelar ou alterar quando quiser.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Alterar / Aumentar Apoio
            </button>
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-gotham-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* 2. Grid de Métricas Reais do Mantenedor */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Contribuído no Mês */}
        <div className="group bg-white p-5 sm:p-6 rounded-[1.75rem] border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-orange-500/5 hover:border-orange-200 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-400 to-[#F49853] text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <span className="text-[10px] font-gotham-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100/60 capitalize">
              {currentMonthInfo.name}
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900 block leading-tight tracking-tight">
              {totalUserMonthlyDonated > 0 ? `R$ ${totalUserMonthlyDonated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
            </span>
            <span className="text-[11px] font-gotham-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Total Doado no Mês
            </span>
            <span className="text-[10px] text-slate-400 font-gotham-book mt-1 block">
              Geral acumulado: R$ {totalUserDonated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Quantidade de Doações */}
        <div className="group bg-white p-5 sm:p-6 rounded-[1.75rem] border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Receipt size={20} />
            </div>
            <span className="text-[10px] font-gotham-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60">
              Confirmadas
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900 block leading-tight tracking-tight">
              {donationsCount}
            </span>
            <span className="text-[11px] font-gotham-bold text-slate-400 uppercase tracking-wider mt-1 block">
              {donationsCount === 1 ? 'Doação Concluída' : 'Doações Concluídas'}
            </span>
          </div>
        </div>

        {/* Crianças Apadrinhadas */}
        <div className="group bg-white p-5 sm:p-6 rounded-[1.75rem] border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-rose-500/5 hover:border-rose-200 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Heart size={20} fill="currentColor" />
            </div>
            <span className={`text-[10px] font-gotham-bold px-2 py-0.5 rounded-full border ${
              myChildren.length > 0 
                ? 'text-rose-700 bg-rose-50 border-rose-100' 
                : 'text-amber-700 bg-amber-50 border-amber-100'
            }`}>
              {myChildren.length > 0 ? 'Apadrinhamento' : 'Aguardando'}
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900 block leading-tight tracking-tight">
              {isDonorOrSponsor ? myChildren.length : (patients.length > 0 ? patients.length : '18+')}
            </span>
            <span className="text-[11px] font-gotham-bold text-slate-400 uppercase tracking-wider mt-1 block">
              {isDonorOrSponsor ? 'Crianças Apadrinhadas' : 'Crianças Atendidas'}
            </span>
          </div>
        </div>

        {/* Meta do Estágio Atual */}
        <div className="group bg-white p-5 sm:p-6 rounded-[1.75rem] border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Target size={20} />
            </div>
            <span className="text-[10px] font-gotham-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/60">
              {currentActiveStage ? `Fase ${currentActiveStage.stageNumber}` : 'Casa Nutri'}
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900 block leading-tight tracking-tight">
              {currentCampaign 
                ? `${currentStageProgress}%`
                : '100%'}
            </span>
            <span className="text-[11px] font-gotham-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Meta do Estágio Atual
            </span>
          </div>
        </div>

      </div>

      {/* 3. Grid Principal em 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA (7 cols): Crianças da Casa Nutri & Atualizações de Campo */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Seção Crianças Atendidas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
                  <Heart className="text-[#F49853]" size={22} fill="currentColor" /> 
                  {isDonorOrSponsor ? 'Minhas Crianças Apadrinhadas' : 'Crianças em Acompanhamento'}
                </h3>
                <p className="text-xs text-slate-500 font-gotham-light">
                  {isDonorOrSponsor 
                    ? 'Acompanhe a recuperação e o progresso da(s) criança(s) que você apadrinha.' 
                    : 'Vidas que recebem acolhimento e tratamento nutricional contínuo.'}
                </p>
              </div>
              <Link
                to="/portal/sponsorship"
                className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-1 group"
              >
                <span>Ver todas</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {isLoadingChildren ? (
              <div className="bg-white rounded-[1.75rem] p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="font-bold text-slate-600">Carregando suas crianças apadrinhadas...</p>
              </div>
            ) : displayedPatients.length === 0 ? (
              isDonorOrSponsor ? (
                /* Card Acolhedor de Convite com Crianças em Espera */
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-amber-50/90 border border-amber-200/80 rounded-[1.75rem] p-6 sm:p-7 shadow-xs space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 text-[#F49853] shadow-sm border border-orange-100">
                        <Heart size={24} fill="currentColor" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-heading font-black text-slate-900 text-base">
                          Seja a resposta para uma criança na Casa Nutri
                        </h4>
                        <p className="text-xs text-slate-600 font-gotham-light leading-relaxed">
                          Com o apadrinhamento mensal de R$ 90, você garante tratamento nutricional intensivo, fórmulas terapêuticas e acompanha fotos e relatórios exclusivos de recuperação.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <Link
                        to="/portal/apadrinhar"
                        className="inline-flex items-center gap-2 bg-[#F49853] hover:bg-[#e0853d] text-white px-5 py-2.5 rounded-xl font-gotham-bold text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all active:scale-98 cursor-pointer"
                      >
                        <Heart size={14} fill="currentColor" />
                        <span>Apadrinhar uma Criança Agora</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[1.75rem] p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
                  <Users size={32} className="mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="font-bold text-slate-600">Nenhuma criança registrada no momento.</p>
                  <p className="mt-1">Novos atendimentos da Casa Nutri serão sincronizados em breve.</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedPatients.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => navigate('/portal/sponsorship')}
                    className="bg-white p-5 rounded-[1.75rem] border border-slate-200/80 hover:border-orange-300 shadow-xs hover:shadow-md transition-all flex items-start gap-4 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-orange-100 border border-orange-200 shrink-0 group-hover:scale-105 transition-transform">
                      {child.photo_url ? (
                        <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#F49853] font-heading font-black text-lg">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-heading font-black text-slate-900 text-sm truncate">
                          {child.name}
                        </h4>
                        <span className={`text-[9px] font-gotham-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          child.status === 'Adequado' || child.status === 'Alta'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {child.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-gotham-light mt-0.5">
                        {calculateAge(child.dob)} • {child.community || 'Casa Nutri'}
                      </p>
                      <span className="text-[11px] text-[#F49853] font-gotham-bold mt-2 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Acompanhar evolução <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção Atualizações de Campo & Transparência */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={22} />
                  Atualizações de Campo
                </h3>
                <p className="text-xs text-slate-500 font-gotham-light">
                  Transparência de cada ação desenvolvida com os mantenedores.
                </p>
              </div>
              <Link
                to="/portal/projects"
                className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-1 group"
              >
                <span>Ver projetos</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-3">
              {publishedImpact.length === 0 ? (
                <div className="bg-white p-6 rounded-[1.75rem] border border-slate-200/80 text-center text-xs text-slate-400">
                  Novos relatórios fotográficos e médicos serão publicados em breve pela coordenação.
                </div>
              ) : (
                publishedImpact.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-[1.75rem] border border-slate-200/80 shadow-xs space-y-2 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        {item.type === 'child' ? 'Criança' : item.type === 'project' ? 'Projeto' : 'Relatório'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="font-heading font-black text-slate-900 text-sm leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-600 font-gotham-light leading-relaxed">{item.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA (5 cols): Régua de Arrecadação & Notícia do Blog */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Card Campanha da Régua Ativa */}
          {currentCampaign && (
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-white rounded-[2rem] p-6 sm:p-7 shadow-xl space-y-5 border border-slate-800 hover:border-orange-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-gotham-bold uppercase tracking-widest text-[#F49853] bg-orange-500/15 px-3 py-1 rounded-full border border-orange-500/30 flex items-center gap-1.5">
                  <Target size={12} />
                  Meta da Casa Nutri
                </span>
                <span className="text-xs font-gotham-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {currentActiveStage ? `Fase ${currentActiveStage.stageNumber} Ativa` : 'Fase Ativa'}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-heading font-black text-white leading-snug">
                  {currentCampaign.title}
                </h3>
                <p className="text-xs text-slate-300 font-gotham-light leading-relaxed line-clamp-2">
                  {currentCampaign.description}
                </p>
              </div>

              {/* Barra de Progresso Real da Fase com Glow */}
              <div className="space-y-2 pt-1 bg-white/[0.04] p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-gotham-medium text-slate-400">Progresso da Fase Atual</span>
                  <span className="font-gotham-bold text-[#F49853] text-sm">
                    {currentStageProgress}%
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 via-[#F49853] to-orange-500 rounded-full shadow-[0_0_12px_rgba(244,152,83,0.5)] transition-all duration-700"
                    style={{ width: `${currentStageProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-gotham-medium pt-0.5">
                  <span>R$ {currentStageRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span className="text-slate-300 font-gotham-bold">Alvo da Fase: R$ {currentStageTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Pilares do Impacto */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-gotham-medium text-slate-300">
                <div className="bg-white/5 py-2 px-1 rounded-xl border border-white/5">
                  🥣 Nutrição Diária
                </div>
                <div className="bg-white/5 py-2 px-1 rounded-xl border border-white/5">
                  🩺 Exames & Triagem
                </div>
                <div className="bg-white/5 py-2 px-1 rounded-xl border border-white/5">
                  👩‍⚕️ Equipe Clínica
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Transparência total dos recursos</span>
                <Link to="/campanha" className="text-[#F49853] hover:text-amber-300 font-gotham-bold flex items-center gap-1 group transition-colors">
                  <span>Ver detalhes da régua</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* Destaque do Blog */}
          {latestPost && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-black text-slate-900 flex items-center gap-2">
                  <Newspaper className="text-blue-500" size={20} />
                  Novidades da Comunidade
                </h3>
                <Link
                  to="/blog"
                  className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-0.5 group"
                >
                  <span>Ver todas</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div
                onClick={() => navigate(`/blog?post=${latestPost.id}`)}
                className="bg-white rounded-[1.75rem] border border-slate-200/80 overflow-hidden shadow-xs hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="h-44 w-full relative overflow-hidden">
                  <img
                    src={latestPost.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'}
                    alt={latestPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-gotham-bold uppercase tracking-wider px-3 py-1 rounded-lg">
                    {latestPost.category}
                  </span>
                </div>
                <div className="p-5">
                  <h4 className="font-heading font-black text-slate-900 text-base leading-snug line-clamp-2">
                    {latestPost.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-gotham-light mt-2 line-clamp-2 leading-relaxed">
                    {latestPost.excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>{latestPost.author || 'Equipe YAH Hope'}</span>
                    <span className="text-[#F49853] font-gotham-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ler artigo <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modal de Gestão do Apoio Mensal */}
      <ManageMonthlyPlanModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        currentAmount={monthlyCommitments?.generalMonthlySupport?.monthlyAmount || 100}
        isActive={Boolean(monthlyCommitments?.generalMonthlySupport?.active)}
        onSuccess={() => fetchCommitments()}
      />
    </div>
  );
}
