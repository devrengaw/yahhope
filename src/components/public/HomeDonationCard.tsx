import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Users, 
  CreditCard, 
  QrCode,
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Loader2, 
  Target, 
  TrendingUp,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sponsorshipService, SponsorshipMetrics } from '../../services/sponsorshipService';
import { submitCampaignLead, recordCampaignClick, getClientLocation, isHotsiteRoute } from '../../services/campaignTrackingService';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

interface HomeDonationCardProps {
  onClose?: () => void;
  isModal?: boolean;
  className?: string;
  initialTab?: 'sponsorship' | 'general';
  initialQuotas?: number;
}

export function HomeDonationCard({
  onClose,
  isModal = false,
  className = '',
  initialTab = 'sponsorship',
  initialQuotas
}: HomeDonationCardProps) {
  const { user } = useAuth();
  const { tr } = useLanguage();

  // Estados do Card de Doação / Apoio (Idêntico à Página Inicial)
  const [headerTab, setHeaderTab] = useState<'sponsorship' | 'general'>(initialTab);
  const [isSingleDonation, setIsSingleDonation] = useState(false);
  const [sponsorshipQuotas, setSponsorshipQuotas] = useState<number>(initialQuotas || 1);
  const [sponsorshipPayMethod, setSponsorshipPayMethod] = useState<'card' | 'pix'>('card');
  const [sponsorshipPixMonths, setSponsorshipPixMonths] = useState<3 | 6 | 12>(6);

  // Sincroniza aba e cotas quando acionado externamente por botões da página
  useEffect(() => {
    setHeaderTab(initialTab);
    if (initialTab === 'general') {
      setIsSingleDonation(false);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialQuotas && initialQuotas >= 1 && initialQuotas <= 4) {
      setSponsorshipQuotas(initialQuotas);
    }
  }, [initialQuotas]);
  const [sponsorshipMetrics, setSponsorshipMetrics] = useState<SponsorshipMetrics | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Campos de contato do doador
  const [donorName, setDonorName] = useState(user?.name || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [donorWhatsapp, setDonorWhatsapp] = useState(user?.phone || '');
  const [donorAgeRange, setDonorAgeRange] = useState<string>('25-34');
  const [donorCity, setDonorCity] = useState<string>('');
  const [donorState, setDonorState] = useState<string>('');
  const [donorFormError, setDonorFormError] = useState('');

  // Pré-carrega localização aproximada para enriquecer o retorno do Hotsite
  useEffect(() => {
    getClientLocation()
      .then(geo => {
        if (geo.city) setDonorCity(prev => prev || geo.city);
        if (geo.state) setDonorState(prev => prev || geo.state || 'SP');
      })
      .catch(() => {});
  }, []);

  // Sincroniza dados do usuário autenticado
  useEffect(() => {
    if (user) {
      if (user.name && !donorName) setDonorName(user.name);
      if (user.email && !donorEmail) setDonorEmail(user.email);
      if (user.phone && !donorWhatsapp) setDonorWhatsapp(user.phone);
    }
  }, [user]);

  // Carrega métricas reais de apadrinhamento
  useEffect(() => {
    sponsorshipService.getMetrics()
      .then(m => setSponsorshipMetrics(m))
      .catch(err => console.error('Erro ao carregar métricas:', err));
  }, []);

  // Formata o número do WhatsApp com máscara brasileira (XX) XXXXX-XXXX
  const handleWhatsappChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    setDonorWhatsapp(formatted);
  };

  const quotaCost = sponsorshipMetrics?.quotaCost || 90;
  const sponsorshipMonthlyTotal = sponsorshipQuotas * quotaCost;
  const sponsorshipTotal = sponsorshipPayMethod === 'pix'
    ? sponsorshipMonthlyTotal * sponsorshipPixMonths
    : sponsorshipMonthlyTotal;
  const currentTotalAmount = headerTab === 'sponsorship'
    ? sponsorshipTotal
    : (isCustom && customAmount ? parseFloat(customAmount) : selectedAmount);

  // Checkout via Stripe com redirecionamento de fallback
  const handleStripeCheckout = async (e?: React.FormEvent, overrideAmount?: number) => {
    if (e) e.preventDefault();
    setDonorFormError('');

    const finalDonorName = donorName.trim() || user?.name || '';
    const finalDonorEmail = donorEmail.trim() || user?.email || '';
    const finalDonorWhatsapp = donorWhatsapp.trim() || user?.phone || '';

    // Apenas exige preenchimento se o usuário NÃO estiver logado
    if (!user) {
      if (!finalDonorName) {
        setDonorFormError(tr('Por favor, informe seu nome completo.', 'Please enter your full name.'));
        return;
      }
      if (!finalDonorEmail || !finalDonorEmail.includes('@')) {
        setDonorFormError(tr('Por favor, informe um e-mail válido.', 'Please enter a valid email address.'));
        return;
      }
      if (!finalDonorWhatsapp || finalDonorWhatsapp.replace(/\D/g, '').length < 10) {
        setDonorFormError(tr('Por favor, informe seu WhatsApp com DDD.', 'Please enter your WhatsApp / phone number.'));
        return;
      }
    }
    
    let finalVal = overrideAmount !== undefined ? overrideAmount : currentTotalAmount;

    if (!finalVal || isNaN(finalVal) || finalVal <= 0) {
      finalVal = headerTab === 'sponsorship' ? quotaCost : 100;
    }

    setIsCheckingOut(true);

    try {
      const isSponsorshipPix = headerTab === 'sponsorship' && sponsorshipPayMethod === 'pix';
      const isMonthly = headerTab === 'sponsorship' ? !isSponsorshipPix : !isSingleDonation;
      const interestType = headerTab === 'sponsorship' || isMonthly ? 'sponsor' : 'donor';
      const detailMessage = headerTab === 'sponsorship'
        ? (isSponsorshipPix
          ? `Apadrinhamento PIX (${sponsorshipPixMonths} meses): ${sponsorshipQuotas} ${sponsorshipQuotas === 1 ? 'criança' : 'crianças'} (R$ ${finalVal})`
          : `Apadrinhamento: ${sponsorshipQuotas} ${sponsorshipQuotas === 1 ? 'criança' : 'crianças'} (R$ ${finalVal}/mês)`)
        : isMonthly
          ? `Mantenedor Mensal: R$ ${finalVal}/mês`
          : `Doação Pontual: R$ ${finalVal}`;

      // Registra imediatamente o lead/retorno do formulário na tabela campaign_leads e no cache local
      if (finalDonorName || finalDonorEmail || finalDonorWhatsapp) {
        await Promise.race([
          submitCampaignLead({
            name: finalDonorName || 'Apoiador YAH Hope',
            email: finalDonorEmail,
            phone: finalDonorWhatsapp,
            age_range: donorAgeRange || '25-34',
            city: donorCity || 'São Paulo',
            state: donorState || 'SP',
            country: 'Brasil',
            interest_type: interestType,
            message: detailMessage,
            source: isHotsiteRoute() ? 'campanha.yahhope.com' : 'site_yahhope'
          }),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);
      }

      const redirectFallback = headerTab === 'sponsorship'
        ? `/mantenedor?mode=sponsorship&method=${sponsorshipPayMethod}&months=${isSponsorshipPix ? sponsorshipPixMonths : 1}&quotas=${sponsorshipQuotas}&amount=${finalVal}&name=${encodeURIComponent(finalDonorName)}&email=${encodeURIComponent(finalDonorEmail)}&whatsapp=${encodeURIComponent(finalDonorWhatsapp)}`
        : isMonthly
          ? `/mantenedor?mode=general&amount=${finalVal}&name=${encodeURIComponent(finalDonorName)}&email=${encodeURIComponent(finalDonorEmail)}&whatsapp=${encodeURIComponent(finalDonorWhatsapp)}`
          : `/campanha?amount=${finalVal}&isMonthly=false&method=card&name=${encodeURIComponent(finalDonorName)}&email=${encodeURIComponent(finalDonorEmail)}&whatsapp=${encodeURIComponent(finalDonorWhatsapp)}`;

      // Se for Apadrinhamento via PIX (pacote de 3, 6 ou 12 meses), direciona para a finalização PIX em /mantenedor
      if (isSponsorshipPix) {
        if (onClose) onClose();
        window.location.href = redirectFallback;
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl) {
        if (onClose) onClose();
        window.location.href = redirectFallback;
        return;
      }

      const baseUrl = supabaseUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount: finalVal,
          isMonthly,
          paymentMethod: isSponsorshipPix ? 'pix' : 'card',
          planMonths: isSponsorshipPix ? sponsorshipPixMonths : 1,
          type: headerTab === 'sponsorship' ? 'sponsorship' : 'donation',
          quotasCount: sponsorshipQuotas,
          donorName: finalDonorName,
          donorEmail: finalDonorEmail,
          donorPhone: finalDonorWhatsapp,
          donorWhatsapp: finalDonorWhatsapp,
          successUrl: headerTab === 'sponsorship' || isMonthly
            ? `${window.location.origin}/mantenedor?status=success&mode=${headerTab}&months=${isSponsorshipPix ? sponsorshipPixMonths : 1}&quotas=${sponsorshipQuotas}&amount=${finalVal}&name=${encodeURIComponent(finalDonorName)}&email=${encodeURIComponent(finalDonorEmail)}`
            : `${window.location.origin}/campanha?status=success&amount=${finalVal}&name=${encodeURIComponent(finalDonorName)}&email=${encodeURIComponent(finalDonorEmail)}`,
          cancelUrl: `${window.location.origin}${window.location.pathname}?status=cancel`
        })
      });

      const data = await response.json();

      if (onClose) onClose();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.warn('Fallback redirection:', data);
        window.location.href = redirectFallback;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      if (onClose) onClose();
      const isSponsorshipPix = headerTab === 'sponsorship' && sponsorshipPayMethod === 'pix';
      const isMonthly = headerTab === 'sponsorship' ? !isSponsorshipPix : !isSingleDonation;
      const redirectFallback = headerTab === 'sponsorship'
        ? `/mantenedor?mode=sponsorship&method=${sponsorshipPayMethod}&months=${isSponsorshipPix ? sponsorshipPixMonths : 1}&quotas=${sponsorshipQuotas}&amount=${finalVal}&name=${encodeURIComponent(donorName)}&email=${encodeURIComponent(donorEmail)}&whatsapp=${encodeURIComponent(donorWhatsapp)}`
        : isMonthly
          ? `/mantenedor?mode=general&amount=${finalVal}&name=${encodeURIComponent(donorName)}&email=${encodeURIComponent(donorEmail)}&whatsapp=${encodeURIComponent(donorWhatsapp)}`
          : `/campanha?amount=${finalVal}&isMonthly=false&method=card&name=${encodeURIComponent(donorName)}&email=${encodeURIComponent(donorEmail)}&whatsapp=${encodeURIComponent(donorWhatsapp)}`;
      window.location.href = redirectFallback;
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className={cn(
      "bg-white text-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md border border-orange-100 relative",
      className
    )}>
      {/* Botão de Fechar quando aberto em modal */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label={tr('Fechar', 'Close')}
        >
          <X size={18} />
        </button>
      )}

      {/* Cabeçalho do Modal (se aplicável) */}
      {isModal && (
        <div className="mb-4 pr-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#F49853] text-[10px] font-gotham-bold uppercase tracking-wider mb-1.5">
            <Sparkles size={11} />
            <span>{tr('Apoio Humanitário YAH Hope', 'YAH Hope Humanitarian Support')}</span>
          </div>
          <h3 className="text-xl font-heading font-black text-slate-900 leading-tight">
            {tr('Faça a Diferença Agora', 'Make a Difference Now')}
          </h3>
          <p className="text-xs text-slate-500 font-gotham-regular mt-0.5">
            {tr('Nutrição infantil, apadrinhamento e dignidade em Moçambique.', 'Child nutrition, sponsorship, and dignity in Mozambique.')}
          </p>
        </div>
      )}
      
      {/* 2 Abas Principais: Apadrinhamento e Mantenedor */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-3 text-xs font-gotham-bold">
        <button
          type="button"
          onClick={() => {
            setHeaderTab('sponsorship');
            setIsCustom(false);
          }}
          className={cn(
            "py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer",
            headerTab === 'sponsorship'
              ? "bg-[#F49853] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Heart size={13} fill={headerTab === 'sponsorship' ? "currentColor" : "none"} />
          <span>{tr('Apadrinhamento', 'Sponsorship')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setHeaderTab('general');
            setIsCustom(false);
            setSelectedAmount(100);
          }}
          className={cn(
            "py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer",
            headerTab === 'general'
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Users size={13} />
          <span>{tr('Mantenedor', 'Supporter')}</span>
        </button>
      </div>

      <p className="text-center text-[11px] text-slate-500 mb-3 font-gotham-regular min-h-[1.25rem] flex items-center justify-center">
        {headerTab === 'sponsorship' ? (
          <span>{tr(`Cotas de R$ ${quotaCost}/mês • `, `Shares of R$ ${quotaCost}/mo • `)}<strong className="font-gotham-bold text-[#F49853]">{tr('Alocação justa e perfil por e-mail', 'Fair allocation & profile via email')}</strong></span>
        ) : isSingleDonation ? (
          <span>{tr('Doação pontual sem mensalidade que impulsiona a ', 'One-time donation with no subscription that boosts the ')}<strong className="font-gotham-bold text-[#F49853]">{tr('régua de arrecadação', 'fundraising tracker')}</strong></span>
        ) : (
          <span>{tr('Recorrência mensal que sustenta o ', 'Monthly recurring support that sustains the ')}<strong className="font-gotham-bold text-slate-900">{tr('custo global do projeto', 'overall project cost')}</strong></span>
        )}
      </p>

      {/* CONTEÚDO DA ABA 1: APADRINHAMENTO DE CRIANÇA (COTAS) */}
      {headerTab === 'sponsorship' && (
        <div className="space-y-2.5 mb-3 animate-fade-in">
              <div className="text-[11px] font-gotham-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>{tr('Quantas crianças apadrinhar:', 'How many children to sponsor:')}</span>
                <span className="text-[#F49853]">{tr(`R$ ${quotaCost}/mês por cota`, `R$ ${quotaCost}/mo per share`)}</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((q) => {
                  const isSelected = sponsorshipQuotas === q;
                  const total = q * quotaCost;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSponsorshipQuotas(q)}
                      className={cn(
                        "py-2 px-1 rounded-xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer",
                        isSelected
                          ? "border-[#F49853] bg-orange-50 text-[#F49853] ring-1 ring-[#F49853] shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                      )}
                    >
                      <span className="text-[10px] font-gotham-bold uppercase leading-tight">
                        {q} {q === 1 ? tr('Criança', 'Child') : tr('Crianças', 'Children')}
                      </span>
                      <span className="text-xs font-black text-slate-900 mt-0.5">
                        R$ {total}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Seletor de Forma de Pagamento do Apadrinhamento: Cartão Mensal vs Pacote PIX (3, 6 ou 12 meses) */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setSponsorshipPayMethod('card')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[11px] font-gotham-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                      sponsorshipPayMethod === 'card'
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <CreditCard size={11} />
                    <span>{tr('Cartão Mensal', 'Monthly Card')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSponsorshipPayMethod('pix')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[11px] font-gotham-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                      sponsorshipPayMethod === 'pix'
                        ? "bg-[#F49853] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <QrCode size={11} />
                    <span>{tr('PIX (3, 6 ou 12m)', 'PIX (3, 6 or 12m)')}</span>
                  </button>
                </div>

                {sponsorshipPayMethod === 'pix' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="text-[10px] font-gotham-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>{tr('Pacote de meses no PIX:', 'PIX month package:')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([3, 6, 12] as const).map((m) => {
                        const isPkgSelected = sponsorshipPixMonths === m;
                        const pkgTotal = sponsorshipQuotas * quotaCost * m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSponsorshipPixMonths(m)}
                            className={cn(
                              "py-1.5 px-1 rounded-xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer relative",
                              isPkgSelected
                                ? "border-[#F49853] bg-orange-50 text-[#F49853] ring-1 ring-[#F49853] shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                            )}
                          >
                            <span className="text-[10px] font-gotham-bold uppercase leading-tight">
                              {m} {tr('Meses', 'Months')}
                            </span>
                            <span className="text-xs font-black text-slate-900 mt-0.5">
                              R$ {pkgTotal}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 leading-snug flex items-center gap-2">
                <Sparkles size={14} className="text-[#F49853] shrink-0" />
                <span>
                  {sponsorshipPayMethod === 'pix'
                    ? tr(`Pacote de ${sponsorshipPixMonths} meses via PIX. O perfil do afilhado é enviado por e-mail.`, `${sponsorshipPixMonths}-month PIX package. Your sponsored child’s profile is sent by email.`)
                    : tr('Distribuição justa: o perfil do afilhado é enviado após a confirmação.', 'Fair distribution: your sponsored child’s profile is sent after confirmation.')}
                </span>
              </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: MANTENEDOR (COM BOTÃO DE DOAÇÃO PONTUAL) */}
      {headerTab === 'general' && (
        <div className="space-y-2.5 mb-3 animate-fade-in">
          
          {/* Botão Seletor: Recorrente Mensal vs Doação Pontual */}
          <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-200/80 mb-2">
            <button
              type="button"
              onClick={() => setIsSingleDonation(false)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-gotham-bold transition-all text-center cursor-pointer",
                !isSingleDonation
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tr('Mensal (Recorrente)', 'Monthly (Recurring)')}
            </button>
            <button
              type="button"
              onClick={() => setIsSingleDonation(true)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-gotham-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer",
                isSingleDonation
                  ? "bg-[#F49853] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CreditCard size={11} />
              <span>{tr('Doação Pontual', 'One-Time Gift')}</span>
            </button>
          </div>

          {/* Lista de Valores */}
          <div className="space-y-1.5">
            {[
              { amount: 50, label: isSingleDonation ? tr('Cesta Alimentar Emergencial', 'Emergency Food Basket') : tr('Nutrição Essencial • R$ 1,66/dia', 'Essential Nutrition • R$ 1.66/day'), icon: Heart },
              { amount: 100, label: isSingleDonation ? tr('Tratamento & Insumos Médicos', 'Medical Treatment & Supplies') : tr('Guardião da Vida • R$ 3,33/dia', 'Guardian of Life • R$ 3.33/day'), icon: Target },
              { amount: 200, label: isSingleDonation ? tr('Apoio Comunitário Intensivo', 'Intensive Community Support') : tr('Transformação Integral + Bolsas', 'Full Transformation + Scholarships'), icon: TrendingUp },
            ].map((plan) => {
              const isSelected = !isCustom && selectedAmount === plan.amount;
              const IconComp = plan.icon;
              return (
                <button
                  key={plan.amount}
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedAmount(plan.amount);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all cursor-pointer",
                    isSelected
                      ? isSingleDonation
                        ? "border-[#F49853] bg-orange-50/70 text-[#F49853] shadow-xs ring-1 ring-[#F49853]"
                        : "border-slate-900 bg-slate-50 text-slate-900 shadow-xs ring-1 ring-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      isSelected 
                        ? (isSingleDonation ? "bg-[#F49853] text-white" : "bg-slate-900 text-white")
                        : "bg-slate-100 text-slate-500"
                    )}>
                      <IconComp size={13} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-gotham-bold text-slate-900 block leading-tight">
                        R$ {plan.amount} {isSingleDonation ? tr('(Única)', '(One-time)') : tr('/mês', '/mo')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-gotham-regular">
                        {plan.label}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0",
                    isSelected 
                      ? (isSingleDonation ? "border-[#F49853]" : "border-slate-900")
                      : "border-slate-300"
                  )}>
                    {isSelected && (
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSingleDonation ? "bg-[#F49853]" : "bg-slate-900"
                      )} />
                    )}
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all cursor-pointer",
                isCustom
                  ? (isSingleDonation ? "border-[#F49853] bg-orange-50/70 text-[#F49853] ring-1 ring-[#F49853]" : "border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900")
                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  isCustom ? (isSingleDonation ? "bg-[#F49853] text-white" : "bg-slate-900 text-white") : "bg-slate-100 text-slate-500"
                )}>
                  <Sparkles size={13} />
                </div>
                <span className="text-xs font-gotham-bold text-slate-900">
                  {isSingleDonation ? tr('Outro Valor Pontual', 'Other One-Time Amount') : tr('Outro Valor Mensal', 'Other Monthly Amount')}
                </span>
              </div>
              <div className={cn(
                "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0",
                isCustom ? (isSingleDonation ? "border-[#F49853]" : "border-slate-900") : "border-slate-300"
              )}>
                {isCustom && (
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isSingleDonation ? "bg-[#F49853]" : "bg-slate-900"
                  )} />
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Custom Amount Input Field when isCustom is selected */}
      {isCustom && headerTab !== 'sponsorship' && (
        <div className="relative mb-3 animate-fade-in">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
            R$
          </span>
          <input 
            type="number"
            min="5"
            step="1"
            placeholder="0,00"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full pl-9 pr-12 py-2 rounded-xl border-2 border-[#F49853] focus:outline-hidden text-xs font-gotham-bold text-slate-800"
            autoFocus
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-gotham-bold text-[10px]">
            BRL
          </span>
        </div>
      )}

      {/* Dados do Doador: Nome, E-mail, WhatsApp */}
      <div className="mt-2.5 mb-3 pt-2.5 border-t border-slate-100 space-y-2">
        {user ? (
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between text-left">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-gotham-bold text-slate-800 truncate leading-tight">
                  {user.name || tr('Usuário Conectado', 'Connected User')}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-medium">
                  {user.email}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-gotham-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
              {tr('Logado ✓', 'Signed In ✓')}
            </span>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-gotham-bold text-slate-500 uppercase tracking-wider">
              {tr('Seus Dados para Identificação', 'Your Identification Details')}
            </p>

            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={tr('Nome completo', 'Full name')}
                value={donorName}
                onChange={(e) => {
                  setDonorName(e.target.value);
                  if (donorFormError) setDonorFormError('');
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F49853] focus:ring-1 focus:ring-[#F49853] text-xs font-gotham-regular text-slate-800 bg-slate-50/70 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder={tr('Seu melhor e-mail', 'Your best email')}
                value={donorEmail}
                onChange={(e) => {
                  setDonorEmail(e.target.value);
                  if (donorFormError) setDonorFormError('');
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F49853] focus:ring-1 focus:ring-[#F49853] text-xs font-gotham-regular text-slate-800 bg-slate-50/70 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder={tr('WhatsApp (DDD + Número)', 'WhatsApp / Phone')}
                value={donorWhatsapp}
                onChange={(e) => {
                  handleWhatsappChange(e.target.value);
                  if (donorFormError) setDonorFormError('');
                }}
                maxLength={15}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F49853] focus:ring-1 focus:ring-[#F49853] text-xs font-gotham-regular text-slate-800 bg-slate-50/70 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={donorAgeRange}
                onChange={(e) => setDonorAgeRange(e.target.value)}
                aria-label={tr('Faixa de idade', 'Age range')}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F49853] text-[11px] font-gotham-regular text-slate-700 bg-slate-50/70 focus:bg-white transition-all"
              >
                <option value="18-24">{tr('Idade: 18 a 24 anos', 'Age: 18–24')}</option>
                <option value="25-34">{tr('Idade: 25 a 34 anos', 'Age: 25–34')}</option>
                <option value="35-44">{tr('Idade: 35 a 44 anos', 'Age: 35–44')}</option>
                <option value="45-54">{tr('Idade: 45 a 54 anos', 'Age: 45–54')}</option>
                <option value="55+">{tr('Idade: 55+ anos', 'Age: 55+')}</option>
              </select>

              <input
                type="text"
                placeholder={tr('Sua Cidade', 'Your City')}
                value={donorCity}
                onChange={(e) => setDonorCity(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F49853] text-[11px] font-gotham-regular text-slate-800 bg-slate-50/70 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
          </>
        )}

        {donorFormError && (
          <p className="text-[10px] font-gotham-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 animate-fade-in">
            {donorFormError}
          </p>
        )}
      </div>

      {/* Botão de Finalização Dinâmico */}
      <button
        onClick={handleStripeCheckout}
        disabled={isCheckingOut}
        className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white py-3 rounded-2xl font-gotham-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-[#F49853]/30 flex items-center justify-center gap-2 group disabled:opacity-80 active:scale-[0.99] cursor-pointer"
      >
        {isCheckingOut ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>{tr('Conectando...', 'Connecting...')}</span>
          </>
        ) : headerTab === 'sponsorship' ? (
          <>
            <Heart size={15} fill="currentColor" />
            <span>
              {sponsorshipPayMethod === 'pix'
                ? tr(`APADRINHAR VIA PIX (${sponsorshipPixMonths} MESES • R$ ${sponsorshipTotal})`, `SPONSOR VIA PIX (${sponsorshipPixMonths} MONTHS • R$ ${sponsorshipTotal})`)
                : tr(`APADRINHAR (${sponsorshipQuotas} ${sponsorshipQuotas === 1 ? 'CRIANÇA' : 'CRIANÇAS'} • R$ ${sponsorshipTotal}/mês)`, `SPONSOR (${sponsorshipQuotas} ${sponsorshipQuotas === 1 ? 'CHILD' : 'CHILDREN'} • R$ ${sponsorshipTotal}/mo)`)}
            </span>
          </>
        ) : isSingleDonation ? (
          <>
            <CreditCard size={15} />
            <span>{tr(`DOAR R$ ${currentTotalAmount} PARA A RÉGUA`, `DONATE R$ ${currentTotalAmount} TO THE TRACKER`)}</span>
          </>
        ) : (
          <>
            <Users size={15} />
            <span>{tr(`SER MANTENEDOR MENSAL (R$ ${currentTotalAmount}/mês)`, `BECOME MONTHLY SUPPORTER (R$ ${currentTotalAmount}/mo)`)}</span>
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="mt-3 flex items-center justify-center text-[11px] text-slate-400 px-1 font-gotham-regular">
        <div className="flex items-center gap-1.5">
          <Lock size={12} className="text-emerald-600" />
          <span>{tr('Pagamento Seguro SSL', 'SSL Secure Payment')}</span>
        </div>
      </div>

    </div>
  );
}
