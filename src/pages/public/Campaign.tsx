import React, { useState } from 'react';
import { Heart, Target, ChevronRight, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { useFundraising } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const QUOTAS = [
  { amount: 50, label: 'Alimenta uma criança', icon: Heart },
  { amount: 120, label: 'Apadrinhamento mensal', icon: Target },
  { amount: 300, label: 'Cesta básica + Suplementos', icon: TrendingUp },
];

export function Campaign() {
  const { campaign, createDonation } = useFundraising();
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isMonthly, setIsMonthly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const progressPercentage = Math.min((campaign.current_amount / campaign.target_amount) * 100, 100);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = isCustom ? parseFloat(customAmount) : selectedAmount;
    if (!finalAmount || isNaN(finalAmount)) return;

    setIsLoading(true);

    try {
      if (paymentMethod === 'pix') {
        // Registrar a doação no contexto (que vai para o Admin Finanças aprovar)
        createDonation({
          donor_name: name,
          donor_email: email,
          amount: finalAmount,
          payment_method: paymentMethod
        });

        // Simular um tempo de processamento para parecer real
        setTimeout(() => {
          setIsLoading(false);
          setIsSubmitted(true);
        }, 1500);
      } else {
        // Pagamento por Cartão (via Stripe + Supabase Edge Functions)
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount: finalAmount,
            isMonthly,
            donorName: name,
            donorEmail: email
          })
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error('Error starting checkout:', data);
          alert('Erro ao iniciar o pagamento. Verifique se o servidor backend está online.');
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert('Erro ao processar a doação. Tente novamente.');
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
            Seu pedido foi registrado. Se escolheu PIX, o administrador confirmará o pagamento em breve para atualizar nossa régua de arrecadação.
          </p>
          <Link to="/" className="inline-block bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div 
        className="w-full pt-32 pb-48 px-4 relative overflow-hidden flex items-end justify-center min-h-[500px]"
        style={{
          backgroundImage: `url('https://static.wixstatic.com/media/bd919d_bed3073991f74b9ebe78f14e8b11c13c~mv2.jpg/v1/fill/w_3000,h_1175,fp_0.50_0.49,q_90,enc_avif,quality_auto/IMG_6252.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <h1 
          className="relative z-10 text-white font-black uppercase tracking-[0.1em] translate-y-8" 
          style={{ 
            fontSize: 'clamp(3rem, 10vw, 9rem)',
            transform: 'scaleX(1.1)',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          Envolva-se
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side: Progress and Milestones */}
          <div className="p-8 md:p-12 md:w-1/2 border-b md:border-b-0 md:border-r border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-8">Nossa Meta</h2>
            
            <div className="mb-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Arrecadado</p>
                  <p className="text-3xl font-black text-emerald-600">R$ {campaign.current_amount.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                  <p className="text-xl font-black text-slate-900">R$ {campaign.target_amount.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Progress Bar with Milestones */}
              <div className="relative pt-6">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative z-10">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>

                {/* Milestones Markers */}
                {campaign.milestones.map((m) => {
                  const percent = (m.target_amount / campaign.target_amount) * 100;
                  const isReached = campaign.current_amount >= m.target_amount;
                  return (
                    <div 
                      key={m.id} 
                      className="absolute top-0 flex flex-col items-center -ml-3"
                      style={{ left: `${percent}%` }}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-20 relative",
                        isReached ? "bg-emerald-500" : "bg-slate-300"
                      )}>
                        {isReached && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div className="absolute top-10 w-24 text-center">
                        <p className={cn("text-[10px] font-black uppercase tracking-tight", isReached ? "text-emerald-600" : "text-slate-400")}>
                          R$ {m.target_amount/1000}k
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {campaign.milestones && campaign.milestones.length > 0 && (
              <div className="mt-16 space-y-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">O que cada estágio garante?</h3>
                {campaign.milestones.map((m, idx) => (
                  <div key={m.id} className="flex gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm",
                      campaign.current_amount >= m.target_amount ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className={cn("font-bold", campaign.current_amount >= m.target_amount ? "text-emerald-900" : "text-slate-700")}>
                        {m.title}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Donation Form */}
          <div className="p-8 md:p-12 md:w-1/2 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 mb-6">Faça sua contribuição</h2>
            
            <div className="space-y-4 mb-8">
              {QUOTAS.map((q) => (
                <button
                  key={q.amount}
                  type="button"
                  onClick={() => { setIsCustom(false); setSelectedAmount(q.amount); }}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                    !isCustom && selectedAmount === q.amount 
                      ? "border-emerald-500 bg-emerald-50/50" 
                      : "border-slate-200 bg-white hover:border-emerald-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      !isCustom && selectedAmount === q.amount ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      <q.icon size={20} />
                    </div>
                    <div className="text-left w-full">
                      <p className={cn("font-black text-xl", !isCustom && selectedAmount === q.amount ? "text-emerald-900" : "text-slate-900")}>
                        R$ {q.amount}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
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
                  "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                  isCustom 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-slate-200 bg-white hover:border-emerald-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isCustom ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    <DollarSign size={20} />
                  </div>
                  <div className="text-left w-full">
                    <p className={cn("font-black text-xl", isCustom ? "text-emerald-900" : "text-slate-900")}>
                      Outro Valor
                    </p>
                    {isCustom && (
                      <div className="mt-2 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                        <input 
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-lg font-black"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  isCustom ? "border-emerald-500" : "border-slate-300"
                )}>
                  {isCustom && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                </div>
              </button>
            </div>

            <form onSubmit={handleDonate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Forma de Pagamento</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="pix" 
                      checked={paymentMethod === 'pix'} 
                      onChange={() => setPaymentMethod('pix')}
                      className="peer sr-only" 
                    />
                    <div className="p-3 text-center border border-slate-200 rounded-xl font-bold text-slate-600 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 transition-colors">
                      PIX ou Boleto
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="credit_card" 
                      checked={paymentMethod === 'credit_card'} 
                      onChange={() => setPaymentMethod('credit_card')}
                      className="peer sr-only" 
                    />
                    <div className="p-3 text-center border border-slate-200 rounded-xl font-bold text-slate-600 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 transition-colors">
                      Cartão de Crédito
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMonthly(!isMonthly)}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center border-2 transition-colors",
                    isMonthly ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                  )}
                >
                  {isMonthly && <CheckCircle2 size={16} />}
                </button>
                <div className="text-sm">
                  <span className="font-bold text-slate-700">Tornar essa doação mensal</span>
                  <p className="text-slate-500 text-xs mt-0.5">Ajude a manter nosso trabalho contínuo</p>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-6 shadow-xl shadow-slate-900/20"
              >
                {isLoading ? (
                  <span className="animate-pulse">Processando...</span>
                ) : (
                  <>
                    Doar R$ {isCustom ? (customAmount || '0') : selectedAmount} {isMonthly && '/ mês'}
                    <ChevronRight size={20} />
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
