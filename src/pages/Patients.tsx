import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, ChevronRight, X, User, MapPin, Activity } from 'lucide-react';
import { calculateAge, cn } from '../lib/utils';
import { usePatients } from '../contexts/PatientContext';
import { StatusBadge } from '../components/StatusBadge';

export function Patients() {
  const { patients, events } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCommunity, setFilterCommunity] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');

  const communities = useMemo(() => {
    const list = new Set(patients.map(p => p.community));
    return ['All', ...Array.from(list)];
  }, [patients]);

  const statuses = ['All', 'Adequado', 'Risco', 'DAM', 'DAG', 'Alta'];

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    const matchesCommunity = filterCommunity === 'All' || p.community === filterCommunity;
    const matchesGender = filterGender === 'All' || p.gender === filterGender;

    return matchesSearch && matchesStatus && matchesCommunity && matchesGender;
  });

  const clearFilters = () => {
    setFilterStatus('All');
    setFilterCommunity('All');
    setFilterGender('All');
    setSearchTerm('');
  };

  const activeFiltersCount = [
    filterStatus !== 'All',
    filterCommunity !== 'All',
    filterGender !== 'All'
  ].filter(Boolean).length;

  const getNextReturnDate = (patientId: string) => {
    const patientEvents = events
      .filter(e => e.patient_id === patientId && e.return_date)
      .sort((a, b) => new Date(b.return_date!).getTime() - new Date(a.return_date!).getTime());
    
    if (patientEvents.length === 0) return '--';
    
    // Check if the return date is in the past
    const returnDate = new Date(patientEvents[0].return_date!);
    const isOverdue = returnDate < new Date(new Date().setHours(0,0,0,0));
    
    return {
      date: returnDate.toLocaleDateString('pt-BR'),
      isOverdue
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Crianças</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestão de prontuários e acompanhamentos</p>
        </div>
        <Link 
          to="/nutrition/patients/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95"
        >
          <Plus size={20} />
          Novo Cadastro
        </Link>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou ID..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all shadow-sm active:scale-95 border relative",
                showFilters || activeFiltersCount > 0
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-200" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Filter size={20} />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] border-2 border-white shadow-md">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-200 animate-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} className="text-emerald-500" /> Status Nutricional
                  </label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-sm text-slate-600 appearance-none"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s === 'All' ? 'Todos os Status' : s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} className="text-blue-500" /> Comunidade
                  </label>
                  <select 
                    value={filterCommunity}
                    onChange={(e) => setFilterCommunity(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-sm text-slate-600 appearance-none"
                  >
                    {communities.map(c => (
                      <option key={c} value={c}>{c === 'All' ? 'Todas as Comunidades' : c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} className="text-purple-500" /> Gênero
                  </label>
                  <div className="flex bg-white p-1 border border-slate-200 rounded-xl">
                    {['All', 'M', 'F'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setFilterGender(g)}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                          filterGender === g 
                            ? "bg-slate-900 text-white shadow-md" 
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {g === 'All' ? 'Todos' : g === 'M' ? 'Masc.' : 'Fem.'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center bg-slate-100/50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Mostrando {filteredPatients.length} de {patients.length} registros
                </p>
                <button 
                  onClick={clearFilters}
                  className="text-xs font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-2"
                >
                  <X size={14} /> Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-slate-100">
                <th className="p-6">ID / Nome da Criança</th>
                <th className="p-6">Idade</th>
                <th className="p-6">Comunidade</th>
                <th className="p-6">Status Nutricional</th>
                <th className="p-6 text-center">Data do Retorno</th>
                <th className="p-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-emerald-50/30 transition-all group/row">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg shadow-sm border border-emerald-200/50 group-hover/row:scale-110 transition-transform">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover/row:text-emerald-700 transition-colors">{patient.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.registration_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-sm font-semibold text-slate-600">{calculateAge(patient.dob)}</td>
                  <td className="p-6 text-sm font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                       {patient.community}
                    </div>
                  </td>
                  <td className="p-6">
                    <StatusBadge status={patient.status} />
                  </td>
                  <td className="p-6 text-center">
                    {(() => {
                      const ret = getNextReturnDate(patient.id);
                      if (ret === '--') return <span className="text-slate-400 font-medium">--</span>;
                      return (
                        <span className={cn(
                          "px-3 py-1 rounded-xl text-[11px] font-bold shadow-sm inline-block",
                          ret.isOverdue 
                            ? "bg-red-50 text-red-600 border border-red-100" 
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        )}>
                          {ret.date}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-6 text-right">
                    <Link 
                      to={`/nutrition/patients/${patient.id}`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-90"
                    >
                      <ChevronRight size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={40} className="text-slate-200" />
                      <p className="text-slate-400 font-medium">Nenhuma criança encontrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

