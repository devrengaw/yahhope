import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  MessageCircle, 
  ShieldCheck, 
  Utensils, 
  Stethoscope, 
  Droplet, 
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { cn } from '../../lib/utils';
import { 
  recordCampaignClick, 
  getClientLocation, 
  detectTrafficSource 
} from '../../services/campaignTrackingService';
import { trackPageView } from '../../services/analyticsService';
import { HomeDonationCard } from '../../components/public/HomeDonationCard';

export function CampaignHotsite() {
  const [visitorCity, setVisitorCity] = useState<string>('');

  useEffect(() => {
    // Registra a visualização do hotsite de mantenedores
    trackPageView('/campanha-yahhope', 'Hotsite - Seja um Mantenedor YAH Hope');
    recordCampaignClick('Visualização da Página de Mantenedores', 'page_view', {
      source: detectTrafficSource(),
      referrer: document.referrer
    });

    getClientLocation().then(geo => {
      if (geo && geo.city) {
        setVisitorCity(geo.city);
      }
    });
  }, []);

  const handleWhatsAppContact = () => {
    recordCampaignClick('WhatsApp: Dúvidas sobre Mantenedor', 'click_whatsapp');
    const text = encodeURIComponent('Olá! Recebi o convite para ser mantenedor mensal da YAH Hope e gostaria de conversar com a equipe.');
    window.open(`https://wa.me/5511999999999?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 antialiased selection:bg-[#F49853] selection:text-white">
      <SEO 
        title="Um convite especial para você | Seja um Mantenedor YAH Hope" 
        description="Junte-se a nós como mantenedor mensal da YAH Hope. Uma ponte de amor contínuo que garante nutrição, saúde e futuro para crianças em extrema vulnerabilidade."
      />

      {/* Topo Limpo: Apenas Logo e Identidade Suave (Sem menus, sem barra de urgência) */}
      <header className="py-6 px-4 sm:px-8 border-b border-amber-100/40 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F49853] to-[#ffb175] flex items-center justify-center text-white shadow-md shadow-[#F49853]/25">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900 font-gotham-bold leading-none">
                YAH <span className="text-[#F49853]">HOPE</span>
              </div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                Nutrição & Esperança
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/60">
            <Sparkles className="w-3.5 h-3.5 text-[#F49853]" />
            <span>Convite Pessoal</span>
          </div>
        </div>
      </header>

      {/* Seção Principal: Copy Humanizada + Caixa de Doação */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Lado Esquerdo: A Carta-Convite Humanizada (Copy Direta e Pessoal) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold">
              <Heart className="w-3.5 h-3.5 text-[#F49853] fill-current" />
              <span>Você recebeu um convite de coração aberto</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              A fome não espera. <br />
              Mas com o seu apoio todo mês, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F49853] to-amber-600">
                a esperança também não para.
              </span>
            </h1>

            {/* Texto de acolhimento humanizado em parágrafos leves */}
            <div className="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              <p>
                Se você recebeu este link, é porque alguém que confia muito em você sabe da generosidade do seu coração.
              </p>

              <p>
                Na <strong className="text-slate-900 font-bold">YAH Hope</strong>, aprendemos que uma doação pontual mata a fome de hoje. Mas é a <strong className="text-slate-900 font-bold">constância de um mantenedor mensal</strong> que salva uma vida inteira.
              </p>

              <p className="bg-amber-50/70 p-4 rounded-2xl border-l-4 border-[#F49853] text-slate-700 text-sm sm:text-base">
                “Quando você se torna um mantenedor, você não está apenas doando um valor: você está adotando o acompanhamento clínico, o alimento seguro e o direito de uma criança crescer com saúde.”
              </p>

              <p>
                Com um valor fixo por mês que cabe na sua rotina, garantimos que aquela família atendida nunca mais veja o prato de comida esvaziar.
              </p>
            </div>

            {/* Destaques Rápidos de Transparência */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#92BF78] shrink-0" />
                <span>Cobrança automática segura</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#92BF78] shrink-0" />
                <span>Cancele quando quiser com 1 clique</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#92BF78] shrink-0" />
                <span>Relatórios periódicos da criança</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#92BF78] shrink-0" />
                <span>100% dedicação em cada refeição</span>
              </div>
            </div>

            {/* Chamada humanizada de dúvida */}
            <div className="pt-4 flex items-center gap-3 text-xs sm:text-sm text-slate-500">
              <span>Ficou com alguma dúvida?</span>
              <button
                onClick={handleWhatsAppContact}
                className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                <MessageCircle size={15} />
                <span>Converse conosco no WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Lado Direito: A Caixa de Doação / Apoio Mensal */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-6">
              {/* Badge indicando o propósito */}
              <div className="bg-slate-900 text-white p-3.5 rounded-t-3xl text-center text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm">
                <Heart className="w-4 h-4 text-[#F49853] fill-current animate-pulse" />
                <span>Escolha como ser a resposta na vida de uma criança</span>
              </div>

              {/* Caixa Oficial de Doação */}
              <div className="bg-white rounded-b-3xl border-x border-b border-slate-100 shadow-2xl shadow-amber-900/10 overflow-hidden">
                <HomeDonationCard initialTab="sponsorship" />
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-400 font-medium">
                <Lock size={12} className="text-slate-400" />
                <span>Ambiente seguro criptografado com tecnologia Stripe</span>
              </div>
            </div>
          </div>

        </div>

        {/* Seção Explicativa: O que o seu apoio mensal garante */}
        <section className="mt-20 sm:mt-28 pt-12 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F49853]">Impacto Concreto</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
              O que acontece quando você se torna mantenedor?
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              A cada 30 dias, o seu apoio se transforma em cuidados essenciais na vida de quem mais precisa:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-amber-200 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#F49853] flex items-center justify-center mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Alimento Diário</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                Alimentação terapêutica balanceada e refeições ricas em nutrientes todos os dias.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Acompanhamento Clínico</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                Visitas domiciliares, pesagem, medição e monitoramento da recuperação nutricional.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Água Limpa & Saúde</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                Suplementação vitamínica e insumos para evitar infecções que agravam a desnutrição.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-purple-200 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">Transparência Real</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                Você recebe relatórios, fotos e atualizações frequentes sobre a vida que você está mantendo.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé Simples e Honesto (Sem menus) */}
      <footer className="py-10 bg-white border-t border-slate-100 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-600">YAH Hope • Projeto de Combate à Desnutrição Infantil</p>
          <p>© {new Date().getFullYear()} YAH Hope. Todos os direitos reservados. Feito com amor por vidas preciosas.</p>
        </div>
      </footer>
    </div>
  );
}
