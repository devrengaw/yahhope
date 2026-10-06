import { useState } from 'react';
import { Search, CheckCircle2, Clock, UserCheck, Activity, ArrowRight, PlayCircle, X, Calendar, FileText, Plus, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAtendimento, Atendimento } from '../contexts/AtendimentoContext';
import { usePatients } from '../contexts/PatientContext';
import { Patient } from '../lib/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatLocalDate, cn } from '../lib/utils';

export function Atendimentos() {
  const navigate = useNavigate();
  const { atendimentos, marcarPresenca, iniciarAtendimento, concluirAtendimento, removerDaFila } = useAtendimento();
  const { patients } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date();
  const todayDate = formatLocalDate(today);

  // Retroactive consultation modal state
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [retroPatientId, setRetroPatientId] = useState('');
  const [retroDate, setRetroDate] = useState(formatLocalDate(today));
  const [retroSearchPatient, setRetroSearchPatient] = useState('');

  const registeredPatientIds = new Set(patients.map(p => p.id));
  const patientMap = new Map<string, Patient>(patients.map(p => [p.id, p]));

  const filteredAtendimentos = atendimentos.filter(a => {
    // Only show appointments of registered children
    if (patients.length > 0 && !registeredPatientIds.has(a.patient_id)) {
      return false;
    }

    // Exclude hospitalized children from regular consultation queue
    const patient = patientMap.get(a.patient_id);
    if (patient && (patient.status === 'Internada' || patient.status === 'Internado')) {
      return false;
    }

    const matchesSearch = a.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const isToday = a.date === todayDate;
    
    // Past appointments only show up if the child has not completed another appointment on or after that date
    const hasBeenCompletedLater = atendimentos.some(
      other => other.patient_id === a.patient_id && other.status === 'completed' && other.date >= a.date
    );
    const isPastAndPending = a.date < todayDate && a.status !== 'completed' && !hasBeenCompletedLater;

    return matchesSearch && (isToday || isPastAndPending);
  });

  const scheduled = filteredAtendimentos.filter(a => a.status === 'scheduled');
  const waiting = filteredAtendimentos.filter(a => a.status === 'waiting');
  const inProgress = filteredAtendimentos.filter(a => a.status === 'in_progress');
  const completed = filteredAtendimentos.filter(a => a.status === 'completed');

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja marcar falta ou remover "${name}" da fila?`)) {
      removerDaFila(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Atendimento do Dia</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestão da Fila Clínica e Retornos</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRetroPatientId('');
              setRetroDate(formatLocalDate(today));
              setIsRetroModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <History size={16} className="text-emerald-600" />
            + Atendimento Retroativo
          </button>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Clock size={16} className="text-emerald-600" />
            {format(today, "d 'de' MMMM, yyyy", { locale: ptBR })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome da criança ou prontuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Recepção */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-lg flex items-center justify-center text-[10px]">{scheduled.length}</span>
            Não Chegaram
          </h2>
          
          <div className="space-y-3">
            {scheduled.map(apt => (
              <div key={apt.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100">
                    {apt.patient_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{apt.patient_name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Agendado</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleRemove(apt.id, apt.patient_name)}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Marcar Falta / Remover"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={() => marcarPresenca(apt.id)}
                    className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    title="Marcar Presença"
                  >
                    <UserCheck size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Fila do Médico */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 px-2">
            <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-lg flex items-center justify-center text-[10px]">{waiting.length + inProgress.length}</span>
            Aguardando Médico
          </h2>

          <div className="space-y-3">
            {inProgress.map(apt => (
              <div key={apt.id} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-200">
                    {apt.patient_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-900">{apt.patient_name}</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-tight">Em Atendimento</p>
                  </div>
                </div>
                <Link 
                  to={`/nutrition/patients/${apt.patient_id}?action=new-followup&aptId=${apt.id}`}
                  className="p-2.5 bg-white text-blue-600 rounded-xl shadow-sm border border-blue-100 font-bold text-xs"
                >
                  Continuar
                </Link>
              </div>
            ))}

            {waiting.map(apt => (
              <div key={apt.id} className="bg-white p-4 rounded-2xl border border-amber-100 flex items-center justify-between group hover:border-amber-400 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black border border-amber-100">
                    {apt.patient_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{apt.patient_name}</h3>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-tight">Na Fila</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleRemove(apt.id, apt.patient_name)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remover da Fila"
                  >
                    <X size={18} />
                  </button>
                  <Link 
                    to={`/nutrition/patients/${apt.patient_id}?action=new-followup&aptId=${apt.id}`}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                  >
                    <PlayCircle size={14} />
                    Chamar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 3: Concluídos */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-lg flex items-center justify-center text-[10px]">{completed.length}</span>
            Atendidos Hoje
          </h2>

          <div className="space-y-3">
            {completed.map(apt => (
              <div key={apt.id} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-slate-400 flex items-center justify-center font-black border border-slate-100">
                    {apt.patient_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 line-through decoration-slate-300">{apt.patient_name}</h3>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight flex items-center gap-1">
                      <CheckCircle2 size={10} /> Concluído
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/nutrition/patients/${apt.patient_id}?action=edit-last`}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-all"
                  >
                    Editar
                  </Link>
                  <Link 
                    to={`/nutrition/patients/${apt.patient_id}`}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Iniciar Atendimento Retroativo */}
      {isRetroModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Atendimento Retroativo</h2>
                  <p className="text-xs text-slate-500">Registrar atendimento com data passada</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRetroModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!retroPatientId) {
                  alert('Selecione uma criança.');
                  return;
                }
                setIsRetroModalOpen(false);
                navigate(`/nutrition/patients/${retroPatientId}?action=new-followup&date=${retroDate}`);
              }}
              className="p-6 space-y-4"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Atendimentos com data retroativa permitem prescrever <strong>medicamentos e kits mesmo que estejam sem estoque</strong> no sistema atual.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Data do Atendimento</label>
                <input
                  type="date"
                  required
                  value={retroDate}
                  onChange={(e) => setRetroDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Criança / Paciente</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Filtrar crianças por nome..."
                    value={retroSearchPatient}
                    onChange={(e) => setRetroSearchPatient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
                  />
                  <select
                    required
                    value={retroPatientId}
                    onChange={(e) => setRetroPatientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    size={5}
                  >
                    <option value="" disabled className="text-slate-400">-- Selecione a criança --</option>
                    {patients
                      .filter(p => !retroSearchPatient || p.name.toLowerCase().includes(retroSearchPatient.toLowerCase()))
                      .map(p => (
                        <option key={p.id} value={p.id} className="py-1">
                          {p.name} {p.medical_record_number ? `(${p.medical_record_number})` : ''} - Status: {p.status}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRetroModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!retroPatientId}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Iniciar Atendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
