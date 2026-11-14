import { useState, useMemo, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, ChevronRight, X, User, MapPin, Activity, Building2, History, UserX, CheckCircle2 } from 'lucide-react';
import { calculateAge, cn, formatLocalDate } from '../lib/utils';
import { usePatients } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useAtendimento } from '../contexts/AtendimentoContext';
import { useVisits } from '../contexts/VisitContext';
import { useNotification } from '../contexts/NotificationContext';
import { evaluateNutritionalStatus } from '../lib/whoStandards';
import { differenceInMonths, addDays } from 'date-fns';
import { StatusBadge } from '../components/StatusBadge';
import { Patient, ClinicalEvent } from '../lib/mockData';

export function Patients() {
  const { patients, events, updatePatient, addEvent } = usePatients();
  const { agendarAtendimento } = useAtendimento();
  const { agendarVisita } = useVisits();
  const { sendNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCommunity, setFilterCommunity] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'ativas' | 'historico'>('ativas');
  const [historySubFilter, setHistorySubFilter] = useState<'all' | 'alta' | 'encerrado'>('all');

  // Hospital Discharge Modal in Patients list
  const [selectedHospitalizedPatient, setSelectedHospitalizedPatient] = useState<Patient | null>(null);
  const [hospDischargeDate, setHospDischargeDate] = useState(formatLocalDate(new Date()));
  const [hospDischargeStatus, setHospDischargeStatus] = useState<string>('Adequado');
  const [hospDischargeReturnDate, setHospDischargeReturnDate] = useState<string>(formatLocalDate(addDays(new Date(), 7)));
  const [hospDischargeWeight, setHospDischargeWeight] = useState<string>('');
  const [hospDischargeHeight, setHospDischargeHeight] = useState<string>('');
  const [hospDischargeNotes, setHospDischargeNotes] = useState('');
  const [isSavingDischarge, setIsSavingDischarge] = useState(false);

  const communities = useMemo(() => {
    const list = new Set(patients.map(p => p.community));
    return ['All', ...Array.from(list)];
  }, [patients]);

  const statuses = ['All', 'Adequado', 'Risco', 'DAM', 'DAG', 'Internada', 'Alta'];

  const isHistoryChild = (p: Patient) => {
    const isStatusHistory = p.status === 'Alta' || p.status === 'Encerrado' || p.status === 'Encerrada';
    if (isStatusHistory) return true;
    const pEvents = events.filter(e => e.patient_id === p.id);
    return pEvents.some(e => e.is_discharge || e.nutritional_status === 'Alta' || e.nutritional_status === 'Encerrado' || e.notes?.includes('[ATENDIMENTO ENCERRADO]'));
  };

  const getHistoryInfo = (p: Patient) => {
    const pEvents = events
      .filter(e => e.patient_id === p.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const closeEvent = pEvents.find(e => e.notes?.includes('[ATENDIMENTO ENCERRADO]') || e.nutritional_status === 'Encerrado' || e.nutritional_status === 'Encerrada');
    const dischargeEvent = pEvents.find(e => e.is_discharge || e.nutritional_status === 'Alta' || e.notes?.includes('[ALTA'));

    const isClosed = p.status === 'Encerrado' || p.status === 'Encerrada' || Boolean(closeEvent);
    const type: 'alta' | 'encerrado' = isClosed ? 'encerrado' : 'alta';
    const event = isClosed ? closeEvent : dischargeEvent;
    
    let reason = '--';
    if (closeEvent?.notes) {
      reason = closeEvent.notes.replace('[ATENDIMENTO ENCERRADO]', '').replace('Justificativa:', '').trim();
    } else if (dischargeEvent?.notes) {
      reason = dischargeEvent.notes.replace('[ALTA HOSPITALAR]', '').replace('[ALTA]', '').trim() || 'Completou recuperação nutricional e atingiu peso ideal';
    } else if (p.status === 'Alta') {
      reason = 'Alta por recuperação nutricional concluída';
    } else if (isClosed) {
      reason = 'Atendimento encerrado';
    }

    return {
      type,
      date: event?.date ? new Date(event.date).toLocaleDateString('pt-BR') : '--',
      reason: reason || '--'
    };
  };

  const activePatientsList = useMemo(() => patients.filter(p => !isHistoryChild(p)), [patients, events]);
  const historyPatientsList = useMemo(() => patients.filter(p => isHistoryChild(p)), [patients, events]);

  const sourcePatients = viewMode === 'historico' ? historyPatientsList : activePatientsList;

  const filteredPatients = sourcePatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (viewMode === 'historico') {
      const hInfo = getHistoryInfo(p);
      const matchesSubFilter = historySubFilter === 'all' || hInfo.type === historySubFilter;
      const matchesCommunity = filterCommunity === 'All' || p.community === filterCommunity;
      return matchesSearch && matchesSubFilter && matchesCommunity;
    }

    const matchesStatus = filterStatus === 'All' 
      || p.status === filterStatus 
      || (filterStatus === 'Internada' && (p.status === 'Internada' || p.status === 'Internado'));
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

  const getNextReturnDate = (patient: Patient) => {
    const pEvents = events
      .filter(e => e.patient_id === patient.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestEvent = pEvents[0];

    const isHospitalized = patient.status === 'Internada' || 
      patient.status === 'Internado' ||
      latestEvent?.nutritional_status === 'Internada' ||
      latestEvent?.nutritional_status === 'Internado' ||
      (latestEvent?.notes?.includes('[INTERNAÇÃO HOSPITALAR]') && !latestEvent?.notes?.includes('[ALTA HOSPITALAR]')) ||
      (latestEvent?.notes?.includes('Internada: Sim') && !latestEvent?.notes?.includes('[ALTA HOSPITALAR]'));

    if (isHospitalized) {
      return {
        date: 'Internada no Hospital',
        isHospitalized: true,
        isOverdue: false
      };
    }

    const patientEventsWithReturn = pEvents.filter(e => e.return_date);
    if (patientEventsWithReturn.length === 0) return { date: '--', isHospitalized: false, isOverdue: false };
    
    // Check if the return date is in the past
    const returnDate = new Date(patientEventsWithReturn[0].return_date!);
    const isOverdue = returnDate < new Date(new Date().setHours(0,0,0,0));
    
    return {
      date: returnDate.toLocaleDateString('pt-BR'),
      isHospitalized: false,
      isOverdue
    };
  };

  const handleOpenDischarge = (p: Patient) => {
    setSelectedHospitalizedPatient(p);
    setHospDischargeDate(formatLocalDate(new Date()));
    const pEvents = events.filter(e => e.patient_id === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestWeight = pEvents.find(e => e.weight !== undefined)?.weight;
    const latestHeight = pEvents.find(e => e.height !== undefined)?.height;
    let suggestedStatus = 'Adequado';
    if (latestWeight && latestHeight) {
      const evalRes = evaluateNutritionalStatus({
        weight: Number(latestWeight),
        height: Number(latestHeight),
        gender: p.gender,
        ageInMonths: differenceInMonths(new Date(), new Date(p.dob))
      });
      if (evalRes.status !== 'N/A') suggestedStatus = evalRes.status;
    }
    setHospDischargeStatus(suggestedStatus);
    setHospDischargeReturnDate(formatLocalDate(addDays(new Date(), 7)));
    setHospDischargeWeight(latestWeight ? String(latestWeight) : '');
    setHospDischargeHeight(latestHeight ? String(latestHeight) : '');
    setHospDischargeNotes('');
  };

  const handleConfirmDischarge = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalizedPatient) return;
    setIsSavingDischarge(true);
    try {
      const pEvents = events.filter(e => e.patient_id === selectedHospitalizedPatient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestClinical = pEvents.find(e => e.event_type !== 'acs_visit' && e.event_type !== 'observation') || pEvents[0];
      const dischargeWeightNum = hospDischargeWeight ? parseFloat(hospDischargeWeight) : latestClinical?.weight;
      const dischargeHeightNum = hospDischargeHeight ? parseFloat(hospDischargeHeight) : latestClinical?.height;

      // 1. Update patient status
      updatePatient(selectedHospitalizedPatient.id, { status: hospDischargeStatus as any });

      // 2. Add clinical event registering hospital discharge
      const newEvent: ClinicalEvent = {
        id: `discharge_${Date.now()}`,
        patient_id: selectedHospitalizedPatient.id,
        date: hospDischargeDate,
        weight: dischargeWeightNum,
        height: dischargeHeightNum,
        muac: latestClinical?.muac,
        nutritional_status: hospDischargeStatus,
        notes: `[ALTA HOSPITALAR] Criança recebeu alta hospitalar e retornou ao acompanhamento ambulatorial. ${hospDischargeNotes ? `Observações: ${hospDischargeNotes}` : ''}`.trim(),
        event_type: 'acompanhamento',
        return_date: hospDischargeReturnDate || undefined,
        professional: user?.name || 'Profissional',
      };

      addEvent(newEvent);

      // 3. Auto-schedule return consultation if return date provided
      const todayStr = formatLocalDate(new Date());
      if (hospDischargeReturnDate && hospDischargeReturnDate >= todayStr) {
        agendarAtendimento(selectedHospitalizedPatient.id, selectedHospitalizedPatient.name, hospDischargeReturnDate);
      }

      // 4. Schedule ACS home visit
      agendarVisita(selectedHospitalizedPatient.id, hospDischargeDate);

      sendNotification(
        'Alta Hospitalar Registrada',
        `${selectedHospitalizedPatient.name} recebeu alta hospitalar e retornou ao acompanhamento ambulatorial regular.`,
        'success'
      );

      setSelectedHospitalizedPatient(null);
    } catch (err) {
      console.error('Erro ao registrar alta hospitalar:', err);
    } finally {
      setIsSavingDischarge(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Crianças</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestão de prontuários e acompanhamentos</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Botão Histórico ao lado de + Novo Cadastro */}
          <button
            type="button"
            onClick={() => {
              setViewMode(viewMode === 'historico' ? 'ativas' : 'historico');
              setHistorySubFilter('all');
            }}
            className={cn(
              "px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 border cursor-pointer",
              viewMode === 'historico'
                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-amber-200"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            )}
            title="Visualizar histórico de crianças com alta do projeto ou atendimento encerrado"
          >
            <History size={20} className={viewMode === 'historico' ? 'text-white' : 'text-amber-600'} />
            Histórico
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-black",
              viewMode === 'historico' ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800"
            )}>
              {historyPatientsList.length}
            </span>
          </button>

          {user?.role !== 'OBSERVER' && (
            <Link 
              to="/nutrition/patients/new"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
              <Plus size={20} />
              Novo Cadastro
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Toolbar */}
        <div className="p-4 sm:p-8 border-b border-slate-100 bg-slate-50/30">
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

        {/* Historical Area Banner & Filters */}
        {viewMode === 'historico' && (
          <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                <History size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  Histórico do Projeto
                  <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                    {historyPatientsList.length} {historyPatientsList.length === 1 ? 'criança' : 'crianças'}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Crianças que receberam alta do programa por recuperação ou tiveram o atendimento encerrado.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setHistorySubFilter('all')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  historySubFilter === 'all'
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                Todos ({historyPatientsList.length})
              </button>
              <button
                type="button"
                onClick={() => setHistorySubFilter('alta')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  historySubFilter === 'alta'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                )}
              >
                <CheckCircle2 size={13} />
                Altas do Projeto ({historyPatientsList.filter(p => getHistoryInfo(p).type === 'alta').length})
              </button>
              <button
                type="button"
                onClick={() => setHistorySubFilter('encerrado')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  historySubFilter === 'encerrado'
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
                )}
              >
                <UserX size={13} />
                Atendimentos Encerrados ({historyPatientsList.filter(p => getHistoryInfo(p).type === 'encerrado').length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ativas')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-all cursor-pointer"
              >
                ← Crianças Ativas
              </button>
            </div>
          </div>
        )}

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredPatients.map((patient) => {
            const ret = getNextReturnDate(patient);
            const hInfo = getHistoryInfo(patient);
            return (
              <div
                key={patient.id}
                onClick={() => navigate(`/nutrition/patients/${patient.id}`)}
                className={cn(
                  "p-4 transition-colors flex items-center justify-between gap-3 cursor-pointer",
                  viewMode === 'historico' ? "active:bg-amber-50/50" : "active:bg-emerald-50/50"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {patient.photo_url ? (
                    <img 
                      src={patient.photo_url} 
                      alt={patient.name} 
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200/50 shadow-xs shrink-0" 
                    />
                  ) : (
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs border shrink-0",
                      viewMode === 'historico'
                        ? "bg-amber-50 text-amber-800 border-amber-200/50"
                        : "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200/50"
                    )}>
                      {patient.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm truncate">{patient.name}</p>
                      {viewMode === 'historico' ? (
                        hInfo.type === 'alta' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Alta
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Encerrado
                          </span>
                        )
                      ) : (
                        <StatusBadge status={patient.status} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{calculateAge(patient.dob)}</span>
                      <span>•</span>
                      <span className="truncate flex items-center gap-1">
                        <MapPin size={11} className="text-emerald-500" />
                        {patient.community}
                      </span>
                    </div>
                    {viewMode === 'historico' ? (
                      <p className="text-[10px] text-slate-600 mt-1 line-clamp-1 italic">
                        <span className="font-bold text-slate-400 not-italic">Data: {hInfo.date} • </span>
                        {hInfo.reason}
                      </p>
                    ) : (
                      ret.date !== '--' && (
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                          Retorno: <span className={ret.isOverdue ? "text-red-500" : "text-emerald-600 font-black"}>{ret.date}</span>
                        </p>
                      )
                    )}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 shrink-0">
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })}
          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <Search size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">
                {viewMode === 'historico' ? 'Nenhuma criança encontrada no histórico.' : 'Nenhuma criança encontrada.'}
              </p>
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-slate-100">
                <th className="p-6">ID / Nome da Criança</th>
                <th className="p-6">Idade</th>
                <th className="p-6">Comunidade</th>
                {viewMode === 'historico' ? (
                  <>
                    <th className="p-6">Situação no Histórico</th>
                    <th className="p-6 text-center">Data da Saída</th>
                    <th className="p-6">Justificativa / Motivo</th>
                  </>
                ) : (
                  <>
                    <th className="p-6">Status Nutricional</th>
                    <th className="p-6 text-center">Data do Retorno</th>
                  </>
                )}
                <th className="p-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map((patient) => {
                const hInfo = getHistoryInfo(patient);
                return (
                  <tr 
                    key={patient.id} 
                    onClick={() => navigate(`/nutrition/patients/${patient.id}`)}
                    className={cn(
                      "transition-all group/row cursor-pointer",
                      viewMode === 'historico' ? "hover:bg-amber-50/30" : "hover:bg-emerald-50/30"
                    )}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        {patient.photo_url ? (
                          <img 
                            src={patient.photo_url} 
                            alt={patient.name} 
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200/50 shadow-sm shrink-0 group-hover/row:scale-110 transition-transform" 
                          />
                        ) : (
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border shrink-0 group-hover/row:scale-110 transition-transform",
                            viewMode === 'historico'
                              ? "bg-amber-50 text-amber-800 border-amber-200/50"
                              : "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200/50"
                          )}>
                            {patient.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className={cn(
                            "font-bold transition-colors",
                            viewMode === 'historico' ? "text-slate-900 group-hover/row:text-amber-800" : "text-slate-900 group-hover/row:text-emerald-700"
                          )}>
                            {patient.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.registration_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-sm font-semibold text-slate-600">{calculateAge(patient.dob)}</td>
                    <td className="p-6 text-sm font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", viewMode === 'historico' ? "bg-amber-400" : "bg-emerald-400")}></div>
                        {patient.community}
                      </div>
                    </td>

                    {viewMode === 'historico' ? (
                      <>
                        <td className="p-6">
                          {hInfo.type === 'alta' ? (
                            <span className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs inline-flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-700" /> Alta do Projeto
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 shadow-xs inline-flex items-center gap-1.5">
                              <UserX size={12} className="text-rose-700" /> Atendimento Encerrado
                            </span>
                          )}
                        </td>
                        <td className="p-6 text-center text-xs font-bold text-slate-700">
                          {hInfo.date}
                        </td>
                        <td className="p-6 text-xs text-slate-600 italic max-w-xs" title={hInfo.reason}>
                          <p className="line-clamp-2">{hInfo.reason}</p>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-6">
                          <StatusBadge status={patient.status} />
                        </td>
                        <td className="p-6 text-center">
                          {(() => {
                            const ret = getNextReturnDate(patient);
                            if (ret.date === '--') return <span className="text-slate-400 font-medium">--</span>;
                            if (ret.isHospitalized) {
                              return (
                                <span className="px-3 py-1 rounded-xl text-[11px] font-bold shadow-sm inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200">
                                  <Building2 size={12} className="text-purple-600" />
                                  Internada
                                </span>
                              );
                            }
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
                      </>
                    )}

                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(() => {
                          const ret = getNextReturnDate(patient);
                          if (ret.isHospitalized && viewMode !== 'historico') {
                            return (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDischarge(patient);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-200 transition-all active:scale-95 cursor-pointer shrink-0"
                                title="Registrar Alta Hospitalar da criança sem precisar abrir acompanhamento"
                              >
                                <CheckCircle2 size={14} />
                                <span>Registrar Alta</span>
                              </button>
                            );
                          }
                          return null;
                        })()}
                        <button 
                          className={cn(
                            "inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 transition-all cursor-pointer",
                            viewMode === 'historico' ? "group-hover/row:text-white group-hover/row:bg-amber-600" : "group-hover/row:text-white group-hover/row:bg-emerald-600"
                          )}
                          title="Ver Prontuário"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={viewMode === 'historico' ? 7 : 6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={40} className="text-slate-200" />
                      <p className="text-slate-400 font-medium">
                        {viewMode === 'historico' ? 'Nenhuma criança encontrada no histórico.' : 'Nenhuma criança encontrada.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Registrar Alta Hospitalar */}
      {selectedHospitalizedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Registrar Alta Hospitalar</h3>
                  <p className="text-xs text-slate-500 font-medium">Retorno ao acompanhamento ambulatorial de {selectedHospitalizedPatient.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedHospitalizedPatient(null)} 
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 size={14} /> Retorno à Rotina de Consultas:
              </p>
              <p className="leading-relaxed">
                A criança sairá da condição de internação hospitalar e retornará ao fluxo de consultas ambulatoriais e visitas domiciliares comunitárias, sem precisar preencher um acompanhamento completo agora.
              </p>
            </div>

            <form onSubmit={handleConfirmDischarge} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Data da Alta *
                  </label>
                  <input 
                    type="date"
                    value={hospDischargeDate}
                    onChange={(e) => setHospDischargeDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Status Nutricional na Alta *
                  </label>
                  <select
                    value={hospDischargeStatus}
                    onChange={(e) => setHospDischargeStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700"
                  >
                    <option value="DAG">DAG (Grave)</option>
                    <option value="DAM">DAM (Moderada)</option>
                    <option value="Risco">Risco Nutricional</option>
                    <option value="Adequado">Adequado / Recuperado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Peso na Alta (kg)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    value={hospDischargeWeight}
                    onChange={(e) => setHospDischargeWeight(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Estatura na Alta (cm)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={hospDischargeHeight}
                    onChange={(e) => setHospDischargeHeight(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Data da Próxima Consulta Ambulatorial
                </label>
                <input 
                  type="date"
                  value={hospDischargeReturnDate}
                  onChange={(e) => setHospDischargeReturnDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Orientações da Alta / Observações
                </label>
                <textarea 
                  value={hospDischargeNotes}
                  onChange={(e) => setHospDischargeNotes(e.target.value)}
                  rows={3}
                  placeholder="Relatório de alta do hospital, orientações da equipe, medicamentos a manter..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium resize-none text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setSelectedHospitalizedPatient(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingDischarge}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-md shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSavingDischarge ? (
                    'Salvando...'
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirmar Alta Hospitalar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

