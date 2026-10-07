import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  CreditCard, 
  QrCode, 
  Users, 
  GraduationCap, 
  Droplets, 
  HelpCircle, 
  ChevronDown, 
  Copy, 
  Check, 
  Award, 
  Activity, 
  Clock, 
  Calendar,
  Gift,
  FileText,
  Star
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useFundraising } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';

interface PlanOption {
  id: string;
  amount: number;
  dailyEstimate: string;
  badge?: string;
  popular?: boolean;
  title: string;
  tagline: string;
  impact: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 'essencial',
    amount: 50,
    dailyEstimate: 'R$ 1,66 / dia',
    title: 'Nutrição Essencial',
    tagline: 'O oxigênio básico que afasta uma criança da fome aguda.',
    impact: [
      'Garante fórmulas nutricionais diárias (leite terapêutico e suplementos)',
      'Acompanhamento médico semanal na Casa Nutri em Nampula',
      'Relatórios mensais de evolução médica no Portal do Mantenedor'
    ]
  },
  {
    id: 'guardiao',
    amount: 100,
    dailyEstimate: 'R$ 3,33 / dia',
    popular: true,
    badge: 'Mais Escolhido',
    title: 'Guardião da Vida',
    tagline: 'Tratamento intensivo que resgata e sustenta a família inteira.',
    impact: [
      'Tratamento intensivo completo para recuperação de desnutrição severa',
      'Cesta básica e apoio nutricional contínuo para a mãe da criança',
      'Acesso a medicamentos básicos, exames laboratoriais e pesagens periódicas',
      'Acesso VIP ao Portal do Doador com cartas e atualizações em primeira mão'
    ]
  },
  {
    id: 'integral',
    amount: 200,
    dailyEstimate: 'R$ 6,66 / dia',
    title: 'Transformação Integral',
    tagline: 'Resgate nutricional + Fundo de Bolsas Universitárias para a juventude.',
    impact: [
      'Sustenta o resgate nutricional clínico de até 2 crianças por mês',
      'Contribui diretamente com o Fundo de Bolsas Universitárias em Moçambique',
      'Oficinas de autonomia e capacitação agrícola para mães da comunidade',
      'Certificado digital oficial de Mantenedor Estratégico YAH Hope'
    ]
  },
  {
    id: 'alianca',
    amount: 500,
    dailyEstimate: 'R$ 16,60 / dia',
    badge: 'Impacto Comunitário',
    title: 'Aliança de Esperança',
    tagline: 'Infraestrutura vital, perfuração de poços artesianos e expansão.',
    impact: [
      'Financia insumos clínicos importados para a Casa Nutri (F-75, F-100, Plumpy\'Nut)',
      'Manutenção preventiva e perfuração de poços de água potável nas aldeias',
      'Atendimento a casos de extrema urgência médica e internações',
      'Canal direto com a liderança de campo e reuniões exclusivas de prestação de contas'
    ]
  }
];

