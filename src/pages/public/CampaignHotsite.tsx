import React, { useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Users, 
  Lock, 
  Compass, 
  ArrowRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { cn } from '../../lib/utils';
import { 
  recordCampaignClick, 
  detectTrafficSource 
} from '../../services/campaignTrackingService';
import { trackPageView } from '../../services/analyticsService';
import { HomeDonationCard } from '../../components/public/HomeDonationCard';

export function CampaignHotsite() {
  useEffect(() => {
    // Registra a visualização do hotsite de mantenedores
    trackPageView('/campanha-yahhope', 'Hotsite - Construindo a Esperança | YAH Hope');
    recordCampaignClick('Visualização da Página de Mantenedores', 'page_view', {
      source: detectTrafficSource(),
      referrer: document.referrer
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 antialiased selection:bg-[#F49853] selection:text-white">
      <SEO 
        title="Construindo a esperança | YAH Hope" 
        description="Você foi convidado a ser um agente de transformação na YAH Hope. Conheça nosso propósito, o Portal do Mantenedor e junte-se a nós na construção de dignidade e futuro."
      />

      {/* Topo Limpo: Apenas Logo e Identidade Suave (Sem barra urgente, sem menus) */}
      <header className="py-6 px-4 sm:px-8 border-b border-amber-100/40 bg-white/70 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F49853] to-[#ffb175] flex items-center justify-center text-white shadow-md shadow-[#F49853]/25">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900 font-gotham-bold leading-none">
                YAH <span className="text-[#F49853]">HOPE</span>
              </div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                Dignidade & Transformação
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/60 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#F49853]" />
            <span>Convite Especial</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal: Copy Humanizada e em seguida a Caixa de Doação */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        
        {/* Bloco de Texto Humanizado (Sem apelação, focado em esperança e no papel de agente de transformação) */}
        <article className="space-y-6 text-left">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-bold">
            <Heart className="w-3.5 h-3.5 text-[#F49853] fill-current" />
            <span>Seja um agente de transformação</span>
          </div>

          {/* Título Oficial Solicitado */}
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Construindo a esperança.
          </h1>

          {/* Corpo do Texto Acolhedor e Inspirador */}
          <div className="space-y-5 text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            <p className="text-lg sm:text-xl text-slate-700 font-semibold leading-relaxed">
              A esperança não é uma espera passiva. Ela é uma decisão consciente de construir pontes onde antes existiam abismos. Quando olhamos para cenários de grande vulnerabilidade, acreditamos firmemente que nenhuma realidade é imutável quando pessoas decidem caminhar juntas.
            </p>

            <p>
              Se este convite chegou até você, é porque reconhecemos em você alguém capaz de fazer a diferença. Você não está aqui apenas para fazer uma contribuição, mas para assumir um papel ativo como <strong className="text-slate-900 font-bold">agente de transformação</strong>.
            </p>

            <p>
              Na <strong className="text-slate-900 font-bold">YAH Hope</strong>, atuamos de forma ampla e estruturada em múltiplas frentes de desenvolvimento humano. Nossa missão vai além de suprir uma necessidade emergencial: trabalhamos com nutrição, saúde, educação, formação comunitária e fortalecimento das famílias, criando raízes sustentáveis para que comunidades inteiras conquistem autonomia e dignidade duradoura.
            </p>

            {/* Destaque do Portal do Mantenedor */}
            <div className="my-8 p-6 sm:p-7 rounded-3xl bg-amber-50/60 border border-amber-200/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F49853] text-white flex items-center justify-center shadow-sm">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    O Portal do Mantenedor: Transparência e Proximidade
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Uma plataforma exclusiva para você acompanhar cada passo do projeto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-xs sm:text-sm text-slate-700">
                <div className="p-3.5 rounded-2xl bg-white border border-amber-100 shadow-xs">
                  <span className="font-bold text-slate-900 block mb-1">Acompanhamento Pessoal</span>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Sendo padrinho ou madrinha, você acompanha de perto o desenvolvimento daquela criança, com fotos, histórico e evolução.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-amber-100 shadow-xs">
                  <span className="font-bold text-slate-900 block mb-1">Prestação de Contas</span>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Acesso total aos demonstrativos financeiros de onde cada recurso é aplicado, com rigor e transparência.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-amber-100 shadow-xs">
                  <span className="font-bold text-slate-900 block mb-1">Notícias & Histórias</span>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Atualizações frequentes sobre as frentes de campo e o impacto que o seu compromisso mensal gera nas comunidades.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Ao se tornar um mantenedor mensal, você garante a sustentação contínua que permite o planejamento de longo prazo de cada projeto. Escolha abaixo como deseja caminhar conosco:
            </p>
          </div>
        </article>

        {/* Caixa de Doação / Apoio Mensal: Posicionada Logo Abaixo do Texto */}
        <section className="mt-10 mb-16 max-w-xl mx-auto">
          <div className="bg-slate-900 text-white p-4 rounded-t-3xl text-center text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm">
            <Heart className="w-4 h-4 text-[#F49853] fill-current animate-pulse" />
            <span>Faça parte como Mantenedor ou Padrinho</span>
          </div>

          <div className="bg-white rounded-b-3xl border-x border-b border-slate-100 shadow-2xl shadow-amber-900/10 overflow-hidden">
            <HomeDonationCard initialTab="sponsorship" />
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-400 font-medium">
            <Lock size={12} className="text-slate-400" />
            <span>Ambiente seguro criptografado com tecnologia Stripe</span>
          </div>
        </section>

      </main>

      {/* Seção Oficial do Manifesto YAH Hope */}
      <section 
        className="py-20 md:py-24 text-white relative overflow-hidden"
        style={{ 
          backgroundColor: '#F49853', 
          backgroundImage: 'url("https://hope.yahchurch.com/wp-content/uploads/2025/09/Pattern-1.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Coluna Esquerda: Título MANI-FESTO */}
            <div className="lg:col-span-5 text-left">
              <h2 className="text-6xl sm:text-7xl md:text-8xl font-heading font-black text-white uppercase tracking-tight leading-[0.88] select-none drop-shadow-md">
                MANI-<br />FESTO
              </h2>
              <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight mt-3">
                YAH Hope
              </p>
            </div>

            {/* Coluna Direita: Texto Integral do Manifesto */}
            <div className="lg:col-span-7 text-left space-y-4">
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-white leading-snug drop-shadow-xs">
                Como encontrar futuro em cenários que para muitos são impossíveis de serem mudados?
              </h3>

              <div className="space-y-3.5 text-xs sm:text-sm md:text-base font-gotham-regular text-white/95 text-justify leading-relaxed drop-shadow-xs">
                <p>
                  Na jornada da esperança, nasce a missão da YAH Hope. Somos mais do que uma organização social; somos guardiões da dignidade humana, tecendo histórias de transformação e resiliência em comunidades esquecidas.
                </p>
                <p>
                  Acreditamos no poder transformador da esperança. Plantamos sementes através de ações conectadas a nutrição, geração de renda, escolaridade e entre tantas outras que são essenciais para o desenvolvimento humano. E assim, cultivamos um futuro em que cada indivíduo possa crescer independentemente das adversidades.
                </p>
                <p>
                  Nosso compromisso com a dignidade vai além do presente. Adotamos uma abordagem sustentável em todas as nossas iniciativas, assegurando que o impacto positivo seja duradouro e capaz de transformar gerações futuras.
                </p>
                <p>
                  Trabalhamos para que cada pessoa não apenas sobreviva, mas viva com dignidade. Somos construtores de comunidades resilientes. Através de cada projeto executado juntamente com a população local, subimos um degrau na promoção da dignidade humana.
                </p>
                <p>
                  Junte-se a nós nessa jornada. A YAH Hope é mais do que uma organização; é um movimento, uma chama ardente que ilumina caminhos antes obscuros. Onde há esperança, há dignidade, e onde há dignidade, há a promessa de uma população mais forte e resplandecente.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Rodapé Limpo e Discreto */}
      <footer className="py-10 bg-white border-t border-slate-100 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-4 space-y-1.5">
          <p className="font-bold text-slate-600">YAH Hope • Construindo a Esperança e a Dignidade Humana</p>
          <p>© {new Date().getFullYear()} YAH Hope. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
