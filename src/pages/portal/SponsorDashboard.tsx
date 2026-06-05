import { useAuth } from '../../contexts/AuthContext';
import { useImpact } from '../../contexts/ImpactContext';
import { Heart, Calendar, ArrowRight, Gift, Activity, Star, MessageCircle, BarChart3, TrendingUp, ShoppingBag, Newspaper, ShieldCheck, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SponsorDashboard() {
  const { user } = useAuth();
  const { getPublishedItems } = useImpact();

  const impactStats = [
    { label: 'Refeições Providas', value: '1,240', icon: Gift, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Consultas Médicas', value: '12', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Crianças Apadrinhadas', value: '2', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100' },
    { label: 'Horas de Educação', value: '450', icon: Star, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bem-vindo à Família, <span className="text-amber-500">{user?.name}</span>!</h1>
          <p className="text-slate-500 mt-2 font-medium">Sua proximidade transforma realidades todos os dias.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={20} />
          </button>
          <Link to="/campanha" className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2">
            <Gift size={20} /> Doação Extra
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
                <Heart className="text-rose-500" size={24} fill="currentColor" /> Minhas Crianças
              </h3>
              <Link to="/portal/sponsorship" className="text-amber-600 font-bold text-sm hover:underline">Ver todas</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Kofi', age: '4 anos', img: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=2070&auto=format&fit=crop', status: 'Em Recuperação' },
                { name: 'Amara', age: '6 anos', img: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=1974&auto=format&fit=crop', status: 'Estável' }
              ].map(child => (
                <div key={child.name} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                    <img src={child.img} alt={child.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-900">{child.name}, {child.age}</h4>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{child.status}</p>
                    <button className="text-amber-600 text-xs font-black flex items-center gap-1 hover:gap-2 transition-all">
                      Ver Detalhes <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Updates Timeline (Impact Feed) */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={24} /> Feed de Impacto
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full">Tudo</span>
                <span className="px-3 py-1 text-slate-400 text-[10px] font-black uppercase rounded-full hover:bg-slate-50 cursor-pointer transition-colors">Notícias</span>
                <span className="px-3 py-1 text-slate-400 text-[10px] font-black uppercase rounded-full hover:bg-slate-50 cursor-pointer transition-colors">Minhas Crianças</span>
              </div>
            </div>
            
            <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {getPublishedItems().length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium">Nenhum impacto publicado ainda.</div>
              ) : getPublishedItems().map((item, idx) => {
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
                            <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                              <span className="text-[9px] font-black text-amber-700 uppercase">Privado</span>
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