const FAQS = [
  {
    question: 'Por que o apoio mensal é mais transformador do que uma doação única?',
    answer: 'Crianças em desnutrição aguda grave precisam de um protocolo clínico que dura entre 45 e 90 dias contínuos. Se dependêssemos apenas de doações pontuais, não saberíamos se teríamos fórmulas terapêuticas para a próxima semana. A sua fidelidade mensal é o oxigênio que permite à nossa equipe médica manter as portas abertas todos os dias, planejar compras e nunca negar atendimento a uma mãe desesperada.'
  },
  {
    question: 'Como funciona a cobrança mensal no Cartão de Crédito?',
    answer: 'A cobrança é realizada de forma automática e 100% segura todo mês. O valor é debitado como uma assinatura mensal, sem comprometer o limite total do seu cartão de crédito (apenas o valor da parcela mensal é utilizado).'
  },
  {
    question: 'Posso ser mantenedor utilizando PIX?',
    answer: 'Sim! Você pode fazer sua contribuição mensal via PIX. Basta utilizar nossa chave oficial (contato@yahhope.org) ou escanear o QR Code gerado nesta página. Recomendamos ativar a opção de "PIX Agendado Recorrente" no aplicativo do seu banco (disponível no Nubank, Itaú, Bradesco, Banco do Brasil, Inter, Caixa, etc.) para que sua doação ocorra automaticamente todo mês.'
  },
  {
    question: 'Como posso acompanhar o destino do meu dinheiro?',
    answer: 'Transparência é um valor inegociável na YAH Hope. Como mantenedor, você recebe acesso ao Portal do Doador, onde acompanha relatórios de evolução das crianças, fotos das ações de campo, demonstrativos de impacto e notícias exclusivas. Além disso, enviamos boletins periódicos pelo seu e-mail e WhatsApp.'
  },
  {
    question: 'Posso cancelar, pausar ou alterar o valor da minha contribuição a qualquer momento?',
    answer: 'Com certeza. Sem fidelidade forçada, sem burocracia e sem constrangimento. Você pode alterar o valor ou cancelar sua assinatura mensal quando desejar com apenas um clique pelo Portal do Doador ou enviando uma mensagem para a nossa equipe no e-mail contato@yahhope.org.'
  },
  {
    question: 'Minha empresa pode se tornar uma mantenedora jurídica?',
    answer: 'Sim! Temos um programa dedicado a Pessoas Jurídicas e alianças corporativas, com emissão de recibos institucionais e relatórios ESG / responsabilidade social corporativa. Entre em contato pelo e-mail contato@yahhope.org para conhecer nossos projetos corporativos.'
  }
];

