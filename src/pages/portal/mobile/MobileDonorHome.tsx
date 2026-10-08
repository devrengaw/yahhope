import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useImpact } from '../../../contexts/ImpactContext';
import { useFundraising } from '../../../contexts/FundraisingContext';
import { useBlog } from '../../../contexts/BlogContext';
import { usePatients } from '../../../contexts/PatientContext';
import { 
  Heart, 
  Gift, 
  Activity, 
  Star, 
  ArrowRight, 
  TrendingUp, 
  Sparkles, 
  Briefcase, 
  Newspaper,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Users,
  Target
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function MobileDonorHome() {
  const { user } = useAuth();
  const { getPublishedItems } = useImpact();
  const { allDonations, activeCampaign, campaign: defaultCamp } = useFundraising();
  const { posts } = useBlog();
  const { patients } = usePatients();
  const navigate = useNavigate();

  const currentCampaign = activeCampaign || defaultCamp;

  // Doações reais do usuário logado
  const userDonations = allDonations.filter(
    d => d.donor_email?.toLowerCase().trim() === user?.email?.toLowerCase().trim() && d.status === 'paid'
  );
  const totalUserDonated = userDonations.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const donationsCount = userDonations.length;

  // Cálculo de idade da criança a partir de dob
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'Idade não informada';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 'Idade não informada';
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  };

  // Crianças reais do sistema
  const displayedPatients = patients.slice(0, 4);

  const publishedImpact = getPublishedItems().slice(0, 3);
  const latestPost = posts.find(p => p.status === 'published') || posts[0];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Hero Banner de Boas-Vindas */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#F49853]/20 border border-[#F49853]/40 px-3.5 py-1.5 rounded-full text-[#F49853] text-xs font-gotham-bold uppercase tracking-wider">
            <Heart size={14} fill="currentColor" />
            <span>Aliança de Esperança • Mantenedor Ativo</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight">
            Ihale, {user?.name?.split(' ')[0] || 'Mantenedor'}!
          </h1>
          
          <p className="text-sm sm:text-base text-slate-300 font-gotham-light leading-relaxed">
            Sua fidelidade e generosidade sustentam o tratamento de crianças desnutridas na Casa Nutri e geram transformação real para famílias em extrema vulnerabilidade.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/portal/donations"
              className="bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Heart size={16} fill="currentColor" />
              <span>Fazer Nova Contribuição</span>
            </Link>
            <Link
              to="/portal/my-donations"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-gotham-medium text-xs px-5 py-3.5 rounded-xl transition-all flex items-center gap-2"
            >
              <Receipt size={16} />
              <span>Meus Comprovantes & Recibos</span>
            </Link>
          </div>
        </div>

        {/* Efeito decorativo sutil de fundo */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-[#F49853]/15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. Grid de Métricas Reais do Mantenedor */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Contribuído */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F49853] flex items-center justify-center mb-3">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900 block leading-tight">
              {totalUserDonated > 0 ? `R$ ${totalUserDonated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
            </span>
            <span className="text-[11px] font-gotham-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Seu Total Doado
            </span>
          </div>
        </div>

        {/* Quantidade de Doações */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Receipt size={20} />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900 block leading-tight">
              {donationsCount}
            </span>
            <span className="text-[11px] font-gotham-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Doações Concluídas
            </span>
          </div>
        </div>

        {/* Crianças em Atendimento Real */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
            <Users size={20} />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900 block leading-tight">
              {patients.length > 0 ? patients.length : '18+'}
            </span>
            <span className="text-[11px] font-gotham-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Crianças na Casa Nutri
            </span>
          </div>
        </div>

        {/* Estágio da Régua */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Target size={20} />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900 block leading-tight">
              {currentCampaign 
                ? `${Math.min(100, Math.round((currentCampaign.current_amount / currentCampaign.target_amount) * 100))}%`
                : '100%'}
            </span>
            <span className="text-[11px] font-gotham-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Meta do Estágio Atual
            </span>
          </div>
        </div>

      </div>

      {/* 3. Grid Principal em 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA (7 cols): Crianças da Casa Nutri & Atualizações de Campo */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Seção Crianças Atendidas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
                  <Heart className="text-[#F49853]" size={22} fill="currentColor" /> 
                  Crianças em Acompanhamento
                </h3>
                <p className="text-xs text-slate-500 font-gotham-light">
                  Vidas que recebem acolhimento e tratamento nutricional contínuo.
                </p>
              </div>
              <Link
                to="/portal/sponsorship"
                className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {displayedPatients.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
                <Users size={32} className="mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="font-bold text-slate-600">Nenhuma criança registrada no momento.</p>
                <p className="mt-1">Novos atendimentos da Casa Nutri serão sincronizados em breve.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedPatients.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => navigate('/portal/sponsorship')}
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-orange-300 shadow-xs hover:shadow-md transition-all flex items-start gap-4 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 text-[#F49853] font-heading font-black text-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-heading font-black text-slate-900 text-sm truncate">
                          {child.name}
                        </h4>
                        <span className={`text-[9px] font-gotham-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          child.status === 'Adequado' || child.status === 'Alta'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {child.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-gotham-light mt-0.5">
                        {calculateAge(child.dob)} • {child.community || 'Casa Nutri'}
                      </p>
                      <span className="text-[11px] text-[#F49853] font-gotham-bold mt-2 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Acompanhar evolução <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção Atualizações de Campo & Transparência */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={22} />
                  Atualizações de Campo
                </h3>
                <p className="text-xs text-slate-500 font-gotham-light">
                  Transparência de cada ação desenvolvida com os mantenedores.
                </p>
              </div>
              <Link
                to="/portal/projects"
                className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-1"
              >
                <span>Ver projetos</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {publishedImpact.length === 0 ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 text-center text-xs text-slate-400">
                  Novos relatórios fotográficos e médicos serão publicados em breve pela coordenação.
                </div>
              ) : (
                publishedImpact.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        {item.type === 'child' ? 'Criança' : item.type === 'project' ? 'Projeto' : 'Relatório'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="font-heading font-black text-slate-900 text-sm leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-600 font-gotham-light leading-relaxed">{item.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA (5 cols): Régua de Arrecadação & Notícia do Blog */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Card Campanha da Régua Ativa */}
          {currentCampaign && (
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-gotham-bold uppercase tracking-widest text-[#F49853] bg-orange-500/15 px-3 py-1 rounded-full border border-orange-500/30">
                  Meta Atual da Casa Nutri
                </span>
                <span className="text-xs font-gotham-bold text-emerald-400 flex items-center gap-1">
                  <Activity size={14} /> Ativo
                </span>
              </div>

              <h3 className="text-xl font-heading font-black text-white leading-snug">
                {currentCampaign.title}
              </h3>
              
              <p className="text-xs text-slate-300 font-gotham-light line-clamp-2 leading-relaxed">
                {currentCampaign.description}
              </p>

              {/* Barra de Progresso Real */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-gotham-bold">
                  <span className="text-slate-400">Progresso</span>
                  <span className="text-[#F49853]">
                    R$ {currentCampaign.current_amount.toLocaleString('pt-BR')} / R$ {currentCampaign.target_amount.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-[#F49853] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.round((currentCampaign.current_amount / currentCampaign.target_amount) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Impacto Direto</span>
                <Link to="/campanha" className="text-[#F49853] font-gotham-bold hover:underline flex items-center gap-1">
                  Ver detalhes da régua <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* Destaque do Blog */}
          {latestPost && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-black text-slate-900 flex items-center gap-2">
                  <Newspaper className="text-blue-500" size={20} />
                  Novidades da Comunidade
                </h3>
                <Link
                  to="/blog"
                  className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center gap-0.5"
                >
                  <span>Ver todas</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div
                onClick={() => navigate(`/blog?post=${latestPost.id}`)}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="h-44 w-full relative overflow-hidden">
                  <img
                    src={latestPost.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'}
                    alt={latestPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-gotham-bold uppercase tracking-wider px-3 py-1 rounded-lg">
                    {latestPost.category}
                  </span>
                </div>
                <div className="p-5">
                  <h4 className="font-heading font-black text-slate-900 text-base leading-snug line-clamp-2">
                    {latestPost.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-gotham-light mt-2 line-clamp-2 leading-relaxed">
                    {latestPost.excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>{latestPost.author || 'Equipe YAH Hope'}</span>
                    <span className="text-[#F49853] font-gotham-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ler artigo <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
