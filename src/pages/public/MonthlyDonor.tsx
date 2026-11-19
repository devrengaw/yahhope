import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { useAuth } from '../../contexts/AuthContext';
import { sponsorshipService, SponsorshipMetrics, ChildSponsorshipDetail } from '../../services/sponsorshipService';
import { cn } from '../../lib/utils';
import { MonthlySupporterCounterCard } from '../../components/public/MonthlySupporterCounterCard';
import { getUniqueMonthlySupportersCount } from '../../services/monthlySupportersService';
import { submitCampaignLead } from '../../services/campaignTrackingService';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { tr, isEn } = useLanguage();
  const [searchParams] = useSearchParams();
  const urlAmount = searchParams.get('amount');
  const urlMode = searchParams.get('mode');
  const urlQuotas = searchParams.get('quotas');
  const urlMethod = searchParams.get('method');
  const urlMonths = searchParams.get('months');
  const urlRenewChildId = searchParams.get('renewChildId') || undefined;
  const isSuccessUrl = searchParams.get('status') === 'success';
  const urlName = searchParams.get('name') || '';
  const urlEmail = searchParams.get('email') || '';
  const urlWhatsapp = searchParams.get('whatsapp') || '';

  const { user } = useAuth();
  const { activeCampaign, campaign: defaultCamp, createDonation } = useFundraising();
  const currentCampaign = activeCampaign || defaultCamp;

  // Modalidade de Contribuição: 'sponsorship' (Apadrinhar Criança) ou 'general' (Mantenedor Geral do Projeto)
  const [donationType, setDonationType] = useState<'sponsorship' | 'general'>(
    urlMode === 'general' ? 'general' : 'sponsorship'
  );

  // Métricas e Estado do Apadrinhamento
  const [sponsorshipMetrics, setSponsorshipMetrics] = useState<SponsorshipMetrics | null>(null);
  const [quotasCount, setQuotasCount] = useState<number>(
    urlQuotas && !isNaN(parseInt(urlQuotas, 10)) ? Math.max(1, Math.min(4, parseInt(urlQuotas, 10))) : 1
  );
  const [pixPackageMonths, setPixPackageMonths] = useState<3 | 6 | 12>(() => {
    const parsedM = urlMonths ? parseInt(urlMonths, 10) : 6;
    return parsedM === 3 || parsedM === 6 || parsedM === 12 ? parsedM : 6;
  });
  const [assignedChildren, setAssignedChildren] = useState<ChildSponsorshipDetail[]>([]);
  const [confirmedExpiresAt, setConfirmedExpiresAt] = useState<string | null>(null);

  // Estado do Seletor de Mantenedor Geral
  const [selectedPlanId, setSelectedPlanId] = useState<string>('guardiao');
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Carrega métricas e parâmetros de apadrinhamento
  useEffect(() => {
    sponsorshipService.getMetrics().then(m => {
      setSponsorshipMetrics(m);
    });
  }, []);

  // Carrega contagem oficial de apoiadores mensais únicos (Mantenedores + Padrinhos)
  const [uniqueSupportersCount, setUniqueSupportersCount] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    getUniqueMonthlySupportersCount().then(total => {
      if (mounted) setUniqueSupportersCount(total);
    });
    return () => { mounted = false; };
  }, []);

  // Sincroniza plano ou valor vindo da URL
  useEffect(() => {
    if (urlMethod === 'pix') {
      setPaymentMethod('pix');
    } else if (urlMethod === 'card') {
      setPaymentMethod('card');
    }
    if (urlMonths) {
      const m = parseInt(urlMonths, 10);
      if (m === 3 || m === 6 || m === 12) {
        setPixPackageMonths(m);
      }
    }

    if (urlMode === 'sponsorship') {
      setDonationType('sponsorship');
      if (urlQuotas) {
        const parsedQ = parseInt(urlQuotas, 10);
        if (!isNaN(parsedQ) && parsedQ >= 1 && parsedQ <= 4) {
          setQuotasCount(parsedQ);
        }
      }
      return;
    }

    if (urlAmount) {
      setDonationType('general');
      const parsed = parseFloat(urlAmount);
      if (!isNaN(parsed) && parsed > 0) {
        const matchingPlan = PLANS.find(p => p.amount === parsed);
        if (matchingPlan) {
          setSelectedPlanId(matchingPlan.id);
          setIsCustom(false);
        } else {
          setIsCustom(true);
          setCustomAmount(parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }

        setTimeout(() => {
          const el = document.getElementById('adesao-mantenedor');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      }
    }
  }, [urlAmount, urlMode, urlQuotas, urlMethod, urlMonths]);

  // Formulário do Doador / Padrinho
  const [donorName, setDonorName] = useState(urlName || user?.name || '');
  const [donorEmail, setDonorEmail] = useState(urlEmail || user?.email || '');
  const [donorPhone, setDonorPhone] = useState(urlWhatsapp || user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>(urlMethod === 'pix' ? 'pix' : 'card');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    if (user) {
      if (user.name && !donorName) setDonorName(user.name);
      if (user.email && !donorEmail) setDonorEmail(user.email);
      if (user.phone && !donorPhone) setDonorPhone(user.phone);
    }
  }, [user]);

  // Cálculos de Valor
  const quotaCost = sponsorshipMetrics?.quotaCost || 90;
  const sponsorshipMonthlyTotal = quotasCount * quotaCost;
  const sponsorshipTotal = paymentMethod === 'pix'
    ? sponsorshipMonthlyTotal * pixPackageMonths
    : sponsorshipMonthlyTotal;
  const generalTotal = isCustom 
    ? (parseFloat(customAmount.replace(/\./g, '').replace(',', '.')) || 0)
    : (PLANS.find(p => p.id === selectedPlanId)?.amount || 100);

  const currentAmount = donationType === 'sponsorship' ? sponsorshipTotal : generalTotal;

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

    const finalName = donorName.trim() || user?.name || '';
    const finalEmail = donorEmail.trim() || user?.email || '';
    const finalPhone = donorPhone.trim() || user?.phone || '';

    if (!user && (!finalName || !finalEmail)) {
      alert(tr('Por favor, preencha seu nome e e-mail.', 'Please fill in your name and email.'));
      return;
    }

    if (currentAmount < 10) {
      alert(tr('O valor mínimo de contribuição mensal é de R$ 10,00.', 'The minimum monthly contribution amount is R$ 10.00.'));
      return;
    }

    setIsLoading(true);

    try {
      const effectivePlanMonths = donationType === 'sponsorship' && paymentMethod === 'pix' ? pixPackageMonths : 1;

      // Salva/atualiza o lead na tabela de retornos da campanha
      submitCampaignLead({
        name: finalName || 'Mantenedor YAH Hope',
        email: finalEmail,
        phone: finalPhone,
        age_range: '25-34',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        interest_type: 'sponsor',
        status: 'joined',
        message: donationType === 'sponsorship'
          ? (paymentMethod === 'pix'
            ? `Apadrinhamento PIX (${pixPackageMonths} meses): ${quotasCount} ${quotasCount === 1 ? 'criança' : 'crianças'} (Total R$ ${currentAmount})`
            : `Apadrinhamento: ${quotasCount} ${quotasCount === 1 ? 'criança' : 'crianças'} (R$ ${currentAmount}/mês)`)
          : `Mantenedor Mensal (R$ ${currentAmount}/mês)`
      }).catch(() => {});

      // REGRA: Crianças em múltiplos inteiros de R$ 90 mensais (apenas para Cartão).
      // Em pacote PIX de 3, 6 ou 12 meses, usa quotasCount diretamente e NÃO entra na regra dos R$ 90,00!
      const calculatedQuotas = donationType === 'sponsorship'
        ? quotasCount
        : (paymentMethod === 'pix' ? 0 : Math.floor(currentAmount / 90));

      const isStripeCheckout = paymentMethod !== 'pix' && Boolean(import.meta.env.VITE_SUPABASE_URL);

      // 1. Caso seja Apadrinhamento de Criança via PIX (Pacotes 3, 6 ou 12 meses) ou ambiente sem Stripe
      if (donationType === 'sponsorship' && !isStripeCheckout) {
        const result = await sponsorshipService.assignChildrenToSponsor({
          donorName: finalName,
          donorEmail: finalEmail,
          donorPhone: finalPhone,
          quotasCount: calculatedQuotas,
          amountPerQuota: quotaCost,
          amount: currentAmount,
          paymentMethod,
          planMonths: effectivePlanMonths,
          renewChildId: urlRenewChildId,
          sponsorUserId: user?.id
        });

        if (result.success) {
          setAssignedChildren(result.assignedChildren);
          setConfirmedExpiresAt(result.expiresAt || null);
          if (createDonation && currentCampaign) {
            createDonation({
              campaign_id: currentCampaign.id,
              donor_name: finalName,
              donor_email: finalEmail,
              amount: result.totalAmount || currentAmount,
              payment_method: paymentMethod === 'pix' ? 'pix' : 'cartao_mensal'
            });
          }
          setIsLoading(false);
          setIsSuccess(true);
          return;
        } else {
          alert(result.message || result.error || tr('Erro ao processar apadrinhamento', 'Error processing sponsorship'));
          setIsLoading(false);
          return;
        }
      }

      // Se for Mantenedor Geral via PIX ou sem Stripe
      if (donationType !== 'sponsorship' && !isStripeCheckout) {
        // Doações via PIX não entram na regra dos R$ 90,00
        if (paymentMethod !== 'pix' && currentAmount >= 90) {
          try {
            const numChildren = Math.floor(currentAmount / 90);
            const assignRes = await sponsorshipService.assignChildrenToSponsor({
              donorName: finalName,
              donorEmail: finalEmail,
              donorPhone: finalPhone,
              quotasCount: numChildren,
              amountPerQuota: 90,
              amount: currentAmount,
              paymentMethod,
              sponsorUserId: user?.id
            });
            if (assignRes.success && assignRes.assignedChildren.length > 0) {
              setAssignedChildren(assignRes.assignedChildren);
            }
          } catch (e) {
            console.warn('Aviso ao atribuir crianças da doação de mantenedor:', e);
          }
        } else {
          // Apoio Geral (< R$ 90) via PIX: envia o e-mail de acesso ao Portal do Mantenedor
          await sponsorshipService.sendMaintainerAccessEmail(
            finalEmail,
            finalName,
            currentAmount,
            paymentMethod
          );
        }

        if (createDonation && currentCampaign) {
          createDonation({
            campaign_id: currentCampaign.id,
            donor_name: finalName,
            donor_email: finalEmail,
            amount: currentAmount,
            payment_method: paymentMethod === 'pix' ? 'pix' : 'cartao_mensal'
          });
        }
        setIsLoading(false);
        setIsSuccess(true);
        return;
      }

      // 2. Caso seja Mantenedor Geral do Projeto
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      
      if (!supabaseUrl) {
        setTimeout(() => {
          if (createDonation && currentCampaign) {
            createDonation({
              campaign_id: currentCampaign.id,
              donor_name: finalName,
              donor_email: finalEmail,
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
          paymentMethod,
          donorName: finalName,
          donorEmail: finalEmail,
          successUrl: `${window.location.origin}/mantenedor?status=success&amount=${currentAmount}&name=${encodeURIComponent(finalName)}&email=${encodeURIComponent(finalEmail)}`,
          cancelUrl: `${window.location.origin}/mantenedor?status=cancel`
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        if (createDonation && currentCampaign) {
          createDonation({
            campaign_id: currentCampaign.id,
            donor_name: finalName,
            donor_email: finalEmail,
            amount: currentAmount,
            payment_method: paymentMethod === 'pix' ? 'pix' : 'cartao_mensal'
          });
        }
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

  const localizedPlans = isEn
    ? [
        {
          id: 'essencial',
          amount: 50,
          dailyEstimate: 'R$ 1.66 / day',
          title: 'Essential Nutrition',
          tagline: 'The basic lifeline that keeps a child safe from acute hunger.',
          impact: [
            'Provides daily nutritional formulas (therapeutic milk and supplements)',
            'Weekly medical checkups at Casa Nutri in Nampula',
            'Monthly medical progress reports in the Supporter Portal'
          ]
        },
        {
          id: 'guardiao',
          amount: 100,
          dailyEstimate: 'R$ 3.33 / day',
          popular: true,
          badge: 'Most Popular',
          title: 'Guardian of Life',
          tagline: 'Intensive treatment that rescues and sustains the whole family.',
          impact: [
            'Complete intensive treatment for recovery from severe malnutrition',
            'Food basket and continuous nutritional support for the child’s mother',
            'Access to essential medicines, lab tests, and regular weigh-ins',
            'VIP access to the Supporter Portal with letters and firsthand updates'
          ]
        },
        {
          id: 'integral',
          amount: 200,
          dailyEstimate: 'R$ 6.66 / day',
          title: 'Full Transformation',
          tagline: 'Nutritional rescue + University Scholarship Fund for youth.',
          impact: [
            'Sustains clinical nutritional rescue for up to 2 children per month',
            'Directly contributes to the University Scholarship Fund in Mozambique',
            'Self-reliance and agricultural training workshops for community mothers',
            'Official digital certificate of YAH Hope Strategic Supporter'
          ]
        },
        {
          id: 'alianca',
          amount: 500,
          dailyEstimate: 'R$ 16.60 / day',
          badge: 'Community Impact',
          title: 'Alliance of Hope',
          tagline: 'Vital infrastructure, clean water well drilling, and expansion.',
          impact: [
            'Funds imported clinical supplies for Casa Nutri (F-75, F-100, Plumpy\'Nut)',
            'Preventive maintenance and drilling of clean water wells in villages',
            'Care for extreme medical emergencies and hospitalizations',
            'Direct channel with field leadership and exclusive accountability briefings'
          ]
        }
      ]
    : PLANS;

  const localizedFaqs = isEn
    ? [
        {
          question: 'Why is monthly support more transformative than a one-time donation?',
          answer: 'Children suffering from severe acute malnutrition require a clinical protocol lasting 45 to 90 continuous days. If we relied solely on one-off donations, we would not know if we had therapeutic formulas for the following week. Your monthly commitment is the lifeline that keeps our medical team’s doors open every day, allowing us to plan supplies and never turn away a desperate mother.'
        },
        {
          question: 'How does monthly Credit Card billing work?',
          answer: 'Billing is automatic and 100% secure each month. The amount is charged as a monthly subscription without tying up your credit card’s total limit (only the monthly installment is charged).'
        },
        {
          question: 'Can I become a monthly supporter using PIX?',
          answer: 'Yes! You can make your monthly contribution via PIX using our official key (contato@yahhope.org) or by scanning the QR Code generated on this page. We recommend enabling recurring scheduled PIX in your banking app so your gift happens automatically every month.'
        },
        {
          question: 'How can I track where my contribution goes?',
          answer: 'Transparency is a non-negotiable value at YAH Hope. As a supporter, you receive access to the Supporter Portal, where you can follow children’s progress reports, field photos, impact statements, and exclusive news. We also send periodic updates via email and WhatsApp.'
        },
        {
          question: 'Can I cancel, pause, or change my contribution amount anytime?',
          answer: 'Absolutely. No forced lock-in, no bureaucracy, and no hassle. You can adjust the amount or cancel your monthly subscription anytime with one click in the Supporter Portal or by emailing our team at contato@yahhope.org.'
        },
        {
          question: 'Can my company become a corporate supporter?',
          answer: 'Yes! We have a dedicated program for companies and corporate alliances, issuing institutional receipts and ESG / corporate social responsibility reports. Contact us at contato@yahhope.org to learn about our corporate projects.'
        }
      ]
    : FAQS;

  return (
    <div className="min-h-screen bg-white font-gotham-regular text-slate-800">
      <SEO 
        title={tr('Seja um Mantenedor Mensal e Apadrinhe | YAH Hope', 'Become a Monthly Supporter & Sponsor | YAH Hope')}
        description={tr(
          'Junte-se à família de mantenedores mensais da YAH Hope. Sua fidelidade salva vidas todos os dias, combate a desnutrição infantil e constrói futuro em Moçambique e no Brasil.',
          'Join the YAH Hope family of monthly supporters. Your faithfulness saves lives every day, fights child malnutrition, and builds a future in Mozambique and Brazil.'
        )}
        keywords="mantenedor mensal YAH Hope, doar mensalmente ONG, combater desnutrição Moçambique, apadrinhar criança, doação recorrente"
        canonical="https://yahhope.com/mantenedor"
        ogImage="https://yahhope.com/mantenedor_hero_novo.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": localizedFaqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        }}
      />

      {/* 1. SEÇÃO UNIFICADA: HERO & DOAÇÃO DO MANTENEDOR (LOGO APÓS O HEADER) */}
      <section id="adesao-mantenedor" className="relative pt-12 pb-20 md:pt-18 md:pb-28 bg-[#0F172A] text-white overflow-hidden scroll-mt-20">
        {/* Background visual imersivo com as crianças */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/mantenedor_hero_novo.jpg" 
            alt="Crianças jogando futebol acolhidas pela YAH Hope" 
            fetchPriority="high"
            className="w-full h-full object-cover object-[15%_25%] sm:object-[20%_25%] filter brightness-[0.92] contrast-105 scale-100 transition-transform duration-1000"
          />
          {/* Gradientes equilibrados: foto nítida e destacada à esquerda com contraste para o formulário à direita */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/45 to-[#0F172A]/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/25 via-transparent to-[#0F172A]/85"></div>
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Cabeçalho Unificado: Proposta de Valor e Emoção */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block drop-shadow-md">
              {tr('Comunidade de Mantenedores • Transforme Vidas Mensalmente', 'Supporters Community • Transform Lives Monthly')}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight text-white leading-[1.12] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {tr('Sua doação ', 'Your gift ')}<br className="hidden sm:inline" />
              <span className="text-[#F49853]">{tr('mantém a esperança viva', 'keeps hope alive')}</span>.
            </h1>
            <p className="text-base sm:text-lg text-slate-100 font-gotham-light leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {tr(
                'A esperança ganha forma através de cada gesto de amor contínuo. Ao se tornar um mantenedor, você garante nutrição diária, atendimento médico e um novo futuro para crianças e famílias em Moçambique e no Brasil.',
                'Hope takes shape through every act of ongoing love. By becoming a monthly supporter, you provide daily nutrition, medical care, and a new future for children and families in Mozambique and Brazil.'
              )}
            </p>

            {/* Métricas Rápidas de Impacto e Confiança */}
            <div className="py-3 grid grid-cols-3 gap-3 sm:gap-6 border-y border-white/20 max-w-xl mx-auto backdrop-blur-sm">
              <div>
                <p className="text-xl sm:text-3xl font-black text-white drop-shadow-md">
                  {uniqueSupportersCount !== null ? uniqueSupportersCount : '...'}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-200 font-gotham-medium mt-0.5 drop-shadow-sm">{tr('Apoiadores Mensais', 'Monthly Supporters')}</p>
              </div>
              <div>
                <p className="text-xl sm:text-3xl font-black text-[#92BF78] drop-shadow-md">100%</p>
                <p className="text-[11px] sm:text-xs text-slate-200 font-gotham-medium mt-0.5 drop-shadow-sm">{tr('Gestão Auditada', 'Audited Stewardship')}</p>
              </div>
              <div>
                <p className="text-xl sm:text-3xl font-black text-[#F49853] drop-shadow-md">R$ 1,66</p>
                <p className="text-[11px] sm:text-xs text-slate-200 font-gotham-medium mt-0.5 drop-shadow-sm">{tr('Ao dia para mudar tudo', 'A day to change everything')}</p>
              </div>
            </div>

            {/* Alternador de Modalidade: Apadrinhar Criança vs Mantenedor Geral */}
            <div className="pt-2 inline-flex flex-wrap sm:flex-nowrap justify-center bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-xl max-w-full">
              <button
                type="button"
                onClick={() => setDonationType('sponsorship')}
                className={cn(
                  "px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs font-gotham-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                  donationType === 'sponsorship'
                    ? "bg-[#F49853] text-white shadow-lg shadow-[#F49853]/25 scale-[1.02]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Heart size={16} className={donationType === 'sponsorship' ? "fill-white" : ""} />
                <span>{tr('Apadrinhar Criança', 'Sponsor a Child')}</span>
                {sponsorshipMetrics?.isFullySponsored && (
                  <span className="ml-1 text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                    {tr('100% Acolhidas', '100% Sponsored')}
                  </span>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setDonationType('general')}
                className={cn(
                  "px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs font-gotham-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                  donationType === 'general'
                    ? "bg-white text-slate-900 shadow-lg scale-[1.02]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Users size={16} />
                <span>{tr('Mantenedor Geral (Projeto)', 'General Supporter (Project)')}</span>
              </button>
            </div>
          </div>

          {(isSuccess || isSuccessUrl) ? (
            /* Tela de Confirmação & Boas-Vindas */
            <div className="max-w-2xl mx-auto bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-200 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <Heart size={44} className="fill-emerald-600" />
              </div>
              
              <span className="text-xs font-gotham-bold text-emerald-600 uppercase tracking-widest block mb-2">
                {tr('Gratidão Imensa • Aliança Firmada', 'Deepest Gratitude • Covenant Established')}
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 mb-3">
                {tr(`Bem-vindo à Família YAH Hope, ${donorName || urlName || 'Apoiador'}!`, `Welcome to the YAH Hope Family, ${donorName || urlName || 'Supporter'}!`)}
              </h3>
              
              <p className="text-slate-600 text-base leading-relaxed mb-6 font-gotham-light">
                {donationType === 'sponsorship' && paymentMethod === 'pix' ? (
                  <>
                    {tr('O seu pacote de apadrinhamento de ', 'Your sponsorship package of ')}<strong>{pixPackageMonths} {tr('meses', 'months')} (R$ {(urlAmount ? parseFloat(urlAmount) : currentAmount).toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })})</strong>{tr(' já está registrado! Você acompanhará a criança durante todos os ', ' is now registered! You will follow your child’s progress for all ')}{pixPackageMonths}{tr(' meses.', ' months.')}
                  </>
                ) : (
                  <>
                    {tr('O seu compromisso mensal de ', 'Your monthly commitment of ')}<strong>R$ {(urlAmount ? parseFloat(urlAmount) : currentAmount).toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}</strong>{tr(' já está transformando vidas na Casa Nutri e garantindo alimentação e atendimento clínico de qualidade.', ' is already transforming lives at Casa Nutri, providing nutrition and quality clinical care.')}
                  </>
                )}
              </p>

              {/* Revelação das Crianças Atribuídas pelo Algoritmo */}
              {assignedChildren.length > 0 && (
                <div className="my-6 p-6 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-left space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-gotham-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#F49853]" />
                      {tr('Sua(s) Criança(s) Apadrinhada(s)', 'Your Sponsored Child(ren)')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {paymentMethod === 'pix' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-black">
                          {tr(`Pacote PIX ${pixPackageMonths} Meses`, `PIX ${pixPackageMonths}-Month Package`)} {confirmedExpiresAt ? `• ${tr('Até', 'Until')} ${new Date(confirmedExpiresAt).toLocaleDateString(isEn ? 'en-US' : 'pt-BR')}` : ''}
                        </span>
                      )}
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black">
                        {assignedChildren.length} {assignedChildren.length === 1 ? tr('Cota Atribuída', 'Share Assigned') : tr('Cotas Atribuídas', 'Shares Assigned')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {assignedChildren.map(child => (
                      <div key={child.id} className="bg-white p-4 rounded-xl border border-amber-200/60 shadow-sm flex items-center gap-4">
                        <img 
                          src={child.photo_url} 
                          alt={child.name} 
                          className="w-16 h-16 rounded-xl object-cover border-2 border-[#F49853] shrink-0" 
                        />
                        <div>
                          <h4 className="font-heading font-black text-slate-900 text-lg">{child.name}</h4>
                          <p className="text-xs text-[#F49853] font-gotham-bold">{child.ageText} • {child.community}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{child.story}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/60 text-xs text-amber-950 font-medium">
                    ✉️ <strong>{tr('Perfil Completo Enviado:', 'Full Profile Sent:')}</strong> {tr('Enviamos para', 'We sent to')} <strong>{donorEmail}</strong> {tr('o e-mail oficial com a história detalhada, dados médicos e fotos de cada criança!', 'the official email with the detailed story, medical updates, and photos of each child!')}
                  </div>
                </div>
              )}

              {paymentMethod === 'pix' && !isSuccessUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-gotham-bold text-sm text-slate-800">
                      {tr('Próximo Passo: Concluir seu PIX', 'Next Step: Complete your PIX')} {donationType === 'sponsorship' ? `(${pixPackageMonths} ${tr('Meses', 'Months')})` : ''}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded font-gotham-bold">
                      Total: R$ {currentAmount.toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pixCopyPaste)}`}
                      alt="QR Code PIX"
                      className="w-32 h-32 rounded-xl border border-slate-100 p-1.5 shrink-0"
                    />
                    <div className="flex-1 w-full space-y-2.5">
                      <p className="text-xs text-slate-500">
                        {tr('Escaneie o QR Code no aplicativo do seu banco ou copie a chave PIX abaixo para transferir ', 'Scan the QR Code in your banking app or copy the PIX key below to transfer ')}<strong>R$ {currentAmount.toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}</strong>:
                      </p>
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-xs sm:text-sm font-mono text-slate-700 font-bold truncate mr-2">{pixKey}</span>
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {pixCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          <span>{pixCopied ? tr('Chave Copiada!', 'Key Copied!') : tr('Copiar Chave', 'Copy Key')}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    {donationType === 'sponsorship' ? (
                      <>
                        <p className="font-gotham-bold text-slate-700">{tr(`Como funciona a vigência do seu pacote (${pixPackageMonths} meses):`, `How your ${pixPackageMonths}-month package works:`)}</p>
                        <p>
                          {tr(
                            `Você não perde acesso na virada de cada mês. Seu apadrinhamento fica ativo durante todos os ${pixPackageMonths} meses. Ao final do período, você receberá um aviso caso queira renovar; se optar por não continuar com a criança, você continuará tendo acesso normal ao sistema e às atualizações gerais do projeto!`,
                            `You do not lose access at the turn of each month. Your sponsorship remains active for all ${pixPackageMonths} months. At the end of the period, you will receive a reminder to renew; if you choose not to continue, you will still keep access to the portal and general project updates.`
                          )}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-gotham-bold text-slate-700">{tr('Dica para doação automática:', 'Tip for automatic monthly giving:')}</p>
                        <p>{tr('No aplicativo do seu banco, ative o Agendamento Mensal ou repita este PIX todo mês no dia que preferir.', 'In your banking app, enable Monthly Scheduling to repeat this PIX automatically each month.')}</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Convite para cadastro no Portal caso não tenha login */}
              {!user ? (
                <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-6 mb-6 text-left">
                  <div className="flex items-center gap-2 text-orange-800 font-gotham-bold text-xs uppercase tracking-wider mb-1.5">
                    <Heart size={14} className="fill-[#F49853] text-[#F49853]" />
                    <span>{tr('Portal do Mantenedor', 'Supporter Portal')}</span>
                  </div>
                  <h3 className="font-heading font-black text-slate-900 text-lg mb-1">
                    {tr('Deseja criar seu acesso agora?', 'Would you like to create your account now?')}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 font-gotham-light">
                    {tr(
                      'No portal você acompanha em tempo real as novidades exclusivas da sua criança apadrinhada, fotos de campo e relatórios nutricionais.',
                      'In the portal, you can follow real-time updates on your sponsored child, field photos, and nutritional reports.'
                    )}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Link
                      to={`/login?tab=register&email=${encodeURIComponent(donorEmail || urlEmail)}&name=${encodeURIComponent(donorName || urlName)}`}
                      className="w-full sm:w-auto flex-1 bg-[#F49853] hover:bg-[#e0853d] text-white text-xs font-gotham-bold uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2"
                    >
                      <Users size={16} />
                      <span>{tr('Sim, Quero Criar Minha Senha', 'Yes, Create My Password')}</span>
                    </Link>
                    <Link
                      to="/"
                      className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-600 text-xs font-gotham-medium py-3.5 px-6 rounded-xl border border-slate-200 text-center transition-colors"
                    >
                      {tr('Não, continuar sem cadastro', 'No, continue without an account')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/portal/dashboard"
                    className="w-full sm:w-auto bg-[#F49853] hover:bg-[#e0853d] text-white px-8 py-3.5 rounded-full font-gotham-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Users size={16} />
                    <span>{tr('Acessar Portal do Mantenedor', 'Access Supporter Portal')}</span>
                  </Link>
                  <Link
                    to="/"
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-full font-gotham-medium text-sm transition-all text-center"
                  >
                    {tr('Voltar ao Início', 'Back to Home')}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Formulário Principal de Escolha de Planos e Pagamento */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Coluna Esquerda: Conteúdo Dinâmico por Modalidade (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6">

                {/* Contador Oficial de Mantenedores e Padrinhos Mensais */}
                <MonthlySupporterCounterCard 
                  theme="dark" 
                  className="border-white/15 bg-slate-900/85 backdrop-blur-md shadow-xl" 
                />

                {/* CENÁRIO A: APADRINHAMENTO DE CRIANÇA */}
                {donationType === 'sponsorship' ? (
                  sponsorshipMetrics?.isFullySponsored ? (
                    /* Banner de Lotação / 100% das Cotas Preenchidas */
                    <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-8 sm:p-10 text-white shadow-2xl border border-emerald-400/30 text-center space-y-6">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-yellow-300 shadow-inner">
                        <Award size={36} />
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-200 bg-white/10 px-3.5 py-1.5 rounded-full inline-block">
                          {tr('Meta de Cuidado Atingida • 100% Acolhidas!', 'Care Goal Reached • 100% Sponsored!')}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-heading font-black text-white">
                          {tr('Todas as Nossas Crianças Foram Apadrinhadas! 🎉', 'All Our Children Have Been Sponsored! 🎉')}
                        </h3>
                      </div>

                      <p className="text-emerald-100 text-sm sm:text-base leading-relaxed font-gotham-light max-w-lg mx-auto">
                        {tr(
                          'Graças a padrinhos fiéis, todas as crianças atualmente acolhidas na Casa Nutri atingiram sua rede completa de cotas mensais.',
                          'Thanks to faithful sponsors, all children currently cared for at Casa Nutri have reached their full monthly support network.'
                        )}
                      </p>

                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-left space-y-3">
                        <h4 className="font-gotham-bold text-sm text-yellow-300">
                          {tr('Como você pode ajudar agora?', 'How can you help right now?')}
                        </h4>
                        <p className="text-xs text-white/90 leading-relaxed font-gotham-light">
                          {tr(
                            'Temos uma longa fila de espera de aldeias vizinhas precisando de resgate. Ao se tornar um Mantenedor Mensal Global, você financia a abertura de novas vagas, expansão da equipe médica e compra de novos leites terapêuticos.',
                            'We have a long waiting list from neighboring villages in need of rescue. By becoming a Global Monthly Supporter, you fund new spots, medical team expansion, and therapeutic milk supplies.'
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDonationType('general')}
                        className="bg-white text-emerald-900 hover:bg-emerald-50 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                      >
                        <Heart size={18} className="fill-emerald-900" />
                        <span>{tr('Quero Ser Mantenedor Mensal Global', 'Become a Global Monthly Supporter')}</span>
                      </button>
                    </div>
                  ) : (
                    /* Seleção de Cotas de Apadrinhamento */
                    <div className="space-y-6">
                      {/* Explicação da Distribuição Equitativa e Cega */}
                      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-600/10 border-2 border-[#F49853]/40 rounded-3xl p-6 text-slate-200 space-y-3">
                        <div className="flex items-center gap-2 text-[#F49853] font-gotham-bold text-xs uppercase tracking-wider">
                          <Sparkles size={16} />
                          <span>{tr('Distribuição Solidária e Justa', 'Fair & Solidarity-Based Distribution')}</span>
                        </div>
                        <h4 className="text-lg font-heading font-black text-white">
                          {tr('Como funciona a alocação do seu afilhado?', 'How is your sponsored child assigned?')}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-gotham-light">
                          {tr(
                            'Para garantir que nenhuma criança fique desassistida e que todas recebam apoio de forma homogênea, nossa equipe médica distribui os novos padrinhos priorizando as crianças com menor rede de apoio ativa.',
                            'To ensure no child is left behind and that every child receives balanced support, our medical team assigns new sponsors by prioritizing children with the smallest active support network.'
                          )}
                        </p>
                        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs text-amber-200 font-medium">
                          💌 <strong>{tr('Surpresa Especial:', 'Special Surprise:')}</strong> {tr('Logo após a confirmação, você receberá por e-mail a foto, história e o perfil completo da criança que seu coração acaba de acolher!', 'Right after confirmation, you will receive by email the photo, story, and full profile of the child you have just welcomed!')}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  /* CENÁRIO B: MANTENEDOR DO PROJETO (DOAÇÃO GERAL) */
                  <div className="space-y-4">
                    <p className="text-xs font-gotham-bold uppercase tracking-wider text-slate-400 mb-2">
                      {tr('1. Selecione o Plano de Mantenedor Mensal Global', '1. Select Your Global Monthly Supporter Plan')}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {localizedPlans.map((plan) => {
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
                                  <span className="text-xs text-slate-400 font-gotham-light"> {tr('/ mês', '/ mo')}</span>
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
                            <span className="font-gotham-bold text-white text-sm block">{tr('Definir Outro Valor Mensal', 'Set Another Monthly Amount')}</span>
                            <span className="text-xs text-slate-400 font-gotham-light">{tr('Qualquer contribuição mensal gera impacto imediato', 'Any monthly contribution creates immediate impact')}</span>
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
                        {tr('Compromisso de Transparência YAH Hope:', 'YAH Hope Transparency Commitment:')}
                      </span>
                      <p className="leading-relaxed font-gotham-light">
                        {tr('Sua contribuição mensal de ', 'Your monthly contribution of ')}<strong>R$ {currentAmount.toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}</strong>{tr(' financia a equipe médica, compra de insumos clínicos, perfuração de poços e sustentação da Casa Nutri.', ' funds our medical team, clinical supplies, water well drilling, and Casa Nutri operations.')}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Formulário de Identificação & Pagamento (Coluna Direita lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
                {/* Seletor de Modalidade dentro da Caixa de Doação (como nos outros lugares) */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-2 text-xs font-gotham-bold">
                  <button
                    type="button"
                    onClick={() => setDonationType('sponsorship')}
                    className={cn(
                      "py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer",
                      donationType === 'sponsorship'
                        ? "bg-[#F49853] text-white shadow-md"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Heart size={13} fill={donationType === 'sponsorship' ? "currentColor" : "none"} />
                    <span>{tr('Apadrinhamento', 'Sponsorship')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDonationType('general')}
                    className={cn(
                      "py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer",
                      donationType === 'general'
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Users size={13} />
                    <span>{tr('Mantenedor', 'Supporter')}</span>
                  </button>
                </div>

                <p className="text-center text-[11px] text-slate-500 mb-3 font-gotham-regular min-h-[1.25rem] flex items-center justify-center">
                  {donationType === 'sponsorship' ? (
                    <span>{tr(`Cotas de R$ ${quotaCost}/mês • `, `Shares of R$ ${quotaCost}/mo • `)}<strong className="font-gotham-bold text-[#F49853]">{tr('Alocação justa e perfil por e-mail', 'Fair allocation & profile via email')}</strong></span>
                  ) : (
                    <span>{tr('Recorrência mensal que sustenta o ', 'Monthly recurring support that sustains the ')}<strong className="font-gotham-bold text-slate-900">{tr('custo global do projeto', 'overall project cost')}</strong></span>
                  )}
                </p>

                {/* QUANTIDADE DE CRIANÇAS DENTRO DA CAIXA DE DOAÇÃO (COMO NOS OUTROS LUGARES) */}
                {donationType === 'sponsorship' && (
                  <div className="space-y-2.5 mb-4 animate-fade-in">
                        <div className="text-[11px] font-gotham-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                          <span>{tr('Quantas crianças apadrinhar:', 'How many children to sponsor:')}</span>
                          <span className="text-[#F49853]">{tr(`R$ ${quotaCost}/mês por cota`, `R$ ${quotaCost}/mo per share`)}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((q) => {
                            const isSelected = quotasCount === q;
                            const total = q * quotaCost;
                            return (
                              <button
                                key={q}
                                type="button"
                                onClick={() => setQuotasCount(q)}
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

                        <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 leading-snug flex items-center gap-2">
                          <Sparkles size={14} className="text-[#F49853] shrink-0" />
                          <span>{tr('Distribuição justa: o perfil do afilhado é enviado após a confirmação.', 'Fair distribution: your sponsored child’s profile is sent after confirmation.')}</span>
                        </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-gotham-bold uppercase tracking-wider text-[#F49853]">{tr('Passo Final', 'Final Step')}</span>
                    <span className="text-xs font-gotham-medium text-slate-400 flex items-center gap-1">
                      <Lock size={12} /> {tr('Seguro & Criptografado', 'Secure & Encrypted')}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900">
                    {donationType === 'sponsorship' ? tr('Seus Dados de Padrinho', 'Your Sponsor Details') : tr('Dados do Mantenedor', 'Supporter Details')}
                  </h3>
                  <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-gotham-bold text-amber-900 block">
                        {donationType === 'sponsorship' 
                          ? (paymentMethod === 'pix'
                            ? tr(`${quotasCount} ${quotasCount === 1 ? 'Criança Apadrinhada' : 'Crianças Apadrinhadas'} • Pacote ${pixPackageMonths} Meses`, `${quotasCount} Sponsored ${quotasCount === 1 ? 'Child' : 'Children'} • ${pixPackageMonths}-Month Package`)
                            : tr(`${quotasCount} ${quotasCount === 1 ? 'Criança Apadrinhada' : 'Crianças Apadrinhadas'} • Mensal`, `${quotasCount} Sponsored ${quotasCount === 1 ? 'Child' : 'Children'} • Monthly`))
                          : (paymentMethod !== 'pix' && Math.floor(currentAmount / 90) >= 1)
                            ? tr(`Mantenedor • ${Math.floor(currentAmount / 90)} ${Math.floor(currentAmount / 90) === 1 ? 'Criança Acolhida' : 'Crianças Acolhidas'}`, `Supporter • ${Math.floor(currentAmount / 90)} ${Math.floor(currentAmount / 90) === 1 ? 'Child Supported' : 'Children Supported'}`) 
                            : tr('Total Mensal (Fundo Geral):', 'Monthly Total (General Fund):')}
                      </span>
                      {donationType === 'sponsorship' && paymentMethod === 'pix' && (
                        <span className="text-[10px] text-emerald-700 font-gotham-bold flex items-center gap-1 mt-0.5">
                          <Calendar size={10} className="text-emerald-600" />
                          {tr(`Equivale a R$ ${sponsorshipMonthlyTotal}/mês • Pacote de ${pixPackageMonths} meses`, `Equals R$ ${sponsorshipMonthlyTotal}/mo • ${pixPackageMonths}-month package`)}
                        </span>
                      )}
                      {donationType !== 'sponsorship' && paymentMethod !== 'pix' && currentAmount >= 90 && currentAmount % 90 !== 0 && (
                        <span className="text-[10px] text-amber-700 font-gotham-bold flex items-center gap-1 mt-0.5">
                          <Sparkles size={10} className="text-[#F49853]" />
                          {tr(
                            `R$ ${Math.floor(currentAmount / 90) * 90} para ${Math.floor(currentAmount / 90) === 1 ? 'a criança' : `${Math.floor(currentAmount / 90)} crianças`} e R$ ${currentAmount % 90} para o projeto geral!`,
                            `R$ ${Math.floor(currentAmount / 90) * 90} for ${Math.floor(currentAmount / 90) === 1 ? 'the child' : `${Math.floor(currentAmount / 90)} children`} and R$ ${currentAmount % 90} for the general project!`
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-heading font-black text-amber-900">
                      R$ {currentAmount.toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}{' '}
                      <span className="text-xs font-normal text-amber-800">
                        {donationType === 'sponsorship' && paymentMethod === 'pix' ? `/ ${pixPackageMonths}m` : tr('/ mês', '/ mo')}
                      </span>
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {user ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {user.name ? user.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-gotham-bold text-slate-900 truncate">
                              {user.name || tr('Usuário Conectado', 'Connected User')}
                            </p>
                            <span className="text-[10px] font-gotham-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                              {tr('Conectado ✓', 'Signed In ✓')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                            {user.email} {user.phone ? `• ${user.phone}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1.5">
                          {tr('Nome Completo *', 'Full Name *')}
                        </label>
                        <input
                          type="text"
                          required
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          placeholder={tr('Ex: Lucas Ferreira Silva', 'e.g. John Smith')}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F49853] text-sm font-medium bg-slate-50 focus:bg-white transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1.5">
                          {tr('E-mail *', 'Email *')}
                        </label>
                        <input
                          type="email"
                          required
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                          placeholder={tr('lucas@exemplo.com', 'john@example.com')}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F49853] text-sm font-medium bg-slate-50 focus:bg-white transition-colors"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {donationType === 'sponsorship' ? tr('O perfil da sua criança apadrinhada será enviado para este e-mail.', 'Your sponsored child’s profile will be sent to this email.') : tr('Enviaremos os recibos mensais para este e-mail.', 'We will send monthly receipts to this email.')}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1.5">
                          {tr('WhatsApp com DDD (opcional)', 'WhatsApp / Phone (optional)')}
                        </label>
                        <input
                          type="tel"
                          value={donorPhone}
                          onChange={(e) => setDonorPhone(e.target.value)}
                          placeholder={tr('(11) 99999-9999', '+1 (555) 123-4567')}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F49853] text-sm font-medium bg-slate-50 focus:bg-white transition-colors"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-3">
                    <label className="block text-xs font-gotham-bold text-slate-700">
                      {tr('Forma de Pagamento', 'Payment Method')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={cn(
                          "py-3 px-3 rounded-xl border-2 flex items-center justify-center gap-2 font-gotham-bold text-xs uppercase tracking-wider transition-all cursor-pointer",
                          paymentMethod === 'card'
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <CreditCard size={16} />
                        <span>{tr('Cartão Mensal', 'Monthly Card')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={cn(
                          "py-3 px-3 rounded-xl border-2 flex items-center justify-center gap-2 font-gotham-bold text-xs uppercase tracking-wider transition-all cursor-pointer",
                          paymentMethod === 'pix'
                            ? "bg-[#F49853] border-[#F49853] text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <QrCode size={16} />
                        <span>{donationType === 'sponsorship' ? tr('PIX (3, 6 ou 12m)', 'PIX (3, 6 or 12m)') : tr('PIX Mensal', 'Monthly PIX')}</span>
                      </button>
                    </div>

                    {/* Seletor de Pacote PIX 3, 6 ou 12 meses quando em modo Apadrinhamento */}
                    {donationType === 'sponsorship' && paymentMethod === 'pix' && (
                      <div className="p-3.5 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-gotham-bold uppercase tracking-wider text-slate-700">
                            {tr('Escolha o Pacote de Meses (PIX):', 'Choose Months Package (PIX):')}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { months: 3 as const, label: tr('3 Meses', '3 Months'), sub: tr('Trimestral', 'Quarterly') },
                            { months: 6 as const, label: tr('6 Meses', '6 Months'), sub: tr('Semestral', 'Half-Year'), badge: tr('Ideal', 'Best') },
                            { months: 12 as const, label: tr('12 Meses', '12 Months'), sub: tr('1 Ano Completo', 'Full Year') },
                          ]).map((pkg) => {
                            const isSelected = pixPackageMonths === pkg.months;
                            const pkgVal = sponsorshipMonthlyTotal * pkg.months;
                            return (
                              <button
                                key={pkg.months}
                                type="button"
                                onClick={() => setPixPackageMonths(pkg.months)}
                                className={cn(
                                  "p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center relative cursor-pointer",
                                  isSelected
                                    ? "border-[#F49853] bg-white text-[#F49853] ring-1 ring-[#F49853] shadow-xs"
                                    : "border-slate-200 bg-white/80 hover:border-slate-300 text-slate-700"
                                )}
                              >
                                {pkg.badge && (
                                  <span className="absolute -top-2 right-2 bg-[#F49853] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">
                                    {pkg.badge}
                                  </span>
                                )}
                                <span className="text-[11px] font-gotham-bold uppercase">
                                  {pkg.label}
                                </span>
                                <span className="text-sm font-black text-slate-900 mt-0.5">
                                  R$ {pkgVal}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium">
                                  {pkg.sub}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug bg-white/80 p-2.5 rounded-xl border border-orange-100">
                          {tr(
                            `💡 Você paga ${pixPackageMonths} meses de uma vez e mantém seu apadrinhamento e acesso ao acompanhamento da criança durante todo o período (sem perder acesso no fim do mês). Ao terminar o ciclo, você escolhe se deseja renovar ou manter apenas o acesso às atualizações gerais do projeto.`,
                            `💡 You pay for ${pixPackageMonths} months upfront and keep your sponsorship and access to your child’s updates for the entire period (no monthly cutoff). At the end of the cycle, you choose whether to renew or keep general project updates.`
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 mt-2 bg-[#F49853] hover:bg-[#e0853d] text-white rounded-2xl font-gotham-bold text-sm uppercase tracking-wider shadow-lg shadow-[#F49853]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{tr('Processando...', 'Processing...')}</span>
                      </div>
                    ) : (
                      <>
                        <Heart size={16} className="fill-white" />
                        <span>
                          {donationType === 'sponsorship' 
                            ? (paymentMethod === 'pix'
                              ? tr(`Confirmar Pacote PIX de ${pixPackageMonths} Meses (R$ ${currentAmount.toFixed(2)})`, `Confirm ${pixPackageMonths}-Month PIX Package (R$ ${currentAmount.toFixed(2)})`)
                              : tr(`Confirmar Apadrinhamento (R$ ${currentAmount.toFixed(2)}/mês)`, `Confirm Sponsorship (R$ ${currentAmount.toFixed(2)}/mo)`))
                            : tr(`Confirmar Doação Mensal (R$ ${currentAmount.toFixed(2)}/mês)`, `Confirm Monthly Gift (R$ ${currentAmount.toFixed(2)}/mo)`)}
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-400 font-gotham-light">
                    {tr('Cancelamento fácil a qualquer momento • 100% Seguro', 'Easy cancellation anytime • 100% Secure')}
                  </p>
                </form>
              </div>

            </div>
          )}

          {/* 3 Garantias e Benefícios da Comunidade de Mantenedores */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4.5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F49853]/20 text-[#F49853] flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-[#92BF78]" />
              </div>
              <div>
                <strong className="text-white block font-gotham-medium text-sm">{tr('Previsibilidade que Salva', 'Predictability That Saves Lives')}</strong>
                <span className="text-xs text-slate-300 font-gotham-light">{tr('Garante a nutrição diária de cada criança e mantém todos os nossos projetos humanitários ativos e contínuos.', 'Ensures daily nutrition for every child and keeps all our humanitarian projects active and continuous.')}</span>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4.5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-[#92BF78]" />
              </div>
              <div>
                <strong className="text-white block font-gotham-medium text-sm">{tr('Relatórios Diretos de Campo', 'Direct Field Reports')}</strong>
                <span className="text-xs text-slate-300 font-gotham-light">{tr('Acompanhe a recuperação de peso, fotos e boletins das crianças assistidas pelo seu compromisso.', 'Follow weight recovery, photos, and updates of the children cared for through your commitment.')}</span>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4.5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-[#92BF78]" />
              </div>
              <div>
                <strong className="text-white block font-gotham-medium text-sm">{tr('100% Flexível e Seguro', '100% Flexible & Secure')}</strong>
                <span className="text-xs text-slate-300 font-gotham-light">{tr('Cancele, pause ou ajuste o valor a qualquer momento com total autonomia e criptografia SSL 256-bit.', 'Cancel, pause, or adjust your amount anytime with full autonomy and 256-bit SSL encryption.')}</span>
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
              {tr('A Diferença Entre Sobreviver e Prosperar', 'The Difference Between Surviving and Thriving')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
              {tr('Por que nossos projetos dependem da sua constância mensal?', 'Why do our projects depend on your monthly consistency?')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-gotham-light mt-4">
              {tr(
                'Uma doação esporádica apaga um incêndio. O mantenedor mensal constrói uma fortaleza duradoura que mantém todas as nossas frentes humanitárias ativas todos os dias.',
                'A sporadic donation puts out a fire. A monthly supporter builds a lasting foundation that keeps all our humanitarian fronts active every day.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Coluna 1: O drama da incerteza */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-6">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-heading font-black text-slate-900 mb-3">
                {tr('Quando dependemos apenas de doações pontuais:', 'When we rely only on one-time donations:')}
              </h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <span>{tr('Incerteza para planejar novas perfurações de poços de água potável e manter a manutenção das bombas ativas.', 'Uncertainty in planning new clean water wells and keeping existing pumps maintained.')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <span>{tr('Risco de interrupção no tratamento clínico de crianças desnutridas e nas bolsas de estudo de jovens universitários.', 'Risk of interruption in clinical treatment for malnourished children and university scholarships.')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <span>{tr('Dificuldade para estruturar novas frentes comunitárias e comprar insumos essenciais com antecedência e economia.', 'Difficulty structuring new community initiatives and purchasing essential supplies in advance.')}</span>
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
                {tr('Quando você se torna um Mantenedor Mensal:', 'When you become a Monthly Supporter:')}
              </h3>
              <ul className="space-y-4 text-slate-200 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#92BF78] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>{tr('Todas as Portas Abertas:', 'All Doors Open:')}</strong> {tr('Acolhimento médico ininterrupto, clínicas móveis nos vilarejos e atendimento digno para cada família.', 'Uninterrupted medical care, mobile clinics in villages, and dignified support for every family.')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#92BF78] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>{tr('Água, Nutrição e Saúde Plena:', 'Water, Nutrition & Full Health:')}</strong> {tr('Poços artesianos operando sem parar e ciclo integral de recuperação para erradicar a desnutrição.', 'Artesian wells running reliably and a full recovery cycle to eradicate malnutrition.')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#92BF78] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span><strong>{tr('Futuro, Educação e Autonomia:', 'Future, Education & Self-Reliance:')}</strong> {tr('Continuidade de bolsas universitárias, capacitação profissional de mães e hortas comunitárias sustentáveis.', 'Ongoing university scholarships, vocational training for mothers, and sustainable community gardens.')}</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 3. AS TRÊS FRENTES DE DESTINAÇÃO DO RECURSO */}
      <section className="py-20 md:py-28 bg-[#0F172A] text-white relative overflow-hidden">
        {/* Background visual com a foto da criança acolhida bem visível */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/mantenedor_hero.jpg" 
            alt="Criança sorrindo acolhida pela YAH Hope" 
            className="w-full h-full object-cover object-[center_25%] filter brightness-[0.90] contrast-105 scale-100"
          />
          {/* Gradientes suaves para destacar a foto com contraste perfeito para os textos */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/45 to-[#0F172A]/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/50 via-transparent to-[#0F172A]/50"></div>
          <div className="absolute inset-0 bg-black/15"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2 drop-shadow-md">
              {tr('Destinação Real e Auditada', 'Real & Audited Allocation')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {tr('Para onde vai a sua contribuição todo mês?', 'Where does your monthly contribution go?')}
            </h2>
            <p className="text-base sm:text-lg text-slate-100 font-gotham-light mt-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {tr('Cada centavo confiado à YAH Hope possui endereço certo, auditoria contínua e impacto mensurável.', 'Every cent entrusted to YAH Hope has a clear destination, continuous auditing, and measurable impact.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Frente 1 */}
            <div className="bg-slate-900/75 backdrop-blur-md hover:bg-slate-900/90 transition-all p-8 rounded-3xl border border-slate-700/80 flex flex-col justify-between group shadow-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#F49853]/20 text-[#F49853] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity size={28} />
                </div>
                <h3 className="text-xl font-heading font-black text-white mb-3">
                  Casa Nutri (Nampula)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-gotham-light mb-4">
                  {tr(
                    "Compra de fórmulas terapêuticas (F-75, F-100 e Plumpy'Nut), insumos hospitalares, remuneração de nutricionistas locais e monitoramento pediátrico intensivo para erradicar a desnutrição infantil.",
                    "Purchase of therapeutic formulas (F-75, F-100, and Plumpy'Nut), medical supplies, local nutritionists' salaries, and intensive pediatric monitoring to eradicate child malnutrition."
                  )}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-700/80 text-xs font-gotham-bold text-[#F49853] flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>{tr('Salva vidas em risco iminente', 'Saves lives in imminent danger')}</span>
              </div>
            </div>

            {/* Frente 2 */}
            <div className="bg-slate-900/75 backdrop-blur-md hover:bg-slate-900/90 transition-all p-8 rounded-3xl border border-slate-700/80 flex flex-col justify-between group shadow-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap size={28} />
                </div>
                <h3 className="text-xl font-heading font-black text-white mb-3">
                  {tr('Educação & Bolsas Universitárias', 'Education & University Scholarships')}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-gotham-light mb-4">
                  {tr(
                    'Financiamento de bolsas universitárias integrais para jovens órfãos ou em extrema vulnerabilidade se formarem médicos, enfermeiros, professores e engenheiros da sua própria nação.',
                    'Funding full university scholarships for orphaned or highly vulnerable youth to graduate as doctors, nurses, teachers, and engineers in their own nation.'
                  )}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-700/80 text-xs font-gotham-bold text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>{tr('Quebra o ciclo geracional da pobreza', 'Breaks the generational cycle of poverty')}</span>
              </div>
            </div>

            {/* Frente 3 */}
            <div className="bg-slate-900/75 backdrop-blur-md hover:bg-slate-900/90 transition-all p-8 rounded-3xl border border-slate-700/80 flex flex-col justify-between group shadow-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-[#92BF78] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Droplets size={28} />
                </div>
                <h3 className="text-xl font-heading font-black text-white mb-3">
                  {tr('Água Potável & Autonomia Comunitária', 'Clean Water & Community Self-Reliance')}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-gotham-light mb-4">
                  {tr(
                    'Perfuração de poços artesianos nas aldeias, saneamento, oficinas de agricultura sustentável para mães e hortas que alimentam centenas de famílias de forma autônoma.',
                    'Drilling artesian wells in villages, sanitation, sustainable agriculture workshops for mothers, and community gardens that feed hundreds of families independently.'
                  )}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-700/80 text-xs font-gotham-bold text-[#92BF78] flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>{tr('Saúde preventiva e dignidade básica', 'Preventive health and basic dignity')}</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. HISTÓRIA REAL DE RESGATE: O PODER DO MANTENEDOR */}
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
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block">
                {tr('Prova Viva da Generosidade', 'Living Proof of Generosity')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
                {tr('Você não está enviando um valor abstrato.', 'You are not sending an abstract amount.')} <br />
                <span className="text-[#F49853]">{tr('Você está reescrevendo um destino.', 'You are rewriting a destiny.')}</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 font-gotham-light leading-relaxed">
                {tr(
                  'Quando uma mãe chega caminhando 15 km debaixo do sol escaldante de Moçambique carregando nos braços um filho desfalecido pela desnutrição severa, ela não procura promessas. Ela procura socorro real.',
                  'When a mother arrives after walking 15 km under the scorching Mozambican sun carrying a child weakened by severe malnutrition, she is not looking for promises. She is looking for real help.'
                )}
              </p>

              <p className="text-base text-slate-600 font-gotham-light leading-relaxed">
                {tr(
                  "Na Casa Nutri da YAH Hope, essa criança recebe imediatamente a fórmula F-75, que estabiliza seus órgãos vitais. Em seguida, progride para o leite F-100 e a pasta hipercalórica Plumpy'Nut. Em 42 dias, o olhar opaco dá lugar a sorrisos radiantes.",
                  "At YAH Hope’s Casa Nutri, that child immediately receives F-75 therapeutic formula to stabilize vital organs, then progresses to F-100 milk and Plumpy'Nut. Within 42 days, lifeless eyes give way to radiant smiles."
                )}
              </p>

              <blockquote className="p-4 bg-orange-50 border-l-4 border-[#F49853] rounded-r-2xl text-slate-700 italic text-sm">
                {tr(
                  '"Nada disso aconteceria se tivéssemos que parar para fazer uma \'vaquinha\' a cada criança que bate à nossa porta. Os mantenedores mensais são os anjos silenciosos por trás de cada respiração salva."',
                  '"None of this would happen if we had to pause and run a fundraiser for every child who knocks on our door. Monthly supporters are the quiet angels behind every breath saved."'
                )}
                <span className="block not-italic font-gotham-bold text-xs text-slate-900 mt-2">{tr('— Equipe de Saúde YAH Hope, Nampula', '— YAH Hope Medical Team, Nampula')}</span>
              </blockquote>

              <div className="pt-2">
                <button
                  onClick={scrollToCheckout}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white px-8 py-4 rounded-full font-gotham-bold text-sm tracking-wide transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Heart size={16} className="text-[#F49853] fill-[#F49853]" />
                  <span>{tr('Seja o Mantenedor Desta Transformação', 'Be the Supporter Behind This Transformation')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. TRANSPARÊNCIA RADICAL: O QUE VOCÊ GANHA COMO MANTENEDOR */}
      <section className="py-20 md:py-28 bg-[#0F172A] text-white border-y border-slate-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              {tr('Conexão e Integridade', 'Connection & Integrity')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white leading-tight">
              {tr('O Que Você Recebe Como Nosso Parceiro Mensal', 'What You Receive as Our Monthly Partner')}
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-gotham-light mt-4">
              {tr(
                'Não tratamos doações como caixas-pretas. Criamos uma ponte direta entre a sua generosidade e a realidade das famílias assistidas.',
                'We do not treat donations as black boxes. We build a direct bridge between your generosity and the reality of the families we serve.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-slate-800/60 hover:bg-slate-800/90 transition-all p-6 rounded-3xl border border-slate-700/80 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#F49853] flex items-center justify-center font-bold">
                <Users size={22} />
              </div>
              <h3 className="font-gotham-bold text-base text-white">{tr('Portal do Mantenedor', 'Supporter Portal')}</h3>
              <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                {tr(
                  'Login exclusivo para acompanhar métricas de impacto em tempo real, evolução das crianças e histórico das suas doações.',
                  'Exclusive login to track real-time impact metrics, children’s progress, and your donation history.'
                )}
              </p>
            </div>

            <div className="bg-slate-800/60 hover:bg-slate-800/90 transition-all p-6 rounded-3xl border border-slate-700/80 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#92BF78] flex items-center justify-center font-bold">
                <FileText size={22} />
              </div>
              <h3 className="font-gotham-bold text-base text-white">{tr('Relatórios Auditados', 'Audited Reports')}</h3>
              <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                {tr(
                  'Demonstrativos claros e públicos sobre onde cada real foi investido no terreno, com laudos médicos e notas fiscais.',
                  'Clear, public statements showing where every contribution was invested in the field, with medical reports and receipts.'
                )}
              </p>
            </div>

            <div className="bg-slate-800/60 hover:bg-slate-800/90 transition-all p-6 rounded-3xl border border-slate-700/80 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Calendar size={22} />
              </div>
              <h3 className="font-gotham-bold text-base text-white">{tr('Boletins Periódicos', 'Periodic Bulletins')}</h3>
              <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                {tr(
                  'Atualizações periódicas no seu e-mail ou WhatsApp com histórias, vídeos e fotos diretamente da base de Moçambique.',
                  'Regular updates via email or WhatsApp with stories, videos, and photos straight from our hub in Mozambique.'
                )}
              </p>
            </div>

            <div className="bg-slate-800/60 hover:bg-slate-800/90 transition-all p-6 rounded-3xl border border-slate-700/80 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Award size={22} />
              </div>
              <h3 className="font-gotham-bold text-base text-white">{tr('Certificado Oficial', 'Official Certificate')}</h3>
              <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                {tr(
                  'Certificado digital de mantenedor solidário para atestar seu compromisso com a transformação social e humanitária.',
                  'Digital supporter certificate recognizing your commitment to social and humanitarian transformation.'
                )}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. PERGUNTAS FREQUENTES (FAQ) PARA QUEBRAR TODAS AS OBJEÇÕES */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              {tr('Tire Suas Dúvidas', 'Get Your Answers')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
              {tr('Perguntas Frequentes', 'Frequently Asked Questions')}
            </h2>
            <p className="text-slate-600 text-sm font-gotham-light mt-3">
              {tr('Tudo o que você precisa saber sobre o programa de mantenedores da YAH Hope.', 'Everything you need to know about the YAH Hope monthly supporter program.')}
            </p>
          </div>

          <div className="space-y-4">
            {localizedFaqs.map((faq, index) => {
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
              {tr('Ainda tem alguma dúvida específica? Fale diretamente conosco pelo e-mail ', 'Still have a specific question? Reach out directly to us at ')}
              <a href="mailto:contato@yahhope.org" className="text-[#F49853] font-gotham-bold hover:underline">
                contato@yahhope.org
              </a>{' '}
              {tr('ou através dos nossos canais de atendimento.', 'or through our support channels.')}
            </p>
          </div>

        </div>
      </section>

      {/* 7. CHAMADA FINAL EMOCIONANTE (CTA FOOTER HERO) */}
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
            <span>{tr('O Próximo Sorriso Depende de Você', 'The Next Smile Depends on You')}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-black text-white leading-tight">
            {tr('Não adie o resgate de quem não pode esperar.', 'Do not delay the rescue of those who cannot wait.')}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-gotham-light max-w-2xl mx-auto leading-relaxed">
            {tr(
              'Neste exato instante, uma criança em Moçambique dá seus primeiros passos rumo à recuperação na Casa Nutri porque alguém decidiu não fechar os olhos. Seja você essa pessoa.',
              'At this very moment, a child in Mozambique is taking their first steps toward recovery at Casa Nutri because someone decided not to look away. Be that person.'
            )}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToCheckout}
              className="w-full sm:w-auto bg-[#F49853] hover:bg-[#e0853d] text-white px-9 py-4 rounded-full font-gotham-bold text-sm tracking-wide shadow-xl shadow-[#F49853]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={18} />
              <span>{tr('Quero Ser um Mantenedor Mensal Agora', 'Become a Monthly Supporter Now')}</span>
            </button>
            
            <Link
              to="/projetos"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-full font-gotham-medium text-sm transition-all"
            >
              {tr('Conhecer Nossas Frentes', 'Explore Our Fronts')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
