import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePatients } from '../../../contexts/PatientContext';
import { Link, useNavigate } from 'react-router-dom';

export function MobileDonorChildren() {
  const { user } = useAuth();
  const { patients, events } = usePatients();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedChild, setSelectedChild] = useState<any | null>(null);

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

  const filteredPatients = patients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.community && c.community.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.registration_number && c.registration_number.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && c.status === statusFilter;
  });

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
            Crianças em Acompanhamento
          </h2>
          <p className="text-sm text-slate-500 font-gotham-light mt-1">
            Conheça as vidas atendidas e acompanhe a evolução nutricional em tempo real.
          </p>
        </div>

        {/* Total Badge */}
        <div className="bg-orange-50 border border-orange-200/80 px-4 py-2 rounded-2xl flex items-center gap-2 self-start md:self-auto">
          <Users size={16} className="text-[#F49853]" />
          <span className="text-xs font-gotham-bold text-slate-800">
            {patients.length} {patients.length === 1 ? 'Criança Cadastrada' : 'Crianças Cadastradas'}
          </span>
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
            Todos ({patients.length})
          </button>
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
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
          <h4 className="font-heading font-black text-slate-700 text-base">Nenhum registro encontrado</h4>
          <p className="text-xs text-slate-500 mt-1 font-gotham-light">
            Tente buscar com outros termos ou limpe os filtros para visualizar todas as crianças.
          </p>
        </div>
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
                  {/* Top Banner Card com Avatar Institucional */}
                  <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-[#F49853] font-heading font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        isRecovered
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {child.status}
                      </span>
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
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#F49853] font-heading font-black text-2xl flex items-center justify-center">
                    {child.name.charAt(0).toUpperCase()}
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

                {/* Botões de Ação */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/portal/donations"
                    onClick={() => setSelectedChild(null)}
                    className="flex-1 py-3.5 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
                  >
                    <Heart size={16} fill="currentColor" />
                    <span>Apoiar Tratamento Mensal</span>
                  </Link>
                  <button
                    onClick={() => setSelectedChild(null)}
                    className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
