import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Activity, 
  MapPin, 
  Gift, 
  ArrowRight, 
  Calendar, 
  Search, 
  CheckCircle2, 
  X, 
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp,
  FileText,
  Star
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePatients } from '../../../contexts/PatientContext';
import { sponsorshipService, ChildSponsorshipDetail } from '../../../services/sponsorshipService';
import { Link, useNavigate } from 'react-router-dom';

export function MobileDonorChildren() {
  const { user } = useAuth();
  const { patients, events } = usePatients();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [myChildren, setMyChildren] = useState<ChildSponsorshipDetail[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [childToCancel, setChildToCancel] = useState<{ id: string; name: string; sponsorshipId?: string } | null>(null);
  const [isCancelingChild, setIsCancelingChild] = useState(false);

  const refreshChildren = () => {
    setIsLoadingChildren(true);
    sponsorshipService.getSponsoredChildrenForUser(user?.id, user?.email)
      .then(children => {
        setMyChildren(children);
        setIsLoadingChildren(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoadingChildren(false);
      });
  };

  useEffect(() => {
    refreshChildren();
  }, [user?.id, user?.email]);

  const childIdToSponsorshipId = useMemo(() => {
    const map = new Map<string, string>();
    myChildren.forEach(c => {
      if (c.sponsorshipId) map.set(c.id, c.sponsorshipId);
    });
    return map;
  }, [myChildren]);

  const handleConfirmCancelChild = async () => {
    if (!childToCancel) return;
    setIsCancelingChild(true);

    try {
      const res = await sponsorshipService.cancelChildSponsorship(
        childToCancel.sponsorshipId,
        childToCancel.id,
        user?.id,
        user?.email
      );

      if (res.success) {
        alert(res.message);
        setChildToCancel(null);
        setSelectedChild(null);
        refreshChildren();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Erro ao cancelar apadrinhamento.');
    } finally {
      setIsCancelingChild(false);
    }
  };

  // Calcula idade a partir do dob
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

  // Obtém histórico de evolução de peso a partir dos eventos clínicos
  const getChildWeights = (childId: string) => {
    const childEvents = events
      .filter(e => e.child_id === childId && e.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (childEvents.length === 0) {
      return { initial: 'N/A', current: 'Em triagem' };
    }
    const initial = `${childEvents[0].weight} kg`;
    const current = `${childEvents[childEvents.length - 1].weight} kg`;
    return { initial, current };
  };

  const isDonorOrSponsor = user?.role === 'SPONSOR' || (user?.role !== 'ADMIN' && user?.role !== 'USER');
  const myChildIds = useMemo(() => new Set(myChildren.map(c => c.id)), [myChildren]);

  // Fonte de dados de pacientes com segregação estrita:
  // Se for mantenedor/padrinho, EXCLUSIVAMENTE as crianças que ele apadrinha!
  const basePatients = useMemo(() => {
    if (isDonorOrSponsor) {
      const fromPatients = patients.filter(c => myChildIds.has(c.id));
      if (fromPatients.length > 0) return fromPatients;
      return myChildren.map(c => ({
        id: c.id,
        name: c.name,
        dob: c.dob || '',
        status: (c.nutritional_status || 'Adequado') as any,
        community: c.community || 'Casa Nutri',
        photo_url: c.photo_url,
        registration_number: '',
        gender: (c.gender || 'M') as any,
        created_at: '',
        guardian_name: '',
        housing_type: '',
        sanitation: ''
      }));
    }
    return patients;
  }, [isDonorOrSponsor, patients, myChildIds, myChildren]);

  const filteredPatients = useMemo(() => {
    return basePatients.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.community && c.community.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.registration_number && c.registration_number.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'mine') return myChildIds.has(c.id);
      return c.status === statusFilter;
    });
  }, [basePatients, searchQuery, statusFilter, myChildIds]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-gotham-bold text-[#F49853] uppercase tracking-widest block mb-1">
            Casa Nutri • YAH Hope
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Heart className="text-[#F49853]" size={32} fill="currentColor" /> 
            {isDonorOrSponsor ? 'Minhas Crianças Apadrinhadas' : 'Crianças em Acompanhamento'}
          </h2>
          <p className="text-sm text-slate-500 font-gotham-light mt-1">
            {isDonorOrSponsor 
              ? 'Acompanhe a recuperação nutricional, fotos e relatórios da(s) criança(s) sob seu apadrinhamento.' 
              : 'Conheça as vidas atendidas e acompanhe a evolução nutricional em tempo real.'}
          </p>
        </div>

        {/* Ações e Alternador de Abas */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 self-start md:self-auto">
          {/* Alternador de Abas idêntico ao de Doações */}
          <div className="flex bg-slate-200/70 p-1 rounded-2xl">
            <Link
              to="/portal/apadrinhar"
              className="px-4 py-2 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-800"
            >
              <Heart size={14} className="text-[#F49853]" />
              <span>Apadrinhar Criança</span>
            </Link>
            <button
              className="px-4 py-2 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white text-slate-900 shadow-xs"
            >
              <Users size={14} className="text-slate-600" />
              <span>Minhas Crianças</span>
            </button>
          </div>

          {/* Total Badge */}
          <div className="bg-orange-50 border border-orange-200/80 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Users size={16} className="text-[#F49853]" />
            <span className="text-xs font-gotham-bold text-slate-800">
              {basePatients.length} {isDonorOrSponsor 
                ? (basePatients.length === 1 ? 'Apadrinhada' : 'Apadrinhadas') 
                : (basePatients.length === 1 ? 'Cadastrada' : 'Cadastradas')}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, registro ou comunidade..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F49853]/20 focus:border-[#F49853] transition-all shadow-2xs font-gotham-medium"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-gotham-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isDonorOrSponsor ? `Todas (${basePatients.length})` : `Todos (${basePatients.length})`}
          </button>
          {!isDonorOrSponsor && myChildren.length > 0 && (
            <button
              onClick={() => setStatusFilter('mine')}
              className={`px-4 py-2.5 rounded-xl text-xs font-gotham-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'mine'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Star size={13} className="fill-current" />
              Minhas Crianças ({myChildren.length})
            </button>
          )}
          <button
            onClick={() => setStatusFilter('DAM')}
            className={`px-4 py-2.5 rounded-xl text-xs font-gotham-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'DAM'
                ? 'bg-[#F49853] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Em Tratamento (DAM)
          </button>
          <button
            onClick={() => setStatusFilter('Adequado')}
            className={`px-4 py-2.5 rounded-xl text-xs font-gotham-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'Adequado'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Recuperadas
          </button>
        </div>
      </div>

      {/* Grid de Crianças Responsivo (1 col mobile, 2 sm, 3 lg) */}
      {isLoadingChildren ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-slate-400">
          <p className="font-bold text-slate-600">Carregando dados das crianças...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        isDonorOrSponsor && basePatients.length === 0 ? (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/80 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-[#F49853] shadow-xs">
              <Heart size={32} />
            </div>
            <h4 className="font-heading font-black text-slate-900 text-xl">
              Você ainda não possui crianças apadrinhadas
            </h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Com o apadrinhamento solidário, você garante acompanhamento clínico, alimentação especial e recebe fotos e relatórios de evolução exclusivos da sua criança.
            </p>
            <div>
              <Link
                to="/portal/apadrinhar"
                className="inline-flex items-center gap-2 bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-3 rounded-xl font-gotham-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                <Heart size={16} fill="currentColor" />
                <span>Apadrinhar uma Criança Agora</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <h4 className="font-heading font-black text-slate-700 text-base">Nenhum registro encontrado</h4>
            <p className="text-xs text-slate-500 mt-1 font-gotham-light">
              Tente buscar com outros termos ou limpe os filtros para visualizar os dados.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((child) => {
            const weights = getChildWeights(child.id);
            const isRecovered = child.status === 'Adequado' || child.status === 'Alta';

            return (
              <div
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-orange-300 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Banner Card com Avatar Institucional ou Foto Real */}
                  <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/20 text-[#F49853] font-heading font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {child.photo_url ? (
                          <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          child.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {myChildIds.has(child.id) && (
                          <span className="text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                            <Star size={10} className="fill-current" />
                            Apadrinhado
                          </span>
                        )}
                        <span className={`text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isRecovered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {child.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-heading font-black text-white leading-tight">
                        {child.name}
                      </h3>
                      <p className="text-xs text-slate-300 font-gotham-light flex items-center gap-1.5 mt-1">
                        <MapPin size={12} className="text-[#F49853]" />
                        <span>{child.community || 'Aldeia Boane'} • {calculateAge(child.dob)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Detalhes Antropométricos e Contexto */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-gotham-bold uppercase text-slate-400 block">Peso Inicial</span>
                        <span className="text-xs font-black text-slate-800">{weights.initial}</span>
                      </div>
                      <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
                        <span className="text-[10px] font-gotham-bold uppercase text-[#F49853] block">Peso Atual</span>
                        <span className="text-xs font-black text-slate-900">{weights.current}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-gotham-light">
                      <p>
                        <strong>Responsável:</strong> {child.guardian_name || 'Familiar'}
                      </p>
                      <p className="mt-0.5">
                        <strong>Registro Casa Nutri:</strong> {child.registration_number || 'YAH-2026'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer do Card */}
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-gotham-bold text-[#F49853] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Ver ficha nutricional <ArrowRight size={13} />
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-gotham-bold px-2.5 py-1 rounded-lg">
                    Casa Nutri
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes da Criança */}
      {selectedChild && (() => {
        const child = selectedChild;
        const weights = getChildWeights(child.id);
        const isRecovered = child.status === 'Adequado' || child.status === 'Alta';

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative max-h-[90vh] flex flex-col">
              
              {/* Header do Modal */}
              <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 text-white flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-orange-100 text-[#F49853] font-heading font-black text-2xl flex items-center justify-center shrink-0 border border-white/20">
                    {child.photo_url ? (
                      <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
                    ) : (
                      child.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-black text-white leading-tight">
                      {child.name}
                    </h3>
                    <p className="text-xs text-slate-300 font-gotham-light mt-0.5">
                      {calculateAge(child.dob)} • {child.community || 'Casa Nutri'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChild(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-6 space-y-5 overflow-y-auto">
                {child.photo_url && (
                  <div className="w-full h-52 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
                    <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-xs font-gotham-bold text-slate-500 uppercase tracking-wider">
                    Status Nutricional Atual:
                  </span>
                  <span className={`text-xs font-gotham-bold uppercase px-3 py-1 rounded-full ${
                    isRecovered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {child.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-gotham-bold uppercase text-slate-400 block mb-1">Peso de Entrada</span>
                    <span className="text-base font-black text-slate-800">{weights.initial}</span>
                  </div>
                  <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-100">
                    <span className="text-[10px] font-gotham-bold uppercase text-[#F49853] block mb-1">Última Aferição</span>
                    <span className="text-base font-black text-slate-900">{weights.current}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs text-slate-600 font-gotham-light">
                  <p><strong>Cuidador / Responsável:</strong> {child.guardian_name || 'Familiar Cadastrado'}</p>
                  <p><strong>Localidade:</strong> {child.community || 'Aldeia em Moçambique'}</p>
                  <p><strong>Número de Registro Clínico:</strong> {child.registration_number || 'YAH-2026'}</p>
                </div>

                {/* Bloco de Apadrinhamento Ativo */}
                {myChildIds.has(child.id) ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-[#F49853] block">
                          Apadrinhamento Ativo
                        </span>
                        <p className="text-xs text-slate-800 font-gotham-bold mt-0.5">
                          Cota Mensal: R$ 90,00/mês
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChildToCancel({ 
                          id: child.id, 
                          name: child.name, 
                          sponsorshipId: childIdToSponsorshipId.get(child.id) 
                        })}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-gotham-bold transition-all cursor-pointer shadow-2xs"
                      >
                        Cancelar Apadrinhamento
                      </button>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <Link
                        to="/portal/apadrinhar"
                        onClick={() => setSelectedChild(null)}
                        className="flex-1 py-3.5 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Heart size={16} fill="currentColor" />
                        <span>Apadrinhar Mais Crianças (+R$ 90/mês)</span>
                      </Link>
                      <button
                        onClick={() => setSelectedChild(null)}
                        className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Botões de Ação para quem não é padrinho desta criança */
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/portal/apadrinhar"
                      onClick={() => setSelectedChild(null)}
                      className="flex-1 py-3.5 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Heart size={16} fill="currentColor" />
                      <span>Apadrinhar Esta Criança</span>
                    </Link>
                    <button
                      onClick={() => setSelectedChild(null)}
                      className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Modal de Confirmação para Cancelar Apadrinhamento de Criança */}
      {childToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative flex flex-col">
            <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <X size={20} />
                </div>
                <h3 className="text-lg font-heading font-black text-white">
                  Cancelar Apadrinhamento
                </h3>
              </div>
              <button
                onClick={() => setChildToCancel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
                <p className="font-gotham-bold text-sm">
                  Deseja realmente cancelar o apadrinhamento de {childToCancel.name}?
                </p>
                <p className="font-gotham-light leading-relaxed">
                  Ao confirmar, a cota mensal de R$ 90,00 deixará de ser cobrada no seu plano e a vaga da criança será liberada na Casa Nutri para acolhimento por outro padrinho.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleConfirmCancelChild}
                  disabled={isCancelingChild}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span>{isCancelingChild ? 'Cancelando...' : 'Confirmar Cancelamento'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChildToCancel(null)}
                  className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
