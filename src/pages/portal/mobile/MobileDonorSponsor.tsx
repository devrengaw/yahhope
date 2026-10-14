import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  ArrowRight,
  CreditCard,
  Building2,
  Lock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Users
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useFundraising } from '../../../contexts/FundraisingContext';
import { sponsorshipService, SponsorshipMetrics, ChildSponsorshipDetail, calculateChildAge } from '../../../services/sponsorshipService';
import { useNavigate, Link } from 'react-router-dom';

export function MobileDonorSponsor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentCampaign, createDonation } = useFundraising();

  // Metrics
  const [metrics, setMetrics] = useState<SponsorshipMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Form State
  const [quotasCount, setQuotasCount] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedResult, setAssignedResult] = useState<{
    success: boolean;
    assignedChildren: ChildSponsorshipDetail[];
    totalAmount: number;
  } | null>(null);

  const quotaCost = metrics?.quotaCost || 90;
  const totalAmount = quotasCount * quotaCost;

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

  // Pix oficial da YAH Hope
  const pixKey = 'contato@yahhope.org';
  const pixCopyPaste = `00020126580014br.gov.bcb.pix0114${pixKey}520400005303986540${totalAmount.toFixed(2)}5802BR5908YAH HOPE6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleConfirmSponsorship = async () => {
    setIsSubmitting(true);

    try {
      if (paymentMethod === 'card') {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (supabaseUrl) {
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
              donorName: user?.name || 'Padrinho YAH Hope',
              donorEmail: user?.email || 'padrinho@yahhope.org',
              donorPhone: user?.phone || '',
              quotasCount,
              successUrl: `${window.location.origin}/portal/sponsorship?status=success&amount=${totalAmount}`,
              cancelUrl: `${window.location.origin}/portal/apadrinhar?status=cancel`
            })
          });

          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          }
        }
      }

      // Executa a atribuição Least-Sponsored com 1-clique (usuário logado)
      const result = await sponsorshipService.assignChildrenToSponsor({
        donorName: user?.name || 'Padrinho YAH Hope',
        donorEmail: user?.email || 'padrinho@yahhope.org',
        donorPhone: user?.phone || '',
        quotasCount,
        amountPerQuota: quotaCost,
        paymentMethod: paymentMethod === 'pix' ? 'pix' : 'cartao_mensal',
        sponsorUserId: user?.id
      });

      if (result.success) {
        setAssignedResult({
          success: true,
          assignedChildren: result.assignedChildren,
          totalAmount: result.totalAmount
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
      alert('Ocorreu um erro ao registrar o apadrinhamento. Tente novamente.');
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
            Central de Apadrinhamento
          </h2>
          <p className="text-sm text-slate-500 font-gotham-light mt-1">
            Apadrinhe uma criança da Casa Nutri com apoio nutricional, clínico e relatórios mensais exclusivos.
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

              {/* 2. Informações sobre a Vinculação e Revelação da Criança */}
              <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 rounded-2xl p-5 border border-amber-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={12} className="text-[#F49853]" />
                    Distribuição Solidária com Amor
                  </span>
                  <span className="text-xs text-amber-700 font-gotham-bold">
                    Casa Nutri • Moçambique
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F49853] to-amber-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                    <Heart size={24} fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-black text-slate-900 text-sm">
                      Acolhimento da Criança em Maior Vulnerabilidade
                    </h4>
                    <p className="text-xs text-slate-600 font-gotham-light mt-1 leading-relaxed">
                      Sua contribuição mensal apoia diretamente o resgate nutricional, acompanhamento clínico e refeições diárias. Nosso algoritmo inteligente distribui seu apoio à criança em estado prioritário na Casa Nutri.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white/90 rounded-xl border border-amber-200/70 text-xs text-amber-950 font-gotham-medium flex items-center gap-2.5 shadow-2xs">
                  <span className="text-lg shrink-0">💌</span>
                  <span>
                    <strong>Identificação da sua Criança:</strong> Você conhecerá a foto, o nome, a história e os relatórios de evolução médica da sua criança apadrinhada <strong>logo após a confirmação</strong>!
                  </span>
                </div>
              </div>

              {/* 3. Forma de Pagamento */}
              <div>
                <label className="block text-xs font-gotham-bold uppercase tracking-wider text-slate-500 mb-2">
                  Forma de Pagamento Mensal
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 font-gotham-bold text-xs transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'border-[#F49853] bg-orange-50 text-[#F49853] ring-2 ring-[#F49853]/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode size={18} />
                    <span>PIX Instantâneo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 font-gotham-bold text-xs transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-[#F49853] bg-orange-50 text-[#F49853] ring-2 ring-[#F49853]/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              </div>

              {/* Botão de Confirmação 1-Clique */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSponsorship}
                  disabled={isSubmitting || totalAmount <= 0}
                  className="w-full py-4 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  <Heart size={18} fill="currentColor" />
                  <span>
                    Confirmar Apadrinhamento de R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-gotham-light">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Ambiente protegido com criptografia de 256 bits • Cancele quando quiser</span>
              </div>

            </div>
          ) : (
            /* Tela de Confirmação / PIX Gerado */
            <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-xs font-gotham-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  {paymentMethod === 'pix' ? 'Apadrinhamento Confirmado • Chave PIX Gerada' : 'Apadrinhamento Concluído com Sucesso!'}
                </span>
                <h3 className="text-3xl font-heading font-black text-slate-900">
                  R$ {assignedResult.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">/ mês</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-gotham-light">
                  {assignedResult.assignedChildren.length} {assignedResult.assignedChildren.length === 1 ? 'Criança Apadrinhada' : 'Crianças Apadrinhadas'} com Amor
                </p>
              </div>

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

              {/* QR Code Pix */}
              {paymentMethod === 'pix' && (
                <>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 inline-block mx-auto shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCopyPaste)}`}
                      alt="QR Code Pix"
                      className="w-48 h-48 mx-auto rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 text-left max-w-md mx-auto">
                    <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500 block">
                      Chave PIX Oficial da YAH Hope:
                    </label>
                    <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-xs font-mono font-bold text-slate-800 flex-1 truncate">
                        {pixKey}
                      </span>
                      <button
                        onClick={handleCopyPix}
                        className="px-4 py-2 bg-[#F49853] hover:bg-[#e0853d] text-white text-xs font-gotham-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        {isCopied ? (
                          <>
                            <Check size={14} /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copiar Chave
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

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
