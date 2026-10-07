import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Target, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  Layers, 
  Flag, 
  Lock, 
  Award,
  ArrowRight,
  CreditCard,
  Flame
} from 'lucide-react';
import { useFundraising, Campaign as CampaignType } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';

const QUOTAS = [
  { amount: 50, label: 'Alimenta uma criança', icon: Heart },
  { amount: 120, label: 'Apadrinhamento mensal', icon: Target },
  { amount: 300, label: 'Cesta básica + Suplementos', icon: TrendingUp },
];

const FALLBACK_CAMPAIGN: CampaignType = {
  id: '1',
  title: 'Campanha de Nutrição Infantil',
  description: 'Ajude-nos a combater a desnutrição infantil e transformar vidas.',
  target_amount: 20000,
  current_amount: 0,
  type: 'monthly',
  is_active: true,
  milestones: []
};

export function Campaign() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlCampaignId = searchParams.get('id') || searchParams.get('campaign');

  const { 
    campaigns = [], 
    activeCampaign, 
    campaign: defaultCamp, 
    createDonation, 
    currentMonthName,
    calculateCampaignProgress 
  } = useFundraising();

  // Lista de todas as campanhas ativas (cada uma é um estágio na régua)
  const availableCampaigns = useMemo(() => {
    const list = campaigns || [];
    const active = list.filter(c => c && c.is_active !== false);
    if (active.length > 0) return active;
    if (list.length > 0) return list;
    if (defaultCamp) return [defaultCamp];
    return [FALLBACK_CAMPAIGN];
  }, [campaigns, defaultCamp]);

  // Cálculos da Régua Geral de Arrecadação Cumulativa
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

  // Cada campanha criada é um estágio na régua de arrecadação
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

      // Progresso percentual dentro deste estágio
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

  // Identifica o estágio ativo em andamento
  const currentActiveStage = useMemo(() => {
    return stagesData.find(s => s.isCurrent) || stagesData[0] || null;
  }, [stagesData]);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(() => {
    if (urlCampaignId) {
      const found = campaigns?.find(c => c && c.id === urlCampaignId);
      if (found) return found.id;
    }
    // Por padrão seleciona o estágio atualmente em andamento
    if (currentActiveStage) return currentActiveStage.campaign.id;
    return activeCampaign?.id || defaultCamp?.id || campaigns?.[0]?.id || FALLBACK_CAMPAIGN.id;
  });

  React.useEffect(() => {
    if (urlCampaignId && availableCampaigns.some(c => c && c.id === urlCampaignId)) {
      setSelectedCampaignId(urlCampaignId);
    }
  }, [urlCampaignId, availableCampaigns]);

  // Campanha/Estágio selecionado atualmente para detalhes
  const currentCampaign = useMemo(() => {
    return availableCampaigns.find(c => c && c.id === selectedCampaignId) || availableCampaigns[0] || defaultCamp || FALLBACK_CAMPAIGN;
  }, [availableCampaigns, selectedCampaignId, defaultCamp]);

  const currentStageInfo = useMemo(() => {
    return stagesData.find(s => s.campaign.id === currentCampaign.id) || stagesData[0];
  }, [stagesData, currentCampaign.id]);

  const handleSelectCampaign = (campId: string) => {
    setSelectedCampaignId(campId);
    setSearchParams({ id: campId }, { replace: true });
    
    setTimeout(() => {
      const el = document.getElementById(`campaign-card-${campId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Redireciona para o fluxo de Mantenedor com o valor selecionado
  const handleBecomeMonthlyDonor = () => {
    let finalAmount = selectedAmount;
    if (isCustom && customAmount) {
      const numericString = customAmount.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(numericString);
      if (!isNaN(parsed) && parsed > 0) finalAmount = parsed;
    }
    navigate(`/mantenedor?amount=${finalAmount}`);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setCustomAmount('');
      return;
    }

    const numericValue = parseInt(value, 10) / 100;
    const formatted = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    setCustomAmount(formatted);
  };

  React.useEffect(() => {
    if (currentCampaign.accept_pix === false && currentCampaign.accept_card !== false) {
      setPaymentMethod('credit_card');
    } else if (currentCampaign.accept_card === false && currentCampaign.accept_pix !== false) {
      setPaymentMethod('pix');
    }
  }, [currentCampaign.accept_pix, currentCampaign.accept_card]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAmount = selectedAmount;
    if (isCustom) {
      const numericString = customAmount.replace(/\./g, '').replace(',', '.');
      finalAmount = parseFloat(numericString);
    }

    if (!finalAmount || isNaN(finalAmount)) return;

    setIsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

      if (!supabaseUrl) {
        // Modo Demonstração sem Supabase configurado
        setTimeout(() => {
          createDonation({
            campaign_id: currentCampaign.id,
            donor_name: name,
            donor_email: email,
            amount: finalAmount,
            payment_method: paymentMethod
          });
          setIsLoading(false);
          setIsSubmitted(true);
        }, 1200);
        return;
      }

      // Processamento oficial via Stripe (PIX ou Cartão)
      const baseUrl = supabaseUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          campaignId: currentCampaign.id,
          amount: finalAmount,
          isMonthly: false,
          paymentMethod, // 'pix' ou 'credit_card'
          donorName: name,
          donorEmail: email,
          successUrl: `${window.location.origin}/campanha?id=${currentCampaign.id}&status=success`,
          cancelUrl: `${window.location.origin}/campanha?id=${currentCampaign.id}&status=cancel`
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Error starting checkout:', data);
        createDonation({
          campaign_id: currentCampaign.id,
          donor_name: name,
          donor_email: email,
          amount: finalAmount,
          payment_method: paymentMethod
        });
        setIsLoading(false);
        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      alert(`Erro ao processar a doação: ${error.message || 'Falha na rede'}.`);
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Obrigado pela sua doação!</h2>
          <p className="text-slate-500 mb-8">
            Seu apoio à campanha <strong>{currentCampaign.title}</strong> transforma vidas e restaura a esperança.
          </p>
          <Link to="/" className="inline-block bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const renderDonationForm = (camp: Campaign) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-900">Escolha o valor</h3>
          <span className="text-xs font-bold text-slate-400">Doação segura</span>
        </div>
        
        <div className="space-y-3 mb-6">
          {QUOTAS.map((q) => (
            <button
              key={q.amount}
              type="button"
              onClick={() => { setIsCustom(false); setSelectedAmount(q.amount); }}
              className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer",
                !isCustom && selectedAmount === q.amount 
                  ? "border-emerald-500 bg-emerald-50/50 shadow-xs" 
                  : "border-slate-200 bg-white hover:border-emerald-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  !isCustom && selectedAmount === q.amount ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  <q.icon size={18} />
                </div>
                <div className="text-left">
                  <p className={cn("font-black text-lg", !isCustom && selectedAmount === q.amount ? "text-emerald-900" : "text-slate-900")}>
                    R$ {q.amount}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">{q.label}</p>
                </div>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                !isCustom && selectedAmount === q.amount ? "border-emerald-500" : "border-slate-300"
              )}>
                {!isCustom && selectedAmount === q.amount && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={cn(
              "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer",
              isCustom 
                ? "border-emerald-500 bg-emerald-50/50 shadow-xs" 
                : "border-slate-200 bg-white hover:border-emerald-200"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                isCustom ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
              )}>
                <DollarSign size={18} />
              </div>
              <div className="text-left w-full">
                <p className={cn("font-black text-lg", isCustom ? "text-emerald-900" : "text-slate-900")}>
                  Outro Valor
                </p>
                {isCustom && (
                  <div className="mt-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="0,00"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-base font-black text-slate-900"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2",
              isCustom ? "border-emerald-500" : "border-slate-300"
            )}>
              {isCustom && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
            </div>
          </button>
        </div>

        <form onSubmit={handleDonate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-medium bg-white"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-medium bg-white"
              placeholder="seu@email.com"
            />
          </div>

          {(camp.accept_pix !== false || camp.accept_card !== false) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Forma de Pagamento</label>
              <div className="flex gap-3">
                {camp.accept_pix !== false && (
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name={`payment-${camp.id}`} 
                      value="pix" 
                      checked={paymentMethod === 'pix'} 
                      onChange={() => setPaymentMethod('pix')}
                      className="peer sr-only" 
                    />
                    <div className="p-2.5 text-center border border-slate-200 rounded-xl font-bold text-xs text-slate-600 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 transition-colors shadow-xs">
                      PIX ou Boleto
                    </div>
                  </label>
                )}
                {camp.accept_card !== false && (
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name={`payment-${camp.id}`} 
                      value="credit_card" 
                      checked={paymentMethod === 'credit_card'} 
                      onChange={() => setPaymentMethod('credit_card')}
                      className="peer sr-only" 
                    />
                    <div className="p-2.5 text-center border border-slate-200 rounded-xl font-bold text-xs text-slate-600 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 transition-colors shadow-xs">
                      Cartão de Crédito
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Botão de Doação Única para a Régua */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0F172A] hover:bg-emerald-600 disabled:opacity-70 text-white font-black text-base py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-slate-900/10 cursor-pointer"
          >
            {isLoading ? (
              <span className="animate-pulse">Processando...</span>
            ) : (
              <>
                Doar R$ {isCustom ? (customAmount || '0') : selectedAmount} para a Régua
                <ChevronRight size={18} />
              </>
            )}
          </button>

          {/* Botão Seja um Mantenedor Mensal (Custo Mensal do Projeto) */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBecomeMonthlyDonor}
              className="w-full bg-gradient-to-r from-[#F49853] to-orange-500 hover:from-[#e0853d] hover:to-orange-600 text-white p-3.5 rounded-2xl shadow-md transition-all flex items-center justify-between group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Heart size={18} fill="currentColor" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">
                    Seja um Mantenedor Mensal
                  </span>
                  <span className="text-[11px] text-white/95 font-medium">
                    Apoiar com R$ {isCustom ? (customAmount || '50') : selectedAmount}/mês
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
              * Mantenedores mensais cobrem os custos fixos dos projetos que zeram todo mês.
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO 
        title={`${currentCampaign.title} | Faça sua Doação - YAH Hope`}
        description={currentCampaign.description || "Doe para as ações humanitárias da YAH Hope. Sua contribuição combate a desnutrição infantil e financia projetos sociais."}
        keywords="doação humanitária, doar para ONG, combate à desnutrição, doação Moçambique, apadrinhar criança YAH Hope"
        canonical={`https://yahhope.org/campanha?id=${currentCampaign.id}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "DonateAction",
          "name": currentCampaign.title,
          "description": currentCampaign.description || "Contribua com a campanha solidária da YAH Hope.",
          "recipient": {
            "@type": "NGO",
            "name": "YAH Hope",
            "url": "https://yahhope.org"
          }
        }}
      />

      {/* Hero Section */}
      <div 
        className="w-full pt-32 pb-48 px-4 relative overflow-hidden flex items-end justify-center min-h-[500px]"
        style={{
          backgroundImage: `url('https://static.wixstatic.com/media/bd919d_bed3073991f74b9ebe78f14e8b11c13c~mv2.jpg/v1/fill/w_3000,h_1175,fp_0.50_0.49,q_90,enc_avif,quality_auto/IMG_6252.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/25" />
        <h1 
          className="relative z-10 text-white font-black uppercase tracking-[0.1em] translate-y-8 text-center" 
          style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 8rem)',
            transform: 'scaleX(1.08)',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)'
          }}
        >
          {availableCampaigns.length > 1 ? 'Participe' : (currentCampaign.type === 'specific' ? currentCampaign.title : 'Participe')}
        </h1>
      </div>

      {/* Main Content: Régua Global + 2 Colunas */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20">

        {/* 1. RÉGUA GLOBAL DE ARRECADAÇÃO POR ESTÁGIOS */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 mb-8 relative overflow-hidden ring-1 ring-slate-900/5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200/60 shadow-xs">
                <Flame size={14} className="text-emerald-600 animate-pulse" />
                <span>Régua Unificada de Arrecadação</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Jornada de Estágios de Transformação
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1.5 max-w-2xl font-gotham-regular leading-relaxed">
                Cada campanha é um estágio sequencial na nossa régua geral de impacto. As doações únicas acumulam sequencialmente, desbloqueando cada fase do projeto!
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/70 self-start lg:self-auto shadow-inner">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Geral Arrecadado
                </span>
                <span className="text-xl md:text-2xl font-black text-emerald-600">
                  R$ {totalRulerRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400 block font-medium">
                  de R$ {totalRulerGoal.toLocaleString('pt-BR')} ({rulerOverallPercentage}%)
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center font-black text-sm shrink-0 shadow-md shadow-emerald-500/25">
                <span>{rulerOverallPercentage}%</span>
                <span className="text-[9px] font-bold uppercase text-white/80">concluído</span>
              </div>
            </div>
          </div>

          {/* Barra Contínua Global com Efeito Shimmer */}
          <div className="relative pt-2 pb-6">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
              <span className="flex items-center gap-1 text-slate-700">
                <Layers size={13} className="text-emerald-600" />
                Progresso Geral na Régua
              </span>
              <span className="text-emerald-700">
                {currentActiveStage ? `Estágio ${currentActiveStage.stageNumber} em andamento` : 'Régua Concluída'}
              </span>
            </div>

            <div className="h-5 bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-200/80 relative">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-[#F49853] rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${rulerOverallPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>

            {/* Grid dos Estágios como botões de navegação rápida na régua */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stagesData.map((stage) => {
                const isSelected = stage.campaign.id === currentCampaign.id;
                return (
                  <button
                    key={stage.campaign.id}
                    type="button"
                    onClick={() => handleSelectCampaign(stage.campaign.id)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20"
                        : "border-slate-100 bg-slate-50/70 hover:bg-slate-100/80"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                        stage.isReached 
                          ? "bg-emerald-100 text-emerald-800" 
                          : stage.isCurrent 
                            ? "bg-amber-100 text-amber-800 animate-pulse" 
                            : "bg-slate-200 text-slate-600"
                      )}>
                        Estágio {stage.stageNumber}
                      </span>
                      {stage.isReached ? (
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      ) : stage.isCurrent ? (
                        <span className="text-[10px] font-black text-amber-600 uppercase">Ativo 🔥</span>
                      ) : (
                        <Lock size={12} className="text-slate-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      {stage.campaign.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-medium">
                      <span>Meta: R$ {stage.campaign.target_amount.toLocaleString('pt-BR')}</span>
                      <span className="font-bold text-emerald-600">{stage.stageProgress}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. GRID PRINCIPAL: ESTÁGIOS DETALHADOS (ESQUERDA) + FORMULÁRIO DE APOIO (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coluna Esquerda (lg:col-span-7): Estágios da Régua */}
          <div className="lg:col-span-7 space-y-6">
            {stagesData.map((stage) => {
              const camp = stage.campaign;
              const isSelected = camp.id === currentCampaign.id;
              const campStats = stage.campStats;

              if (isSelected) {
                return (
                  <div 
                    key={camp.id}
                    id={`campaign-card-${camp.id}`}
                    onClick={() => handleSelectCampaign(camp.id)}
                    className="bg-white rounded-3xl shadow-xl border-2 border-emerald-500 ring-4 ring-emerald-500/10 p-6 md:p-8 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Layers size={12} /> ESTÁGIO #{stage.stageNumber}
                        </span>

                        {stage.isReached ? (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={12} /> Estágio Conquistado
                          </span>
                        ) : stage.isCurrent ? (
                          <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                            <Flame size={12} /> Estágio em Andamento
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                            <Lock size={12} /> Próximo na Régua
                          </span>
                        )}

                        <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                          <Sparkles size={11} /> Selecionado
                        </span>
                      </div>

                      <span className="text-xs font-bold text-slate-400">
                        Faixa: R$ {stage.prevTarget.toLocaleString('pt-BR')} - R$ {stage.threshold.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                      {camp.title}
                    </h2>

                    {camp.description && (
                      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        {camp.description}
                      </p>
                    )}

                    {/* Régua de Arrecadação do Estágio */}
                    <div className="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-100">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Progresso deste Estágio
                          </p>
                          <p className="text-3xl md:text-4xl font-black text-emerald-600">
                            {stage.stageProgress}%
                          </p>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">
                            R$ {campStats.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acumulados
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Meta do Estágio
                          </p>
                          <p className="text-xl md:text-2xl font-black text-slate-900">
                            R$ {campStats.targetAmount.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progresso do Estágio */}
                      <div className="relative pt-6 pb-2">
                        <div className="h-6 bg-slate-200/80 rounded-full overflow-hidden relative z-10 shadow-inner ring-1 ring-slate-300/60">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${stage.stageProgress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
                          </div>
                        </div>

                        {/* Marcos do Estágio */}
                        {camp.milestones?.map((m) => {
                          const percent = Math.min((m.target_amount / campStats.targetAmount) * 100, 100);
                          const isReached = campStats.currentAmount >= m.target_amount;
                          return (
                            <div 
                              key={m.id} 
                              className="absolute top-0 flex flex-col items-center -ml-3.5"
                              style={{ left: `${percent}%` }}
                            >
                              <div className={cn(
                                "w-7 h-7 rounded-full border-4 border-white shadow-md flex items-center justify-center z-20 relative transition-transform hover:scale-125",
                                isReached ? "bg-emerald-500 text-white" : "bg-slate-300 text-transparent"
                              )}>
                                {isReached && <CheckCircle2 size={13} />}
                              </div>
                              <div className="absolute top-12 w-24 text-center">
                                <p className={cn("text-[10px] font-black uppercase tracking-tight", isReached ? "text-emerald-700" : "text-slate-400")}>
                                  R$ {m.target_amount >= 1000 ? `${m.target_amount / 1000}k` : m.target_amount}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Sub-marcos se existirem */}
                      {camp.milestones && camp.milestones.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-emerald-100/80 space-y-3">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Fases internas deste estágio:
                          </h4>
                          <div className="space-y-2">
                            {camp.milestones.map((m, idx) => {
                              const isReached = campStats.currentAmount >= m.target_amount;
                              return (
                                <div key={m.id} className="flex items-start gap-2.5 text-xs">
                                  <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] mt-0.5",
                                    isReached ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                  )}>
                                    {isReached ? <CheckCircle2 size={12} /> : idx + 1}
                                  </div>
                                  <div>
                                    <span className={cn("font-bold", isReached ? "text-emerald-950 font-black" : "text-slate-700")}>
                                      {m.title}
                                    </span>
                                    <span className="text-slate-400 font-semibold ml-1.5">
                                      (R$ {m.target_amount.toLocaleString('pt-BR')})
                                    </span>
                                    {m.description && <p className="text-[11px] text-slate-500 mt-0.5">{m.description}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Card Não Selecionado
              return (
                <div 
                  key={camp.id}
                  id={`campaign-card-${camp.id}`}
                  onClick={() => handleSelectCampaign(camp.id)}
                  className="bg-white rounded-3xl shadow-sm hover:shadow-xl border-2 border-slate-200/80 hover:border-emerald-300 transition-all duration-300 p-6 md:p-7 cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Layers size={12} /> ESTÁGIO #{stage.stageNumber}
                      </span>

                      {stage.isReached ? (
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-100">
                          <CheckCircle2 size={12} /> Concluído
                        </span>
                      ) : stage.isCurrent ? (
                        <span className="bg-amber-50 text-amber-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 border border-amber-100">
                          <Flame size={12} /> Em Andamento
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 border border-slate-100">
                          <Lock size={12} /> Próximo
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCampaign(camp.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 group-hover:bg-emerald-600 text-slate-700 group-hover:text-white font-bold text-xs uppercase tracking-wider transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Apoiar este estágio</span>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                    {camp.title}
                  </h3>

                  {camp.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {camp.description}
                    </p>
                  )}

                  {/* Régua Compacta do Estágio */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 group-hover:border-emerald-100 transition-colors">
                    <div className="flex justify-between items-center mb-2.5 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-lg text-emerald-600">{stage.stageProgress}%</span>
                        <span className="text-slate-500 font-bold">
                          R$ {campStats.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} arrecadados
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 font-medium">Meta do estágio: </span>
                        <span className="font-black text-slate-800">R$ {campStats.targetAmount.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="h-3.5 bg-slate-200/80 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${stage.stageProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coluna Direita (lg:col-span-5): Caixa Fixa "Faça sua contribuição" */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">Faça sua contribuição</h2>
              
              {/* Identificação Clara do Estágio Clicado */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                  <Flame size={14} className="text-emerald-600" />
                  Você está impulsionando o Estágio #{currentStageInfo.stageNumber}:
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-snug">
                  {currentCampaign.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {currentCampaign.description 
                    ? (currentCampaign.description.length > 90 ? `${currentCampaign.description.substring(0, 90)}...` : currentCampaign.description)
                    : 'Sua doação única avança a régua geral e financia este estágio.'}
                </p>
              </div>

              {renderDonationForm(currentCampaign)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
