import { useState } from 'react';
import { Search, CheckCircle2, Clock, UserCheck, Activity, ArrowRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAtendimento } from '../contexts/AtendimentoContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Atendimentos() {
  const { atendimentos, marcarPresenca, iniciarAtendimento, concluirAtendimento } = useAtendimento();
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date();

  const filteredAtendimentos = atendimentos.filter(a => 
    a.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scheduled = filteredAtendimentos.filter(a => a.status === 'scheduled');
  const waiting = filteredAtendimentos.filter(a => a.status === 'waiting');
  const inProgress = filteredAtendimentos.filter(a => a.status === 'in_progress');
  const completed = filteredAtendimentos.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Atendimento do Dia</h1>
          <p className="text-slate-500 mt-1">Gerencie a fila de crianças para hoje</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Clock size={16} className="text-emerald-600" />
          {format(today, "d 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar criança..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Recepção (Marcar Presença) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">{scheduled.length}</span>
            Ainda não chegaram
          </h2>
          
          {scheduled.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-500">
              Nenhuma criança pendente de chegada.
            </div>
          ) : (
            <div className="space-y-3">
              {scheduled.map(apt => (
                <div key={apt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                      {apt.patient_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{apt.patient_name}</h3>
                      <p className="text-xs text-slate-500">Agendado para hoje</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => marcarPresenca(apt.id)}
                    className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <UserCheck size={16} />
                    Marcar Presença
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna 2: Fila do Médico */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 w-8 h-8 rounded-lg flex items-center justify-center text-sm">{waiting.length + inProgress.length}</span>
              Fila do Médico
            </h2>

            {waiting.length === 0 && inProgress.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-500">
                Fila vazia. Nenhuma criança aguardando.
              </div>
            ) : (
              <div className="space-y-3">
                {inProgress.map(apt => (
                  <div key={apt.id} className="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                        {apt.patient_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">{apt.patient_name}</h3>
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <Activity size={12} /> Em atendimento
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => concluirAtendimento(apt.id)}
                        className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        <CheckCircle2 size={16} />
                        Concluir
                      </button>
                      <Link 
                        to={`/nutrition/patients/${apt.patient_id}`}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                        title="Ver Prontuário"
                      >
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                ))}

                {waiting.map(apt => (
                  <div key={apt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-medium">
                        {apt.patient_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{apt.patient_name}</h3>
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <UserCheck size={12} /> Aguardando
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => iniciarAtendimento(apt.id)}
                        className="flex items-center gap-2 bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        <PlayCircle size={16} />
                        Chamar
                      </button>
                      <Link 
                        to={`/nutrition/patients/${apt.patient_id}`}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Ver Prontuário"
                      >
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-lg flex items-center justify-center text-sm">{completed.length}</span>
                Atendidos Hoje
              </h2>
              <div className="space-y-3 opacity-75">
                {completed.map(apt => (
                  <div key={apt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-medium">
                        {apt.patient_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-600">{apt.patient_name}</h3>
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Concluído
                        </p>
                      </div>
                    </div>
                    <Link 
                      to={`/nutrition/patients/${apt.patient_id}`}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
