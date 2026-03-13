import React, { useState } from 'react';
import { Home, Search, Calendar, CheckCircle2, AlertCircle, ChevronRight, User, MapPin, ClipboardCheck, MessageSquare, Star } from 'lucide-react';
import { mockPatients, mockHomeVisits, HomeVisit, Patient } from '../lib/mockData';
import { cn } from '../lib/utils';

export function HomeVisits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<HomeVisit | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  // Filter pending visits
  const pendingVisits = mockHomeVisits.filter(v => v.status === 'pending');
  const completedVisits = mockHomeVisits.filter(v => v.status === 'completed');

  const getPatient = (id: string) => mockPatients.find(p => p.id === id);

  const filteredVisits = (activeTab === 'pending' ? pendingVisits : completedVisits).filter(visit => {
    const patient = getPatient(visit.patient_id);
    return patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           patient?.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save visit would go here
    alert('Visita salva com sucesso! (Simulação)');
    setSelectedVisit(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Home className="text-emerald-600" size={28} />
            Visitas Domiciliares
          </h1>
          <p className="text-slate-500 mt-1">Acompanhamento de famílias em loco pelos ACS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Visit List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar criança ou prontuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex p-1 bg-slate-50 rounded-xl overflow-hidden">
              <button
                onClick={() => setActiveTab('pending')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                  activeTab === 'pending' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"
                )}
              >
                Pendentes ({pendingVisits.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                  activeTab === 'completed' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                )}
              >
                Concluídas ({completedVisits.length})
              </button>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredVisits.length > 0 ? (
              filteredVisits.map((visit) => {
                const patient = getPatient(visit.patient_id);
                const isSelected = selectedVisit?.id === visit.id;
                
                return (
                  <button
                    key={visit.id}
                    onClick={() => setSelectedVisit(visit)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all group",
                      isSelected 
                        ? (activeTab === 'pending' ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200" : "bg-blue-50 border-blue-200 ring-1 ring-blue-200")
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {visit.date}
                      </span>
                      {visit.status === 'completed' ? (
                        <CheckCircle2 size={14} className="text-blue-500" />
                      ) : (
                        <AlertCircle size={14} className="text-amber-500" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {patient?.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <MapPin size={12} />
                      {patient?.community}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 text-center">
                <p className="text-slate-400 text-sm">Nenhuma visita encontrada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main: Visit Details & Checklist */}
        <div className="lg:col-span-2">
          {selectedVisit ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
              {/* Header */}
              <div className={cn(
                "p-6 text-white flex justify-between items-center",
                selectedVisit.status === 'completed' ? "bg-blue-600" : "bg-emerald-600"
              )}>
                <div>
                  <h2 className="text-xl font-bold">{getPatient(selectedVisit.patient_id)?.name}</h2>
                  <p className="text-white/80 text-xs font-medium mt-1 uppercase tracking-widest">
                    Prontuário: {getPatient(selectedVisit.patient_id)?.registration_number}
                  </p>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">
                  {selectedVisit.status === 'completed' ? 'Visita Concluída' : 'Visita Pendente'}
                </div>
              </div>

              <form onSubmit={handleSaveVisit} className="p-8 space-y-8 flex-1">
                {/* Family Info */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Comunidade</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" />
                      {getPatient(selectedVisit.patient_id)?.community}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Responsável</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User size={14} className="text-emerald-500" />
                      {getPatient(selectedVisit.patient_id)?.guardian_name}
                    </p>
                  </div>
                </div>

                {/* Checklist Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <ClipboardCheck size={18} className="text-emerald-500" />
                    Checklist de Acompanhamento
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Cleanliness */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex justify-between">
                        Limpeza da Casa (1-5)
                        <span className="text-emerald-600 font-bold">{selectedVisit.checklist.house_cleanliness || 0}/5</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="5" 
                        step="1"
                        disabled={selectedVisit.status === 'completed'}
                        defaultValue={selectedVisit.checklist.house_cleanliness}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
                        <span>Precário</span>
                        <span>Regular</span>
                        <span>Excelente</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          disabled={selectedVisit.status === 'completed'}
                          defaultChecked={selectedVisit.checklist.vitamins_followed}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500/20" 
                        />
                        <span className="text-sm font-medium text-slate-700">Vitamina em dia</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          disabled={selectedVisit.status === 'completed'}
                          defaultChecked={selectedVisit.checklist.medical_recommendations_followed}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500/20" 
                        />
                        <span className="text-sm font-medium text-slate-700">Segue Recomendações</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Observations */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-emerald-500" />
                    Observações e Notas
                  </h3>
                  <textarea
                    placeholder="Registrar comportamento, saúde aparente e diálogos com a família..."
                    disabled={selectedVisit.status === 'completed'}
                    defaultValue={selectedVisit.observations}
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>

                {/* Actions */}
                {selectedVisit.status === 'pending' && (
                  <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-200"
                    >
                      <CheckCircle2 size={20} />
                      Concluir e Salvar Visita
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-20 text-center flex flex-col items-center justify-center h-full min-h-[600px]">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                <ClipboardCheck size={40} />
              </div>
              <h2 className="text-xl font-bold text-slate-400">Selecione uma visita</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-xs">Escolha uma criança na lista ao lado para registrar os dados da visita domiciliar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Card: Scheduling Logic */}
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 items-start">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
          <Calendar size={20} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Escala de Acompanhamento (ACS)</h4>
          <p className="text-amber-800/70 text-xs mt-1 leading-relaxed">
            Lembre-se da lógica de alternância: Uma semana as crianças passam por atendimento médico na sede,
            e na semana seguinte o acompanhamento acontece via visita domiciliar (Ação em Loco).
          </p>
        </div>
      </div>
    </div>
  );
}
