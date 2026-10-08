import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useImpact } from '../../contexts/ImpactContext';
import { sponsorshipService, ChildSponsorshipDetail } from '../../services/sponsorshipService';
import { Heart, Calendar, ArrowRight, Gift, Activity, Star, MessageCircle, BarChart3, TrendingUp, ShoppingBag, Newspaper, ShieldCheck, Briefcase, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function SponsorDashboard() {
  const { user } = useAuth();
  const { getPublishedItems } = useImpact();
  const [myChildren, setMyChildren] = useState<ChildSponsorshipDetail[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [feedFilter, setFeedFilter] = useState<'all' | 'news' | 'my_children'>('all');

  useEffect(() => {
    sponsorshipService.getSponsoredChildrenForUser(user?.id, user?.email)
      .then(children => {
        setMyChildren(children);
        setIsLoadingChildren(false);
      })
      .catch(err => {
        console.error('Erro ao carregar crianças apadrinhadas:', err);
        setIsLoadingChildren(false);
      });
  }, [user?.id, user?.email]);

  const impactStats = [
    { label: 'Refeições Providas', value: '1,240', icon: Gift, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Consultas Médicas', value: '12', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Crianças Apadrinhadas', value: myChildren.length.toString(), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100' },
    { label: 'Horas de Educação', value: '450', icon: Star, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  // Filtro de Privacidade Estrita (LGPD e Regra de Padrinhos)
  const visibleFeedItems = useMemo(() => {
    const published = getPublishedItems();

    return published.filter(item => {
      // 1. Notícias de criança específica: APENAS padrinhos daquela criança veem
      if (item.type === 'child') {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'USER';
        if (isAdmin) return true;

        const targetText = (item.child || item.title).toLowerCase();
        const isMyChild = myChildren.some(c => 
          targetText.includes(c.name.toLowerCase()) || 
          (c.id && targetText.includes(c.id.toLowerCase()))
        );

        if (!isMyChild) return false;
      }

      // 2. Filtro de abas
      if (feedFilter === 'news') return item.type !== 'child';
      if (feedFilter === 'my_children') return item.type === 'child';
      return true;
    });
  }, [getPublishedItems, myChildren, feedFilter, user?.role]);

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bem-vindo à Família, <span className="text-amber-500">{user?.name}</span>!</h1>
          <p className="text-slate-500 mt-2 font-medium">Sua proximidade transforma realidades todos os dias.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/mantenedor?mode=sponsorship" className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2">
            <Plus size={20} /> Apadrinhar Mais Crianças
          </Link>
        </div>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {impactStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Feed Side */}
        <div className="lg:col-span-2 space-y-8">
          {/* My Sponsored Children */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Heart className="text-rose-500" size={24} fill="currentColor" /> Minhas Crianças ({myChildren.length})
              </h3>
              <Link to="/portal/sponsorship" className="text-amber-600 font-bold text-sm hover:underline">Ver todas</Link>
            </div>

            {isLoadingChildren ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 font-medium">
                Carregando suas crianças apadrinhadas...
              </div>
            ) : myChildren.length === 0 ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/80 p-8 rounded-[2.5rem] text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-sm">
                  <Heart size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-900">
                  Você ainda não possui crianças apadrinhadas
                </h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Com cotas solidárias a partir de R$ 90/mês, você garante nutrição clínica intensiva e recebe notícias e fotos exclusivas da sua criança.
                </p>
                <Link
                  to="/mantenedor?mode=sponsorship"
                  className="inline-flex items-center gap-2 bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all"
                >
                  <Plus size={16} />
                  <span>Apadrinhar Agora</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myChildren.map(child => (
                  <div key={child.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                      <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-slate-900 truncate">{child.name}</h4>
                      <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">{child.ageText}</p>
                      <p className="text-slate-400 text-[11px] truncate">{child.community}</p>
                      <Link to="/portal/sponsorship" className="text-slate-700 hover:text-amber-600 text-xs font-black flex items-center gap-1 mt-2 transition-all">
                        Ver Evolução <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Updates Timeline (Impact Feed com Segregação Estrita de Notícias) */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={24} /> Feed de Impacto & Notícias
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Notícias e relatórios clínicos exclusivos das crianças ligadas ao seu perfil
                </p>
              </div>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setFeedFilter('all')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all",
                    feedFilter === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Tudo
                </button>
                <button 
                  onClick={() => setFeedFilter('news')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all",
                    feedFilter === 'news' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Geral
                </button>
                <button 
                  onClick={() => setFeedFilter('my_children')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all",
                    feedFilter === 'my_children' ? "bg-[#F49853] text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Minhas Crianças ({myChildren.length})
                </button>
              </div>
            </div>
            
            <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {visibleFeedItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium text-sm">
                  {feedFilter === 'my_children' 
                    ? 'Nenhuma notícia individual publicada ainda para suas crianças apadrinhadas.' 
                    : 'Nenhum impacto publicado ainda nesta seção.'}
                </div>
              ) : visibleFeedItems.map((item, idx) => {
                  const Icon = item.type === 'child' ? Activity : item.type === 'project' ? Briefcase : Newspaper;
                  const color = item.type === 'child' ? 'bg-amber-100 text-amber-600' : item.type === 'project' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600';
                  return (
                    <div key={idx} className="relative pl-12 group">
                      <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl ${color} flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110`}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-slate-900 group-hover:text-amber-600 transition-colors">{item.title}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
                          </div>
                          {item.type === 'child' && (
                            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                              <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider">Exclusivo do Padrinho</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.content}</p>
                        
                        {item.img && (
                          <div className="rounded-2xl overflow-hidden aspect-video relative max-w-sm">
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-1">
                          <Link to="/portal/messages" className="text-slate-400 hover:text-amber-500 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest transition-colors">
                            <MessageCircle size={14} /> Enviar Mensagem
                          </Link>
                          <Link to="/portal/gifts" className="text-slate-400 hover:text-amber-500 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest transition-colors">
                            <Gift size={14} /> Enviar Presente
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Sidebar Side */}
        <div className="space-y-8">
          {/* Quick Actions Card */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-[80px] opacity-20"></div>
            <h3 className="text-xl font-black mb-6 relative z-10">Loja Solidária</h3>
            <p className="text-slate-400 text-sm mb-8 relative z-10">Novos artesanatos chegaram de Moçambique! Cada compra gera impacto imediato.</p>
            <Link to="/portal/shop" className="bg-amber-500 hover:bg-amber-600 text-white w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all group">
              Explorar Loja <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
            </Link>
          </div>

          {/* My Impact Meter */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 className="text-indigo-500" size={20} /> Meu Ranking Social
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nível de Impacto</p>
                  <p className="text-2xl font-black text-slate-900">Embaixador Ouro</p>
                </div>
                <Star className="text-amber-400" size={32} fill="currentColor" />
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-4/5 h-full bg-gradient-to-r from-amber-400 to-amber-600"></div>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Você está entre os **5% dos apoiadores** com maior impacto este mês. Continue assim!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

