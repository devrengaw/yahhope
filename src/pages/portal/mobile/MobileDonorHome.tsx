import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useImpact } from '../../../contexts/ImpactContext';
import { useFundraising } from '../../../contexts/FundraisingContext';
import { useBlog } from '../../../contexts/BlogContext';
import { useDonationModal } from '../../../contexts/DonationModalContext';
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
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function MobileDonorHome() {
  const { user } = useAuth();
  const { getPublishedItems } = useImpact();
  const { allDonations } = useFundraising();
  const { posts } = useBlog();
  const { openDonationModal } = useDonationModal();
  const navigate = useNavigate();

  // User donations summary
  const userDonations = allDonations.filter(
    d => d.donor_email?.toLowerCase().trim() === user?.email?.toLowerCase().trim() && d.status === 'paid'
  );
  const totalUserDonated = userDonations.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Sponsored children mock
  const sponsoredChildren = [
    {
      id: '1',
      name: 'Abidemi',
      age: '5 anos',
      village: 'Boane',
      status: 'Recuperada',
      statusColor: 'bg-emerald-100 text-emerald-800',
      img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=600&auto=format&fit=crop',
      lastUpdate: 'Ganhou +450g este mês na Casa Nutri'
    },
    {
      id: '2',
      name: 'Farai',
      age: '3 anos',
      village: 'Matola',
      status: 'Em tratamento',
      statusColor: 'bg-amber-100 text-amber-800',
      img: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=600&auto=format&fit=crop',
      lastUpdate: 'Recebendo suplementação terapêutica'
    }
  ];

  const publishedImpact = getPublishedItems().slice(0, 3);
  const latestPost = posts.find(p => p.status === 'published') || posts[0];

  return (
    <div className="space-y-6">
      {/* Welcome Card with Warm Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/20">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-amber-100 inline-block mb-3">
            Impacto Social em Ação
          </span>
          <h2 className="text-2xl font-black tracking-tight leading-tight">
            Ihale, {user?.name?.split(' ')[0] || 'Apoiador'}!
          </h2>
          <p className="text-xs text-amber-100/90 mt-1 font-medium leading-relaxed">
            Seu amor e proximidade transformam a vida de crianças em Moçambique e no Brasil todos os dias.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => openDonationModal()}
              className="bg-white text-amber-600 font-black text-xs px-4 py-2.5 rounded-xl shadow-md hover:bg-amber-50 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Heart size={14} fill="currentColor" /> Doar Agora
            </button>
            <Link
              to="/portal/donations"
              className="bg-amber-600/40 hover:bg-amber-600/60 border border-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all"
            >
              Minhas Doações
            </Link>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1.5">
            <Heart size={16} fill="currentColor" />
          </div>
          <span className="text-lg font-black text-slate-900 block leading-tight">2</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Apadrinhadas</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
            <Sparkles size={16} />
          </div>
          <span className="text-lg font-black text-slate-900 block leading-tight">
            {totalUserDonated > 0 ? `R$ ${Math.round(totalUserDonated)}` : 'R$ 0'}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Doado</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1.5">
            <Gift size={16} />
          </div>
          <span className="text-lg font-black text-slate-900 block leading-tight">1.240</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Refeições</span>
        </div>
      </div>

      {/* Minhas Crianças (Horizontal Swipeable Section) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
            <Heart className="text-rose-500" size={18} fill="currentColor" /> Minhas Crianças
          </h3>
          <Link
            to="/portal/sponsorship"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
          >
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {sponsoredChildren.map((child) => (
            <div
              key={child.id}
              onClick={() => navigate('/portal/sponsorship')}
              className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-amber-200 shadow-xs transition-all flex items-center gap-4 cursor-pointer active:scale-[0.99]"
            >
              <img
                src={child.img}
                alt={child.name}
                className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm truncate">
                    {child.name}, {child.age}
                  </h4>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${child.statusColor}`}>
                    {child.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  Aldeia de {child.village}
                </p>
                <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1 truncate">
                  <Activity size={12} /> {child.lastUpdate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Destaque do Blog */}
      {latestPost && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <Newspaper className="text-blue-500" size={18} /> Do Blog da YAH Hope
            </h3>
            <Link
              to="/portal/blog"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
            >
              Ler mais <ChevronRight size={14} />
            </Link>
          </div>

          <div
            onClick={() => navigate(`/portal/blog`)}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:border-amber-200 transition-all cursor-pointer"
          >
            <div className="h-36 w-full relative overflow-hidden">
              <img
                src={latestPost.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'}
                alt={latestPost.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                {latestPost.category}
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                {latestPost.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                {latestPost.excerpt}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{latestPost.author}</span>
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  Ler artigo <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed de Impacto / Atualizações de Campo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
            <TrendingUp className="text-emerald-500" size={18} /> Atualizações de Campo
          </h3>
          <Link
            to="/portal/projects"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
          >
            Ver projetos <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {publishedImpact.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-xs text-slate-400">
              Nenhuma atualização de campo recente.
            </div>
          ) : (
            publishedImpact.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {item.type === 'child' ? 'Criança' : item.type === 'project' ? 'Projeto' : 'Geral'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-sm leading-snug">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
