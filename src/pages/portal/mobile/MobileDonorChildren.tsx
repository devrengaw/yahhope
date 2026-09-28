import React, { useState } from 'react';
import { 
  Heart, 
  Activity, 
  MapPin, 
  Gift, 
  MessageCircle, 
  ArrowRight, 
  Calendar, 
  Search, 
  CheckCircle2, 
  X, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Child {
  id: string;
  name: string;
  age: string;
  village: string;
  need: string;
  status: 'Recuperada' | 'Em tratamento' | 'Acompanhamento';
  statusColor: string;
  weight: string;
  initialWeight: string;
  height: string;
  story: string;
  img: string;
  isSponsoredByMe?: boolean;
}

export function MobileDonorChildren() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [sponsorSuccess, setSponsorSuccess] = useState(false);

  const childrenData: Child[] = [
    {
      id: '1',
      name: 'Abidemi',
      age: '5 anos',
      village: 'Aldeia de Boane',
      need: 'Nutrição Terapêutica & Acompanhamento',
      status: 'Recuperada',
      statusColor: 'bg-emerald-100 text-emerald-800',
      weight: '15.2 kg',
      initialWeight: '11.4 kg',
      height: '102 cm',
      story: 'Abidemi chegou à Casa Nutri com desnutrição moderada. Hoje, graças ao suporte contínuo e alimentação balanceada, recuperou seu peso saudável e participa ativamente das atividades escolares.',
      img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=800&auto=format&fit=crop',
      isSponsoredByMe: true
    },
    {
      id: '2',
      name: 'Farai',
      age: '3 anos',
      village: 'Aldeia de Matola',
      need: 'Suplementação & Saúde Básica',
      status: 'Em tratamento',
      statusColor: 'bg-amber-100 text-amber-800',
      weight: '11.8 kg',
      initialWeight: '9.2 kg',
      height: '88 cm',
      story: 'Farai está em seu 4º mês de acompanhamento nutricional na Casa Nutri. Já apresentou ganho constante de massa muscular e suas consultas pediátricas estão em dia.',
      img: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=800&auto=format&fit=crop',
      isSponsoredByMe: true
    },
    {
      id: '3',
      name: 'Juma',
      age: '6 anos',
      village: 'Aldeia de Boane',
      need: 'Apoio Escolar e Alimentação',
      status: 'Acompanhamento',
      statusColor: 'bg-blue-100 text-blue-800',
      weight: '17.5 kg',
      initialWeight: '14.0 kg',
      height: '110 cm',
      story: 'Juma sonha em ser professor na sua aldeia. É um garoto dedicado e comunicativo que recebe suplementação alimentar semanal.',
      img: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=800&auto=format&fit=crop',
      isSponsoredByMe: false
    },
    {
      id: '4',
      name: 'Nala',
      age: '4 anos',
      village: 'Aldeia de Xai-Xai',
      need: 'Nutrição Especializada',
      status: 'Em tratamento',
      statusColor: 'bg-amber-100 text-amber-800',
      weight: '12.0 kg',
      initialWeight: '9.8 kg',
      height: '92 cm',
      story: 'Nala precisa de apoio diário na alimentação na creche comunitária para atingir a meta da curva de crescimento ideal.',
      img: 'https://images.unsplash.com/photo-1485199692108-c3b5069de6a0?q=80&w=800&auto=format&fit=crop',
      isSponsoredByMe: false
    },
    {
      id: '5',
      name: 'Osei',
      age: '7 anos',
      village: 'Aldeia de Matola',
      need: 'Desenvolvimento e Nutrição',
      status: 'Recuperada',
      statusColor: 'bg-emerald-100 text-emerald-800',
      weight: '21.0 kg',
      initialWeight: '16.5 kg',
      height: '118 cm',
      story: 'Osei concluiu seu ciclo inicial com honras! Agora participa dos projetos de recreação e apoio pedagógico da YAH Hope.',
      img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop',
      isSponsoredByMe: false
    }
  ];

  const myChildren = childrenData.filter(c => c.isSponsoredByMe);
  const availableChildren = childrenData.filter(c => !c.isSponsoredByMe);

  const displayedList = activeTab === 'my' ? myChildren : availableChildren;
  const filteredList = displayedList.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSponsorConfirm = () => {
    setSponsorSuccess(true);
    setTimeout(() => {
      setSponsorSuccess(false);
      setSelectedChild(null);
      setActiveTab('my');
    }, 2000);
  };

  return (
    <div className="space-y-5">
      {/* Title & Tabs */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Heart className="text-rose-500" size={24} fill="currentColor" /> Crianças
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Acompanhe a evolução de quem você apadrinha e conheça novas histórias.
        </p>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'my'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Heart size={14} fill={activeTab === 'my' ? 'currentColor' : 'none'} className="text-rose-500" />
          Minhas ({myChildren.length})
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'explore'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles size={14} className="text-amber-500" />
          Apadrinhar Novas ({availableChildren.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome ou aldeia..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
        />
      </div>

      {/* Children Cards List */}
      <div className="space-y-4">
        {filteredList.map((child) => (
          <div
            key={child.id}
            onClick={() => setSelectedChild(child)}
            className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs hover:border-amber-200 transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className="relative h-44 w-full">
              <img
                src={child.img}
                alt={child.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

              <span className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${child.statusColor}`}>
                {child.status}
              </span>

              <div className="absolute bottom-3 left-4 text-white">
                <h3 className="text-xl font-black">{child.name}, {child.age}</h3>
                <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-amber-400" /> {child.village}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {child.story}
              </p>

              {/* Antropometric Badges */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Evolução Peso</span>
                  <span className="text-xs font-black text-slate-900">
                    {child.initialWeight} → <span className="text-emerald-600">{child.weight}</span>
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Altura</span>
                  <span className="text-xs font-black text-slate-900">{child.height}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                  Ver prontuário completo <ArrowRight size={13} />
                </span>
                {child.isSponsoredByMe && (
                  <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Heart size={10} fill="currentColor" /> Apadrinhada
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Child Detail Modal */}
      {selectedChild && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            {/* Header Image */}
            <div className="relative h-56 w-full">
              <img
                src={selectedChild.img}
                alt={selectedChild.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedChild(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-slate-900 transition-all"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <h3 className="text-2xl font-black">{selectedChild.name}, {selectedChild.age}</h3>
                <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                  <MapPin size={14} className="text-amber-400" /> {selectedChild.village}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {sponsorSuccess ? (
                <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                  <h4 className="text-base font-black text-emerald-900">Apadrinhamento Confirmado!</h4>
                  <p className="text-xs text-emerald-700">
                    Obrigado por transformar o futuro de {selectedChild.name}. Você receberá relatórios periódicos de saúde.
                  </p>
                </div>
              ) : (
                <>
                  {/* Status & Need */}
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                      Prioridade de Atendimento
                    </span>
                    <p className="text-xs font-bold text-amber-950 mt-1">
                      {selectedChild.need}
                    </p>
                  </div>

                  {/* Story */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      História & Contexto
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedChild.story}
                    </p>
                  </div>

                  {/* Clinical Indicators */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Indicadores Clínicos da Casa Nutri
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-slate-50 p-3 rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Peso Inicial</span>
                        <span className="text-sm font-black text-slate-700">{selectedChild.initialWeight}</span>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Peso Atual</span>
                        <span className="text-sm font-black text-emerald-700">{selectedChild.weight}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Altura</span>
                        <span className="text-sm font-black text-slate-700">{selectedChild.height}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    {selectedChild.isSponsoredByMe ? (
                      <div className="flex gap-2">
                        <Link
                          to="/portal/messages"
                          className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <MessageCircle size={16} /> Enviar Mensagem
                        </Link>
                        <Link
                          to="/portal/gifts"
                          className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                        >
                          <Gift size={16} /> Enviar Presente
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={handleSponsorConfirm}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <Heart size={16} fill="currentColor" />
                        <span>Apadrinhar {selectedChild.name} (R$ 89/mês)</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
