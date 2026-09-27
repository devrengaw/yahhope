import React, { useState, useMemo } from 'react';
import { Heart, Target, ChevronRight, CheckCircle2, TrendingUp, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { useFundraising } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';

const QUOTAS = [
  { amount: 50, label: 'Alimenta uma criança', icon: Heart },
  { amount: 120, label: 'Apadrinhamento mensal', icon: Target },
  { amount: 300, label: 'Cesta básica + Suplementos', icon: TrendingUp },
];

export function Campaign() {
  const [searchParams] = useSearchParams();
  const urlCampaignId = searchParams.get('id') || searchParams.get('campaign');

  const { 
    campaigns, 
    activeCampaign, 
    campaign: defaultCamp, 
    createDonation, 
    currentMonthName,
    calculateCampaignProgress 
  } = useFundraising();

  // Seleciona a campanha com base na URL ou na ativa
  const currentCampaign = useMemo(() => {
    if (urlCampaignId) {
      const found = campaigns.find(c => c.id === urlCampaignId);
      if (found) return found;
    }
    return activeCampaign || defaultCamp;
  }, [urlCampaignId, campaigns, activeCampaign, defaultCamp]);

  const stats = useMemo(() => {
    return calculateCampaignProgress(currentCampaign);
  }, [calculateCampaignProgress, currentCampaign]);

  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isMonthly, setIsMonthly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      if (paymentMethod === 'pix') {
        createDonation({
          campaign_id: currentCampaign.id,
          donor_name: name,
          donor_email: email,
          amount: finalAmount,
          payment_method: paymentMethod
        });

        setTimeout(() => {
          setIsLoading(false);
          setIsSubmitted(true);
        }, 1500);
      } else {
        // Pagamento por Cartão (Stripe)
        if (!import.meta.env.VITE_SUPABASE_URL) {
          setTimeout(() => {
            setIsLoading(false);
            alert('Integração com Cartão de Crédito (Stripe) em modo de demonstração.\nA doação será registrada como pendente.');
            createDonation({
              campaign_id: currentCampaign.id,
              donor_name: name,
              donor_email: email,
              amount: finalAmount,
              payment_method: paymentMethod
            });
            setIsSubmitted(true);
          }, 1500);
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
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
            isMonthly,
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
          alert('Erro ao iniciar o pagamento. Tente via PIX ou verifique a conexão.');
          setIsLoading(false);
        }
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

  // Lista outras campanhas caso haja mais de uma
  const otherCampaigns = campaigns.filter(c => c.id !== currentCampaign.id);

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
          {currentCampaign.type === 'specific' ? currentCampaign.title : 'Participe'}
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-20">
        {/* Outras Campanhas em Andamento */}
        {otherCampaigns.length > 0 && (
          <div className="mb-4 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-md border border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 flex items-center gap-1 px-2">
              <Sparkles size={14} className="text-amber-500" /> Outras Campanhas:
            </span>
            {otherCampaigns.map(c => (
              <Link
                key={c.id}
                to={`/campanha?id=${c.id}`}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold transition-colors flex items-center gap-1.5"
              >
                {c.type === 'specific' ? <Target size={12} className="text-purple-500" /> : <Calendar size={12} className="text-blue-500" />}
                {c.title}
              </Link>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side: Progress and Milestones */}
          <div className="p-8 md:p-12 md:w-1/2 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              {stats.isMonthly ? (
                <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Calendar size={12} /> Meta do Mês • {currentMonthName}
                </span>
              ) : (
                <span className="bg-purple-100 text-purple-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Target size={12} /> Campanha Especial
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">{currentCampaign.title}</h2>
            {currentCampaign.description && (
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                {currentCampaign.description}
              </p>
            )}
            
            <div className="mb-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {stats.isMonthly ? 'Arrecadado no Mês' : 'Total Arrecadado'}
                  </p>
                  <p className="text-3xl font-black text-emerald-600">{stats.percentage}%</p>
                  <p className="text-xs text-slate-400 font-medium">
                    R$ {stats.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                  <p className="text-xl font-black text-slate-900">R$ {stats.targetAmount.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Progress Bar with Milestones */}
              <div className="relative pt-6">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative z-10">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${stats.percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>

                {/* Milestones Markers */}
                {currentCampaign.milestones?.map((m) => {
                  const percent = Math.min((m.target_amount / stats.targetAmount) * 100, 100);
                  const isReached = stats.currentAmount >= m.target_amount;
                  return (
                    <div 
                      key={m.id} 
                      className="absolute top-0 flex flex-col items-center -ml-3"
                      style={{ left: `${percent}%` }}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-20 relative transition-transform hover:scale-125",
                        isReached ? "bg-emerald-500" : "bg-slate-300"
                      )}>
                        {isReached && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div className="absolute top-10 w-24 text-center">
                        <p className={cn("text-[10px] font-black uppercase tracking-tight", isReached ? "text-emerald-600" : "text-slate-400")}>
                          R$ {m.target_amount >= 1000 ? `${m.target_amount / 1000}k` : m.target_amount}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {currentCampaign.milestones && currentCampaign.milestones.length > 0 && (
              <div className="mt-16 space-y-5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  O que cada estágio garante?
                </h3>
                {currentCampaign.milestones.map((m, idx) => {
                  const isReached = stats.currentAmount >= m.target_amount;
                  return (
                    <div key={m.id} className="flex gap-3">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-xs",
                        isReached ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                      )}>
                        {isReached ? <CheckCircle2 size={14} /> : idx + 1}
                      </div>
                      <div>
                        <h4 className={cn("text-sm font-bold", isReached ? "text-emerald-950 font-black" : "text-slate-700")}>
                          {m.title}
                          <span className="text-xs ml-2 text-slate-400 font-semibold">(R$ {m.target_amount.toLocaleString('pt-BR')})</span>
                        </h4>
                        {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Donation Form */}
          <div className="p-8 md:p-12 md:w-1/2 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 mb-6">Faça sua contribuição</h2>
            
            <div className="space-y-3 mb-6">
              {QUOTAS.map((q) => (
                <button
                  key={q.amount}
                  type="button"
                  onClick={() => { setIsCustom(false); setSelectedAmount(q.amount); }}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all",
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
                  "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all",
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-medium"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-medium"
                  placeholder="seu@email.com"
                />
              </div>

              {(currentCampaign.accept_pix !== false || currentCampaign.accept_card !== false) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Forma de Pagamento</label>
                  <div className="flex gap-3">
                    {currentCampaign.accept_pix !== false && (
                      <label className="flex-1 cursor-pointer">
                        <input 
                          type="radio" 
                          name="payment" 
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
                    {currentCampaign.accept_card !== false && (
                      <label className="flex-1 cursor-pointer">
                        <input 
                          type="radio" 
                          name="payment" 
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

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsMonthly(!isMonthly)}
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors",
                    isMonthly ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                  )}
                >
                  {isMonthly && <CheckCircle2 size={14} />}
                </button>
                <div className="text-xs">
                  <span className="font-bold text-slate-700">Tornar essa doação mensal recorrente</span>
                  <p className="text-slate-400 text-[11px]">Contribua todos os meses com essa causa</p>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-slate-900/10 cursor-pointer"
              >
                {isLoading ? (
                  <span className="animate-pulse">Processando...</span>
                ) : (
                  <>
                    Doar R$ {isCustom ? (customAmount || '0') : selectedAmount} {isMonthly && '/ mês'}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
