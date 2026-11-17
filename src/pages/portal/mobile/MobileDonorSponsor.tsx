import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Calendar,
  Building2,
  Lock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Users
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useFundraising } from '../../../contexts/FundraisingContext';
import { sponsorshipService, SponsorshipMetrics, ChildSponsorshipDetail, calculateChildAge, calculatePackageExpirationDate } from '../../../services/sponsorshipService';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

export function MobileDonorSponsor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const renewChildId = searchParams.get('renewChildId') || undefined;
  const renewChildName = searchParams.get('childName') || undefined;
  const urlMethod = searchParams.get('method');
  const urlMonths = searchParams.get('months');

  const { currentCampaign, createDonation } = useFundraising();

  // Metrics
  const [metrics, setMetrics] = useState<SponsorshipMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Form State - Cartão Mensal ou Pacote PIX (3, 6 e 12 meses)
  const [quotasCount, setQuotasCount] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>(
    urlMethod === 'pix' || renewChildId ? 'pix' : 'card'
  );
  const [pixPackageMonths, setPixPackageMonths] = useState<3 | 6 | 12>(() => {
    const m = urlMonths ? parseInt(urlMonths, 10) : 6;
    return m === 3 || m === 6 || m === 12 ? m : 6;
  });
  const [pixCopied, setPixCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedResult, setAssignedResult] = useState<{
    success: boolean;
    assignedChildren: ChildSponsorshipDetail[];
    totalAmount: number;
    planMonths?: number;
    expiresAt?: string | null;
    paymentMethod?: 'card' | 'pix';
  } | null>(null);

  const quotaCost = metrics?.quotaCost || 90;
  const monthlyTotal = quotasCount * quotaCost;
  const totalAmount = paymentMethod === 'pix' ? monthlyTotal * pixPackageMonths : monthlyTotal;
  const previewExpirationDate = new Date(calculatePackageExpirationDate(pixPackageMonths)).toLocaleDateString('pt-BR');

  const pixKey = 'contato@yahhope.org';
  const pixCopyPaste = `00020126580014br.gov.bcb.pix0114${pixKey}520400005303986540${totalAmount.toFixed(2)}5802BR5908YAH HOPE6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  // Carrega métricas
  useEffect(() => {
    setIsLoadingMetrics(true);
    sponsorshipService.getMetrics()
      .then(m => setMetrics(m))
      .catch(err => console.error('Erro ao carregar dados de apadrinhamento:', err))
      .finally(() => setIsLoadingMetrics(false));
  }, []);

  const predefinedQuotas = [
    { 
      count: 1, 
      label: '1 Cota (1 Criança)', 
      amount: quotaCost, 
      impact: 'Nutrição plena diária, exames clínicos e relatórios mensais',
      badge: 'Mais Escolhido' 
    },
    { 
      count: 2, 
      label: '2 Cotas (2 Crianças)', 
      amount: quotaCost * 2, 
      impact: 'Transformação ampliada para duas vidas com suporte integral' 
    },
    { 
      count: 3, 
      label: '3 Cotas (3 Crianças)', 
      amount: quotaCost * 3, 
      impact: 'Guardião de 3 vidas na Casa Nutri com assistência multidisciplinar' 
    },
    { 
      count: 4, 
      label: '4 Cotas (4 Crianças)', 
      amount: quotaCost * 4, 
      impact: 'Grande impacto comunitário no resgate de desnutrição crônica' 
    },
  ];

  const handleConfirmSponsorship = async () => {
    setIsSubmitting(true);

    const donorName = user?.name || 'Padrinho YAH Hope';
    const donorEmail = user?.email || 'padrinho@yahhope.org';
    const donorPhone = user?.phone || '';
    const effectivePlanMonths = paymentMethod === 'pix' ? pixPackageMonths : 1;

    // Salva intenção de apadrinhamento para reconciliação imediata
    try {
      localStorage.setItem('yah_pending_sponsorship', JSON.stringify({
        donorName,
        donorEmail,
        donorPhone,
        quotasCount,
        amountPerQuota: quotaCost,
        totalAmount,
        paymentMethod,
        planMonths: effectivePlanMonths,
        renewChildId,
        sponsorUserId: user?.id,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Erro ao gravar yah_pending_sponsorship:', e);
    }

    const successReturnUrl = `${window.location.origin}/portal/sponsorship?status=success&quotas=${quotasCount}&months=${effectivePlanMonths}&amount=${totalAmount}&email=${encodeURIComponent(donorEmail)}&name=${encodeURIComponent(donorName)}`;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      // Checkout Stripe apenas para Cartão de Crédito recorrente
      if (supabaseUrl && paymentMethod === 'card') {
        const baseUrl = supabaseUrl.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            campaignId: currentCampaign?.id || '1',
            amount: totalAmount,
            isMonthly: true,
            paymentMethod: 'card',
            planMonths: 1,
            donorName,
            donorEmail,
            donorPhone,
            quotasCount,
            type: 'sponsorship',
            successUrl: successReturnUrl,
            cancelUrl: `${window.location.origin}/portal/apadrinhar?status=cancel`
          })
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // Executa a atribuição ou renovação (Pacote PIX 3, 6 ou 12 meses ou fallback Cartão)
      const result = await sponsorshipService.assignChildrenToSponsor({
        donorName,
        donorEmail,
        donorPhone,
        quotasCount,
        amountPerQuota: quotaCost,
        amount: totalAmount,
        paymentMethod: paymentMethod === 'pix' ? 'pix' : 'cartao_mensal',
        planMonths: effectivePlanMonths,
        renewChildId,
        sponsorUserId: user?.id
      });

      if (result.success) {
        setAssignedResult({
          success: true,
          assignedChildren: result.assignedChildren,
          totalAmount: result.totalAmount,
          planMonths: effectivePlanMonths,
          expiresAt: result.expiresAt,
          paymentMethod
        });

        if (createDonation && currentCampaign) {
          createDonation({
            campaign_id: currentCampaign.id,
            donor_name: user?.name || 'Padrinho YAH Hope',
            donor_email: user?.email || 'padrinho@yahhope.org',
            amount: result.totalAmount,
            payment_method: paymentMethod === 'pix' ? 'pix' : 'cartao_mensal'
          });
        }
      } else {
        alert(result.message || 'Todas as crianças já estão apadrinhadas ou ocorreu um erro.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Ocorreu um erro ao processar o apadrinhamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header com Abas espelhando Central de Doações */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-gotham-bold text-[#F49853] uppercase tracking-widest block mb-1">
            Aliança de Amor • Apadrinhamento
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Heart className="text-[#F49853]" size={32} fill="currentColor" /> 
            {renewChildName ? `Renovar Apadrinhamento (${renewChildName})` : 'Central de Apadrinhamento'}
          </h2>
          <p className="text-sm text-slate-500 font-gotham-light mt-1">
            {renewChildName
              ? `Continue acompanhando e sustentando o tratamento nutricional de ${renewChildName} na Casa Nutri.`
              : 'Apadrinhe uma criança da Casa Nutri via Cartão Mensal ou Pacote PIX (3, 6 ou 12 meses).'}
          </p>
        </div>

        {/* Alternador de Abas */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => {}}
            className="px-5 py-2.5 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-2 cursor-pointer bg-white text-slate-900 shadow-xs"
          >
            <Heart size={14} fill="currentColor" className="text-[#F49853]" />
            <span>Apadrinhar Criança</span>
          </button>
          <Link
            to="/portal/sponsorship"
            className="px-5 py-2.5 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-800"
          >
            <Users size={14} className="text-slate-600" />
            <span>Minhas Crianças</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA (7 cols): Formulário Principal de Apadrinhamento */}
        <div className="lg:col-span-7 space-y-6">

          {!assignedResult ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              
              {/* Badge de Identificação do Usuário Logado */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {user?.name ? user.name[0].toUpperCase() : 'P'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-gotham-bold text-slate-900 truncate">
                        {user?.name || 'Padrinho Conectado'}
                      </p>
                      <span className="text-[9px] font-gotham-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        Conta Vinculada ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate font-medium">
                      {user?.email} {user?.phone ? `• ${user.phone}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {renewChildName && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F49853] text-white flex items-center justify-center shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-amber-800 block">
                        Renovação de Ciclo Ativa
                      </span>
                      <p className="text-sm font-heading font-black text-slate-900">
                        Mantendo o vínculo com {renewChildName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Seleção de Cotas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500">
                    Selecione a Quantidade de Cotas
                  </label>
                  <span className="text-xs text-[#F49853] font-gotham-bold">
                    R$ {quotaCost},00 / cota mensal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {predefinedQuotas.map((q) => {
                    const isSelected = quotasCount === q.count;
                    return (
                      <button
                        key={q.count}
                        type="button"
                        onClick={() => setQuotasCount(q.count)}
                        className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                          isSelected
                            ? 'border-[#F49853] bg-orange-50/50 ring-2 ring-[#F49853]/30 shadow-xs'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        {q.badge && (
                          <span className="absolute -top-2 right-3 bg-[#F49853] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                            {q.badge}
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-heading font-black text-slate-900">
                            R$ {q.amount}
                          </span>
                          <span className="text-xs text-slate-400 font-gotham-medium">
                            /mês
                          </span>
                        </div>
                        <p className="text-xs font-gotham-bold text-slate-700 mt-1">
                          {q.label}
                        </p>
                        <span className="text-xs text-slate-500 font-gotham-light block mt-1 leading-snug">
                          {q.impact}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Forma de Pagamento: Cartão Mensal ou Pacote PIX (3, 6 e 12 meses) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500">
                    Escolha a Modalidade de Pagamento
                  </label>
                  <span className="text-[11px] font-gotham-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    {paymentMethod === 'pix' ? (
                      <><QrCode size={12} /> Pacote PIX com Vigência Garantida</>
                    ) : (
                      <><CreditCard size={12} /> Assinatura Recorrente Automática</>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentMethod === 'card' ? 'bg-white/15 text-[#F49853]' : 'bg-orange-100 text-[#F49853]'
                    }`}>
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h5 className="font-heading font-black text-sm">
                        Cartão de Crédito
                      </h5>
                      <p className={`text-[11px] ${paymentMethod === 'card' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Cobrança mensal (R$ {monthlyTotal}/mês)
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'border-[#F49853] bg-[#F49853] text-white shadow-md'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentMethod === 'pix' ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#F49853]'
                    }`}>
                      <QrCode size={20} />
                    </div>
                    <div>
                      <h5 className="font-heading font-black text-sm">
                        PIX (Pacote de Meses)
                      </h5>
                      <p className={`text-[11px] ${paymentMethod === 'pix' ? 'text-orange-50' : 'text-slate-500'}`}>
                        Pacotes de 3, 6 ou 12 meses
                      </p>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'pix' ? (
                  <div className="p-5 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-gotham-bold uppercase tracking-wider text-slate-700">
                        Selecione o Pacote de Apadrinhamento PIX:
                      </span>
                      <span className="text-[11px] font-gotham-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Calendar size={12} /> Vigente até {previewExpirationDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {([
                        { months: 3 as const, title: '3 Meses', subtitle: 'Pacote Trimestral', desc: '3 meses de acompanhamento garantido' },
                        { months: 6 as const, title: '6 Meses', subtitle: 'Pacote Semestral', desc: '6 meses de acompanhamento garantido', badge: 'Mais Escolhido' },
                        { months: 12 as const, title: '12 Meses', subtitle: 'Pacote Anual', desc: '1 ano inteiro de apadrinhamento ativo' },
                      ]).map((pkg) => {
                        const isPkgSelected = pixPackageMonths === pkg.months;
                        const pkgAmount = monthlyTotal * pkg.months;
                        return (
                          <button
                            key={pkg.months}
                            type="button"
                            onClick={() => setPixPackageMonths(pkg.months)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                              isPkgSelected
                                ? 'border-[#F49853] bg-white ring-2 ring-[#F49853]/25 shadow-sm'
                                : 'border-slate-200 bg-white/80 hover:border-slate-300'
                            }`}
                          >
                            {pkg.badge && (
                              <span className="absolute -top-2.5 right-3 bg-[#F49853] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                                {pkg.badge}
                              </span>
                            )}
                            <span className="text-xs font-gotham-bold uppercase text-[#F49853] block">
                              {pkg.title} ({pkg.subtitle})
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-2xl font-heading font-black text-slate-900">
                                R$ {pkgAmount}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">
                              Equivale a R$ {monthlyTotal}/mês • {pkg.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3.5 bg-white/90 border border-orange-200/70 rounded-xl space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      <p className="font-gotham-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                        Como funciona o seu acesso e o pacote PIX de {pixPackageMonths} meses:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                        <li>
                          <strong>Acesso contínuo sem interrupção na virada do mês:</strong> Seu apadrinhamento fica registrado pelo período de <strong>{pixPackageMonths} meses</strong> (até <strong>{previewExpirationDate}</strong>).
                        </li>
                        <li>
                          <strong>Liberdade ao final do pacote:</strong> Quando o período estiver chegando ao fim, exibiremos um convite caso deseje renovar. Caso não queira continuar o apadrinhamento, você <strong>continua tendo acesso normal ao sistema e às atualizações gerais do projeto</strong>, deixando apenas de acompanhar a criança individualmente.
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-gotham-bold text-xs">
                      <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                      <span>Como funciona a cobrança no Cartão? Não compromete o seu limite total!</span>
                    </div>
                    <ul className="text-xs text-blue-950/80 font-gotham-light space-y-1.5 pl-5 list-disc leading-relaxed">
                      <li>
                        <strong>Sem bloqueio de limite futuro:</strong> A cada mês é cobrado <strong>apenas o valor da cota do mês (R$ {monthlyTotal.toFixed(2)})</strong>, como uma assinatura mensal.
                      </li>
                      <li>
                        <strong>Sem fidelidade forçada:</strong> Você pode pausar, alterar cotas ou cancelar quando quiser. Mesmo se encerrar o apadrinhamento da criança, seu acesso ao portal e às novidades gerais do projeto permanece ativo.
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 3. Informações sobre a Vinculação e Revelação da Criança */}
              <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 rounded-2xl p-5 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={12} className="text-[#F49853]" />
                    Distribuição Solidária com Amor
                  </span>
                  <span className="text-xs text-amber-700 font-gotham-bold">
                    Casa Nutri • Moçambique
                  </span>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-amber-200/70 text-xs text-amber-950 font-gotham-medium flex items-center gap-2.5">
                  <span className="text-lg shrink-0">💌</span>
                  <span>
                    <strong>Identificação da sua Criança:</strong> Você conhecerá a foto, o nome, a história e os relatórios de evolução médica da sua criança apadrinhada <strong>logo após a confirmação</strong>!
                  </span>
                </div>
              </div>

              {/* Botão de Confirmação */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSponsorship}
                  disabled={isSubmitting || totalAmount <= 0}
                  className="w-full py-4 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  {paymentMethod === 'pix' ? <QrCode size={18} /> : <Heart size={18} fill="currentColor" />}
                  <span>
                    {paymentMethod === 'pix'
                      ? `Confirmar Pacote PIX de ${pixPackageMonths} Meses (R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
                      : `Confirmar Apadrinhamento de R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-gotham-light">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Ambiente protegido com criptografia de 256 bits • Acesso garantido ao portal</span>
              </div>

            </div>
          ) : (
            /* Tela de Confirmação de Apadrinhamento */
            <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-xs font-gotham-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  {assignedResult.paymentMethod === 'pix'
                    ? `Pacote PIX de ${assignedResult.planMonths} Meses Registrado!`
                    : 'Apadrinhamento Concluído com Sucesso!'}
                </span>
                <h3 className="text-3xl font-heading font-black text-slate-900">
                  R$ {assignedResult.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                  <span className="text-sm font-normal text-slate-500">
                    {assignedResult.paymentMethod === 'pix' ? `(${assignedResult.planMonths} meses)` : '/ mês'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-gotham-light">
                  {assignedResult.assignedChildren.length} {assignedResult.assignedChildren.length === 1 ? 'Criança Apadrinhada' : 'Crianças Apadrinhadas'} com Amor
                  {assignedResult.expiresAt ? ` • Vigente até ${new Date(assignedResult.expiresAt).toLocaleDateString('pt-BR')}` : ''}
                </p>
              </div>

              {/* QR Code e Chave PIX se for pagamento via PIX */}
              {assignedResult.paymentMethod === 'pix' ? (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-gotham-bold text-slate-800 uppercase tracking-wider">
                      Conclua a Transferência PIX
                    </span>
                    <span className="text-[11px] font-gotham-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Pacote {assignedResult.planMonths} Meses
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pixCopyPaste)}`}
                      alt="QR Code PIX"
                      className="w-32 h-32 rounded-xl border border-slate-100 p-1 shrink-0"
                    />
                    <div className="flex-1 w-full space-y-2">
                      <p className="text-xs text-slate-600 leading-snug">
                        Escaneie o QR Code ou copie a chave PIX abaixo no valor de <strong>R$ {assignedResult.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>:
                      </p>
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-mono font-bold text-slate-800 truncate mr-2">{pixKey}</span>
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {pixCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200 p-3 rounded-xl leading-relaxed">
                    ✅ <strong>Vigência registrada:</strong> Seu acompanhamento da criança está garantido até <strong>{assignedResult.expiresAt ? new Date(assignedResult.expiresAt).toLocaleDateString('pt-BR') : previewExpirationDate}</strong>. Você não perde acesso na virada de mês!
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl max-w-md mx-auto text-xs text-emerald-900 font-gotham-light text-left leading-relaxed">
                  <strong>Assinatura mensal ativa:</strong> A cobrança de R$ {assignedResult.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ocorrerá mensalmente no seu cartão de crédito, debitando apenas a mensalidade vigente (sem comprometer o limite total do cartão).
                </div>
              )}

              {/* Crianças Vinculadas */}
              <div className="space-y-3 max-w-md mx-auto text-left">
                <p className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500 text-center">
                  Sua(s) Criança(s) Apadrinhada(s):
                </p>
                {assignedResult.assignedChildren.map(child => (
                  <div key={child.id} className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-200 overflow-hidden shrink-0 border border-amber-300">
                      {child.photo_url ? (
                        <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-800 font-bold">
                          {child.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-gotham-bold text-slate-900 truncate">{child.name}</h4>
                      <p className="text-xs text-slate-500">
                        {child.ageText || calculateChildAge(child.dob)} • {child.community || 'Casa Nutri'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botões de Ação Pós-Apadrinhamento */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <button
                  onClick={() => navigate('/portal/sponsorship')}
                  className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-gotham-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Users size={16} />
                  <span>Ver em Minhas Crianças</span>
                </button>
                <button
                  onClick={() => setAssignedResult(null)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Apadrinhar Mais Crianças
                </button>
              </div>

            </div>
          )}

        </div>

        {/* COLUNA DIREITA (5 cols): Impacto, Vagas e Garantias */}
        <div className="lg:col-span-5 space-y-6">

          {/* Card Ocupação e Vagas na Casa Nutri */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-gotham-bold uppercase tracking-widest text-[#F49853] bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                Casa Nutri • Moçambique
              </span>
              <span className="text-xs font-gotham-bold text-emerald-400 flex items-center gap-1">
                <TrendingUp size={14} /> Atendimento Ativo
              </span>
            </div>

            <h3 className="text-lg font-heading font-black text-white leading-snug">
              Crianças em Acompanhamento Nutricional
            </h3>
            <p className="text-xs text-slate-300 font-gotham-light">
              Cada cota garante suplementação, consultas antropométricas e refeições terapêuticas para erradicar a desnutrição infantil severa.
            </p>

            {/* Métricas Consolidadas */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="p-2.5 bg-white/5 rounded-2xl">
                <span className="text-lg font-heading font-black text-white block">
                  {metrics?.totalChildren || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-gotham-light">
                  Crianças Cadastradas
                </span>
              </div>
              <div className="p-2.5 bg-white/5 rounded-2xl">
                <span className="text-lg font-heading font-black text-emerald-400 block">
                  {metrics?.filledSlots || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-gotham-light">
                  Cotas Ativas
                </span>
              </div>
              <div className="p-2.5 bg-white/5 rounded-2xl">
                <span className="text-lg font-heading font-black text-amber-400 block">
                  {metrics?.availableSlots || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-gotham-light">
                  Vagas Abertas
                </span>
              </div>
            </div>

            {/* Barra de Ocupação */}
            {metrics && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-gotham-bold">
                  <span className="text-slate-400">Taxa de Cobertura</span>
                  <span className="text-emerald-400">{metrics.occupancyRate}%</span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-[#F49853] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* O Que o Seu Apadrinhamento Garante */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-heading font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-[#F49853]" />
              O Que Seu Apadrinhamento Garante
            </h4>

            <div className="space-y-3.5 text-xs text-slate-600 font-gotham-light">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p><strong>Alimentação Terapêutica:</strong> Refeições diárias com suplementação vitamínica e fórmulas específicas de resgate nutricional.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p><strong>Acompanhamento Pediátrico:</strong> Consultas clínicas, pesagem regular e medição antropométrica quinzenal.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p><strong>Fotos e Relatórios Mensais:</strong> Acesso a relatórios de evolução exclusivos no seu portal com fotos e curva de peso.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p><strong>Vínculo Afetivo:</strong> Possibilidade de enviar mensagens de incentivo e cartinhas para sua criança.</p>
              </div>
            </div>
          </div>

          {/* Compromissos do Padrinho */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-heading font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-[#F49853]" />
              Compromissos do Padrinho
            </h4>

            <div className="space-y-3.5 text-xs text-slate-600 font-gotham-light">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p><strong>100% Destinado:</strong> Todo o valor vai diretamente para o cuidado das crianças na Casa Nutri.</p>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p><strong>Transparência & Prestação de Contas:</strong> Acompanhe no portal o histórico de contribuições e a prestação de contas periódica da Casa Nutri.</p>
              </div>
              <div className="flex items-start gap-3">
                <Lock size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p><strong>Sem Burocracia:</strong> Pause, gerencie ou cancele seu apadrinhamento a qualquer momento pelo portal.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