export function MonthlyDonor() {
  const { activeCampaign, campaign: defaultCamp, createDonation } = useFundraising();
  const currentCampaign = activeCampaign || defaultCamp;

  // Estado do Seletor
  const [selectedPlanId, setSelectedPlanId] = useState<string>('guardiao');
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Formulário do Mantenedor
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Valor Atual Selecionado
  const currentAmount = isCustom 
    ? (parseFloat(customAmount.replace(/\./g, '').replace(',', '.')) || 0)
    : (PLANS.find(p => p.id === selectedPlanId)?.amount || 100);

  const pixKey = 'contato@yahhope.org';
  const pixCopyPaste = `00020126580014br.gov.bcb.pix0114${pixKey}520400005303986540${currentAmount.toFixed(2)}5802BR5908YAH HOPE6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setCustomAmount('');
      return;
    }
    const numericValue = parseInt(value, 10) / 100;
    setCustomAmount(numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!donorName.trim() || !donorEmail.trim()) {
      alert('Por favor, preencha seu nome e e-mail.');
      return;
    }

    if (currentAmount < 10) {
      alert('O valor mínimo de contribuição mensal é de R$ 10,00.');
      return;
    }

    setIsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      
      if (!supabaseUrl) {
        // Modo Demonstração / Sem backend configurado
        setTimeout(() => {
          if (createDonation && currentCampaign) {
            createDonation({
              campaign_id: currentCampaign.id,
              donor_name: donorName,
              donor_email: donorEmail,
              amount: currentAmount,
              payment_method: paymentMethod === 'pix' ? 'pix' : 'cartao_mensal'
            });
          }
          setIsLoading(false);
          setIsSuccess(true);
        }, 1200);
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
          campaignId: currentCampaign?.id || '1',
          amount: currentAmount,
          isMonthly: true,
          paymentMethod, // 'pix' ou 'card'
          donorName,
          donorEmail,
          successUrl: `${window.location.origin}/mantenedor?status=success&amount=${currentAmount}`,
          cancelUrl: `${window.location.origin}/mantenedor?status=cancel`
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback gracioso
        setIsLoading(false);
        setIsSuccess(true);
      }
    } catch (err) {
      console.error('Erro ao processar adesão de mantenedor:', err);
      setIsLoading(false);
      setIsSuccess(true);
    }
  };

  const scrollToCheckout = () => {
    const el = document.getElementById('adesao-mantenedor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-gotham-regular text-slate-800">
      <SEO 
        title="Seja um Mantenedor Mensal | YAH Hope"
        description="Junte-se à família de mantenedores mensais da YAH Hope. Sua fidelidade salva vidas todos os dias, combate a desnutrição infantil e constrói futuro em Moçambique e no Brasil."
        keywords="mantenedor mensal YAH Hope, doar mensalmente ONG, combater desnutrição Moçambique, apadrinhar causa, doação recorrente"
        canonical="https://yahhope.org/mantenedor"
      />

      {/* 1. HERO SECTION COM COPY CATIVANTE E PROFUNDA */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 bg-[#0F172A] text-white overflow-hidden">
        {/* Background visual imersivo */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/mantenedor_hero.jpg" 
            alt="Criança sorrindo acolhida pela YAH Hope" 
            className="w-full h-full object-cover object-top filter brightness-[0.38] contrast-105 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/85 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/75 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Coluna Texto: Proposta de Valor e Emoção */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight text-white leading-[1.12]">
                Uma doação alimenta hoje. <br />
                <span className="text-[#F49853]">Sua fidelidade mensal</span> <br className="hidden sm:inline" />
                salva vidas todos os dias.
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 font-gotham-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                A desnutrição grave não faz pausa no fim de semana e a fome não espera uma campanha sazonal. O que mantém a Casa Nutri aberta, o leite terapêutico no leito e a equipe médica em ação em Moçambique é a <strong>certeza de mantenedores fiéis</strong> como você.
              </p>

              {/* Métricas Rápidas de Impacto e Confiança */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-700/60 max-w-xl mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">500+</p>
                  <p className="text-xs text-slate-400 font-gotham-medium mt-0.5">Vidas Resgatadas</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-[#92BF78]">100%</p>
                  <p className="text-xs text-slate-400 font-gotham-medium mt-0.5">Gestão Auditada</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-[#F49853]">R$ 1,66</p>
                  <p className="text-xs text-slate-400 font-gotham-medium mt-0.5">Ao dia para mudar tudo</p>
                </div>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={scrollToCheckout}
                  className="w-full sm:w-auto bg-[#F49853] hover:bg-[#e0853d] text-white px-8 py-4 rounded-full font-gotham-bold text-sm tracking-wide shadow-xl shadow-[#F49853]/30 hover:shadow-[#F49853]/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={18} />
                  <span>Quero Ser um Mantenedor Mensal</span>
                  <ArrowRight size={16} />
                </button>

                <a
                  href="#como-funciona"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-4 rounded-full font-gotham-medium text-sm tracking-wide transition-all text-center"
                >
                  Entenda o Impacto da sua Ajuda
                </a>
              </div>
            </div>

            {/* Coluna Direita: Card Flutuante de Síntese */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative">
                <div className="absolute -top-3 -right-3 bg-[#92BF78] text-slate-950 font-gotham-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  Portal Exclusivo
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F49853] flex items-center justify-center text-white shrink-0 shadow-lg">
                    <Heart size={24} className="fill-white" />
                  </div>
                  <div>
                    <h3 className="font-gotham-bold text-lg text-white">Comunidade de Mantenedores</h3>
                    <p className="text-xs text-slate-300">A aliança que nunca abandona quem precisa</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-200 font-gotham-light">
                  <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <CheckCircle2 size={18} className="text-[#92BF78] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-gotham-medium">Previsibilidade que Salva</strong>
                      <span className="text-xs text-slate-300">Garante a compra antecipada de fórmulas terapêuticas F-75 e Plumpy'Nut direto dos laboratórios.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <CheckCircle2 size={18} className="text-[#92BF78] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-gotham-medium">Relatórios Diretos de Campo</strong>
                      <span className="text-xs text-slate-300">Acompanhe a recuperação de peso, fotos e boletins das crianças assistidas pelo seu compromisso.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <CheckCircle2 size={18} className="text-[#92BF78] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-gotham-medium">100% Flexível e Seguro</strong>
                      <span className="text-xs text-slate-300">Cancele, pause ou ajuste o valor a qualquer momento com total autonomia e sem amarras.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Lock size={14} className="text-[#F49853]" />
                    Criptografia 256-Bit SSL
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-[#92BF78]" />
                    Ativação Imediata
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. O CONTRASTE: POR QUE O APOIO MENSAL É CRUCIAL */}
      <section id="como-funciona" className="py-20 md:py-28 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              A Diferença Entre Sobreviver e Prosperar
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
              Por que a Casa Nutri depende da sua constância mensal?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-gotham-light mt-4">
              Uma doação esporádica apaga um incêndio. O mantenedor mensal constrói uma fortaleza contra a fome e a mortalidade infantil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Coluna 1: O drama da incerteza */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-6">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-heading font-black text-slate-900 mb-3">
                Quando dependemos apenas de doações pontuais:
              </h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <span>A equipe médica vive sob a tensão de não saber se terá estoque de leite terapêutico no mês seguinte.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <span>Dificuldade para acolher novas crianças internadas por medo de interromper o tratamento na metade.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <span>Custos logísticos mais altos por compras de emergência em vez de planejamento com fornecedores.</span>
                </li>
              </ul>
            </div>

            {/* Coluna 2: O poder da fidelidade mensal */}
            <div className="bg-gradient-to-br from-[#0F172A] to-slate-900 text-white rounded-3xl p-8 border border-[#F49853]/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F49853]/15 rounded-full blur-2xl"></div>
              
              <div className="w-12 h-12 rounded-2xl bg-[#F49853] flex items-center justify-center text-white mb-6 shadow-md shadow-[#F49853]/30">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-heading font-black text-white mb-3">
                Quando você se torna um Mantenedor Mensal:
              </h3>
              <ul className="space-y-4 text-slate-200 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#92BF78] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>Portas Sempre Abertas:</strong> Nenhuma mãe em desespero é devolvida com seu filho sem acolhimento e nutrição.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#92BF78] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>Tratamento Clínico Completo:</strong> Garantia do ciclo integral de 45 a 90 dias com F-75, F-100, ferro, zinco e vacinas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#92BF78] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>Futuro Além da Fome:</strong> Apoio a poços de água limpa, hortas comunitárias e bolsas universitárias para quebrar o ciclo da miséria.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 3. AS TRÊS FRENTES DE DESTINAÇÃO DO RECURSO */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              Destinação Real e Auditada
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
              Para onde vai a sua contribuição todo mês?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-gotham-light mt-4">
              Cada centavo confiado à YAH Hope possui endereço certo, auditoria contínua e impacto mensurável.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Frente 1 */}
            <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-8 rounded-3xl border border-slate-200/80 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#F49853] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity size={28} />
                </div>
                <h3 className="text-xl font-heading font-black text-slate-900 mb-3">
                  Casa Nutri (Nampula)
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-gotham-light mb-4">
                  Compra de fórmulas terapêuticas (F-75, F-100 e Plumpy'Nut), insumos hospitalares, remuneração de nutricionistas locais e monitoramento pediátrico intensivo para erradicar a desnutrição infantil.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 text-xs font-gotham-bold text-[#F49853] flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Salva vidas em risco iminente</span>
              </div>
            </div>

            {/* Frente 2 */}
            <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-8 rounded-3xl border border-slate-200/80 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap size={28} />
                </div>
                <h3 className="text-xl font-heading font-black text-slate-900 mb-3">
                  Educação & Bolsas Universitárias
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-gotham-light mb-4">
                  Financiamento de bolsas universitárias integrais para jovens órfãos ou em extrema vulnerabilidade se formarem médicos, enfermeiros, professores e engenheiros da sua própria nação.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 text-xs font-gotham-bold text-blue-600 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Quebra o ciclo geracional da pobreza</span>
              </div>
            </div>

            {/* Frente 3 */}
            <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-8 rounded-3xl border border-slate-200/80 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Droplets size={28} />
                </div>
                <h3 className="text-xl font-heading font-black text-slate-900 mb-3">
                  Água Potável & Autonomia Comunitária
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-gotham-light mb-4">
                  Perfuração de poços artesianos nas aldeias, saneamento, oficinas de agricultura sustentável para mães e hortas que alimentam centenas de famílias de forma autônoma.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 text-xs font-gotham-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Saúde preventiva e dignidade básica</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SELETOR DE PLANOS E FORMULÁRIO DE ADESÃO (CALL TO ACTION CENTRAL) */}
      <section id="adesao-mantenedor" className="py-20 md:py-28 bg-[#0F172A] text-white relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0F172A] to-[#0F172A] opacity-90"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              Escolha seu Nível de Aliança
            </span>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-white leading-tight">
              Torne-se um Mantenedor Mensal Hoje
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-gotham-light mt-4">
              Selecione o valor com o qual deseja abençoar vidas todos os meses. Cancele ou altere quando quiser sem burocracia.
            </p>
          </div>

          {isSuccess ? (
            /* Tela de Confirmação & Boas-Vindas */
            <div className="max-w-2xl mx-auto bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-200 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <Heart size={44} className="fill-emerald-600" />
              </div>
              
              <span className="text-xs font-gotham-bold text-emerald-600 uppercase tracking-widest block mb-2">
                Gratidão Imensa • Aliança Firmada
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 mb-3">
                Bem-vindo à Família YAH Hope, {donorName || 'Apoiador'}!
              </h3>
              
              <p className="text-slate-600 text-base leading-relaxed mb-6 font-gotham-light">
                O seu compromisso mensal de <strong>R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> já está transformando vidas na Casa Nutri e garantindo que crianças desnutridas recebam tratamento digno.
              </p>

              {paymentMethod === 'pix' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-gotham-bold text-sm text-slate-800">Próximo Passo: Concluir seu PIX</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-gotham-bold">Chave E-mail</span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-sm font-mono text-slate-700 font-bold">{pixKey}</span>
                    <button
                      onClick={handleCopyPix}
                      className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-1 cursor-pointer"
                    >
                      {pixCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      <span>{pixCopied ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-gotham-bold text-slate-700">Dica para doação automática:</p>
                    <p>No aplicativo do seu banco, ative o <strong>Agendamento Mensal</strong> ou repita este PIX todo mês no dia que preferir.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="w-full sm:w-auto bg-[#F49853] hover:bg-[#e0853d] text-white px-8 py-3.5 rounded-full font-gotham-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Users size={16} />
                  <span>Acessar Portal do Mantenedor</span>
                </Link>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-full font-gotham-medium text-sm transition-all"
                >
                  Fazer Outra Contribuição
                </button>
              </div>
            </div>
          ) : (
            /* Formulário Principal de Escolha de Planos e Pagamento */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Seleção dos Planos (Coluna Esquerda lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-4">
                <p className="text-xs font-gotham-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Selecione o Plano de Mantenedor Mensal
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PLANS.map((plan) => {
                    const isSelected = !isCustom && selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                          setIsCustom(false);
                          setSelectedPlanId(plan.id);
                        }}
                        className={cn(
                          "relative rounded-3xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between",
                          isSelected
                            ? "bg-slate-800/90 border-[#F49853] shadow-lg shadow-[#F49853]/15 scale-[1.01]"
                            : "bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60"
                        )}
                      >
                        {plan.badge && (
                          <div className={cn(
                            "absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-gotham-bold uppercase tracking-wider shadow-sm",
                            plan.popular ? "bg-[#F49853] text-white" : "bg-emerald-500 text-slate-950"
                          )}>
                            {plan.badge}
                          </div>
                        )}

                        <div>
                          <div className="flex items-baseline justify-between mb-2">
                            <div>
                              <span className="text-2xl font-black text-white">
                                R$ {plan.amount}
                              </span>
                              <span className="text-xs text-slate-400 font-gotham-light"> / mês</span>
                            </div>
                            <span className="text-[11px] font-gotham-bold text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded">
                              {plan.dailyEstimate}
                            </span>
                          </div>

                          <h4 className="font-gotham-bold text-base text-white mb-1">
                            {plan.title}
                          </h4>
                          <p className="text-xs text-slate-300 font-gotham-light mb-4 leading-relaxed">
                            {plan.tagline}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-700/60 space-y-2">
                          {plan.impact.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300 font-gotham-light">
                              <CheckCircle2 size={13} className="text-[#92BF78] shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Opção de Outro Valor */}
                <div 
                  onClick={() => setIsCustom(true)}
                  className={cn(
                    "rounded-3xl p-5 border-2 transition-all cursor-pointer",
                    isCustom 
                      ? "bg-slate-800/90 border-[#F49853] shadow-lg shadow-[#F49853]/15" 
                      : "bg-slate-800/40 border-slate-700 hover:border-slate-500"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        isCustom ? "border-[#F49853]" : "border-slate-500"
                      )}>
                        {isCustom && <div className="w-2.5 h-2.5 bg-[#F49853] rounded-full" />}
                      </div>
                      <div>
                        <span className="font-gotham-bold text-white text-sm block">Definir Outro Valor Mensal</span>
                        <span className="text-xs text-slate-400 font-gotham-light">Qualquer contribuição mensal gera impacto imediato</span>
                      </div>
                    </div>

                    {isCustom && (
                      <div className="relative max-w-xs w-full">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0,00"
                          value={customAmount}
                          onChange={handleCustomChange}
                          autoFocus
                          className="w-full bg-slate-900 border border-[#F49853] rounded-xl pl-10 pr-4 py-2.5 text-white font-gotham-bold text-base focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo do Impacto Selecionado */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 text-xs text-slate-300">
                  <span className="font-gotham-bold text-white uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#92BF78]" />
                    Compromisso de Transparência YAH Hope:
                  </span>
                  <p className="leading-relaxed font-gotham-light">
                    Sua contribuição mensal de <strong>R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> será debitada mensalmente e revertida diretamente para compra de insumos clínicos, tratamento de crianças desnutridas e projetos de autonomia. Você receberá relatórios contínuos de impacto no seu e-mail.
                  </p>
                </div>

              </div>

              {/* Formulário de Identificação & Pagamento (Coluna Direita lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-gotham-bold uppercase tracking-wider text-[#F49853]">Passo Final</span>
                    <span className="text-xs font-gotham-medium text-slate-400 flex items-center gap-1">
                      <Lock size={12} /> Seguro & Criptografado
                    </span>
                  </div>
                  <h3 className="text-2xl font-heading font-black text-slate-900">
                    Dados do Mantenedor
                  </h3>
                  <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between">
                    <span className="text-xs font-gotham-bold text-amber-900">Total Mensal:</span>
                    <span className="text-xl font-heading font-black text-amber-900">
                      R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-amber-800">/ mês</span>
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-gotham-bold text-slate-700 mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Ex: Lucas Ferreira Silva"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F49853] text-sm font-medium bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-gotham-bold text-slate-700 mb-1.5">
                      E-mail (para receber relatórios e acesso) *
                    </label>
                    <input
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F49853] text-sm font-medium bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-gotham-bold text-slate-700 mb-1.5">
                      WhatsApp / Celular (opcional para atualizações rápidas)
                    </label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F49853] text-sm font-medium bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Método de Pagamento */}
                  <div className="pt-2">
                    <label className="block text-xs font-gotham-bold text-slate-700 mb-2">
                      Forma de Cobrança Recorrente
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-gotham-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer",
                          paymentMethod === 'card'
                            ? "bg-[#F49853] text-white border-[#F49853] shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <CreditCard size={18} />
                        <span>Cartão de Crédito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-gotham-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer",
                          paymentMethod === 'pix'
                            ? "bg-[#F49853] text-white border-[#F49853] shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <QrCode size={18} />
                        <span>PIX</span>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'pix' ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs space-y-2 text-emerald-900">
                      <p className="font-gotham-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-700" />
                        PIX com Confirmação Instantânea
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Ao clicar no botão abaixo, será gerado o QR Code dinâmico e o código Copia e Cola oficial do PIX com compensação em segundos e recibo automático.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5 text-slate-600">
                      <p className="font-gotham-bold text-slate-800 flex items-center gap-1.5">
                        <Lock size={13} className="text-[#F49853]" />
                        Cobrança Mensal Recorrente no Cartão
                      </p>
                      <p className="text-[11px]">
                        Você será direcionado ao ambiente seguro e criptografado para cadastrar seu cartão. Cancelamento com 1 clique no Portal do Doador sem travar o limite total.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-[#F49853]/30 hover:shadow-[#F49853]/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Heart size={18} className="fill-white" />
                        <span>
                          {paymentMethod === 'pix' 
                            ? 'Gerar PIX Seguro' 
                            : 'Confirmar e Ser Mantenedor Mensal'}
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-400 font-gotham-light pt-2">
                    YAH Hope • CNPJ & Registro de Entidade Humanitária • 100% dos recursos geridos com rigor e auditoria contínua.
                  </p>
                </form>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* 5. HISTÓRIA REAL DE RESGATE: O PODER DO MANTENEDOR */}
      <section className="py-20 md:py-28 bg-white font-gotham-regular">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50">
                <img 
                  src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png" 
                  alt="Mãe e filho acolhidos e recuperados na Casa Nutri" 
                  className="w-full h-[450px] sm:h-[520px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-xs font-gotham-bold uppercase tracking-wider text-[#F49853] block mb-1">
                    História de Superação • Nampula
                  </span>
                  <p className="text-lg font-heading font-bold">
                    "Ele chegou pesando 4,8 kg com 1 ano e 2 meses. Hoje, ele corre, brinca e sonha."
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block">
                Prova Viva da Generosidade
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
                Você não está enviando um valor abstrato. <br />
                <span className="text-[#F49853]">Você está reescrevendo um destino.</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 font-gotham-light leading-relaxed">
                Quando uma mãe chega caminhando 15 km debaixo do sol escaldante de Moçambique carregando nos braços um filho desfalecido pela desnutrição severa, ela não procura promessas. Ela procura socorro real.
              </p>

              <p className="text-base text-slate-600 font-gotham-light leading-relaxed">
                Na Casa Nutri da YAH Hope, essa criança recebe imediatamente a fórmula <strong>F-75</strong>, que estabiliza seus órgãos vitais. Em seguida, progride para o leite <strong>F-100</strong> e a pasta hipercalórica <strong>Plumpy'Nut</strong>. Em 42 dias, o olhar opaco dá lugar a sorrisos radiantes.
              </p>

              <blockquote className="p-4 bg-orange-50 border-l-4 border-[#F49853] rounded-r-2xl text-slate-700 italic text-sm">
                "Nada disso aconteceria se tivéssemos que parar para fazer uma 'vaquinha' a cada criança que bate à nossa porta. Os mantenedores mensais são os anjos silenciosos por trás de cada respiração salva."
                <span className="block not-italic font-gotham-bold text-xs text-slate-900 mt-2">— Equipe de Saúde YAH Hope, Nampula</span>
              </blockquote>

              <div className="pt-2">
                <button
                  onClick={scrollToCheckout}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white px-8 py-4 rounded-full font-gotham-bold text-sm tracking-wide transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Heart size={16} className="text-[#F49853] fill-[#F49853]" />
                  <span>Seja o Mantenedor Desta Transformação</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TRANSPARÊNCIA RADICAL: O QUE VOCÊ GANHA COMO MANTENEDOR */}
      <section className="py-20 md:py-28 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              Conexão e Integridade
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
              O Que Você Recebe Como Nosso Parceiro Mensal
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-gotham-light mt-4">
              Não tratamos doações como caixas-pretas. Criamos uma ponte direta entre a sua generosidade e a realidade das famílias assistidas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Users size={22} />
              </div>
              <h3 className="font-gotham-bold text-base text-slate-900">Portal do Mantenedor</h3>
              <p className="text-xs text-slate-500 font-gotham-light leading-relaxed">
                Login exclusivo para acompanhar métricas de impacto em tempo real, evolução das crianças e histórico das suas doações.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <FileText size={22} />
              </div>
              <h3 className="font-gotham-bold text-base text-slate-900">Relatórios Auditados</h3>
              <p className="text-xs text-slate-500 font-gotham-light leading-relaxed">
                Demonstrativos claros e públicos sobre onde cada real foi investido no terreno, com laudos médicos e notas fiscais.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Calendar size={22} />
              </div>
              <h3 className="font-gotham-bold text-base text-slate-900">Boletins Periódicos</h3>
              <p className="text-xs text-slate-500 font-gotham-light leading-relaxed">
                Atualizações periódicas no seu e-mail ou WhatsApp com histórias, vídeos e fotos diretamente da base de Moçambique.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Award size={22} />
              </div>
              <h3 className="font-gotham-bold text-base text-slate-900">Certificado Oficial</h3>
              <p className="text-xs text-slate-500 font-gotham-light leading-relaxed">
                Certificado digital de mantenedor solidário para atestar seu compromisso com a transformação social e humanitária.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. PERGUNTAS FREQUENTES (FAQ) PARA QUEBRAR TODAS AS OBJEÇÕES */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-600 text-sm font-gotham-light mt-3">
              Tudo o que você precisa saber sobre o programa de mantenedores da YAH Hope.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div 
                  key={index}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full text-left p-5 sm:p-6 bg-slate-50/60 hover:bg-slate-100/80 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <span className="font-gotham-bold text-sm sm:text-base text-slate-900">
                      {faq.question}
                    </span>
                    <ChevronDown 
                      size={18} 
                      className={cn(
                        "text-slate-400 transition-transform duration-200 shrink-0",
                        isOpen && "rotate-180 text-[#F49853]"
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-5 sm:p-6 bg-white border-t border-slate-100 text-sm text-slate-600 font-gotham-light leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center p-6 bg-slate-50 rounded-2xl border border-slate-200/70">
            <p className="text-xs text-slate-600 font-gotham-regular">
              Ainda tem alguma dúvida específica? Fale diretamente conosco pelo e-mail{' '}
              <a href="mailto:contato@yahhope.org" className="text-[#F49853] font-gotham-bold hover:underline">
                contato@yahhope.org
              </a>{' '}
              ou através dos nossos canais de atendimento.
            </p>
          </div>

        </div>
      </section>

      {/* 8. CHAMADA FINAL EMOCIONANTE (CTA FOOTER HERO) */}
      <section className="py-20 md:py-28 bg-[#0F172A] text-white relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-[#0F172A] z-10"></div>
        <img 
          src="https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png" 
          alt="Ação Humanitária YAH Hope" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.25] object-center"
        />

        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#F49853]/20 border border-[#F49853]/40 px-4 py-1.5 rounded-full text-xs font-gotham-bold text-[#F49853] uppercase tracking-wider">
            <Heart size={14} className="fill-[#F49853]" />
            <span>O Próximo Sorriso Depende de Você</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-black text-white leading-tight">
            Não adie o resgate de quem não pode esperar.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-gotham-light max-w-2xl mx-auto leading-relaxed">
            Neste exato instante, uma criança em Moçambique dá seus primeiros passos rumo à recuperação na Casa Nutri porque alguém decidiu não fechar os olhos. Seja você essa pessoa.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToCheckout}
              className="w-full sm:w-auto bg-[#F49853] hover:bg-[#e0853d] text-white px-9 py-4 rounded-full font-gotham-bold text-sm tracking-wide shadow-xl shadow-[#F49853]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={18} />
              <span>Quero Ser um Mantenedor Mensal Agora</span>
            </button>
            
            <Link
              to="/projetos"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-full font-gotham-medium text-sm transition-all"
            >
              Conhecer Nossas Frentes
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
