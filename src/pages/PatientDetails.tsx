import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Activity, Home, Calendar, User, Weight, X, Stethoscope, Clock, BriefcaseMedical } from 'lucide-react';
import { mockPatients, mockEvents, ClinicalEvent } from '../lib/mockData';
import { calculateAge, cn } from '../lib/utils';
import { StatusBadge } from './Patients';
import { GrowthCharts } from '../components/GrowthCharts';
import { differenceInMonths } from 'date-fns';
import { useInventory } from '../contexts/InventoryContext';

// Helper to calculate Z-score approximation based on WHO simplified math
const calculateZScoreAndStatus = (weight: number, height: number, gender: 'M' | 'F') => {
  if (!weight || !height || height < 45 || height > 120) return { zScore: null, status: 'N/A' };
  
  const base = gender === 'M' ? 2.5 : 2.4;
  const median = base + 0.15 * (height - 45) + 0.0015 * Math.pow(height - 45, 2);
  const z2Offset = 0.5 + (height - 45) * 0.03;
  const z3Offset = 0.8 + (height - 45) * 0.04;

  const z_2 = median - z2Offset;
  const z_3 = median - z3Offset;

  let zScore = 0;
  if (weight < median) {
    zScore = -((median - weight) / (z2Offset / 2)); // Approximate SD
  } else {
    zScore = ((weight - median) / (z2Offset / 2));
  }

  let status = 'Adequado';
  if (weight <= z_3) status = 'DAG';
  else if (weight <= z_2) status = 'DAM';
  else if (zScore < -1) status = 'Risco';

  return { zScore: parseFloat(zScore.toFixed(2)), status };
};

export function PatientDetails() {
  const { id } = useParams();
  const { kits, deductKitFromInventory } = useInventory();
  const [activeTab, setActiveTab] = useState<'resumo' | 'triagem' | 'historico'>('resumo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [localEvents, setLocalEvents] = useState<ClinicalEvent[]>(mockEvents);

  // Modal Form State
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [newMuac, setNewMuac] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [selectedKit, setSelectedKit] = useState('');
  const [prescriptions, setPrescriptions] = useState([{ id: Date.now(), medication: '', treatment: '' }]);

  // Referral Modal State
  const [refWeight, setRefWeight] = useState('');
  const [refHeight, setRefHeight] = useState('');
  const [refPE, setRefPE] = useState('');
  const [edema, setEdema] = useState<'Sim' | 'Não'>('Não');
  const [edemaLocation, setEdemaLocation] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const patient = mockPatients.find(p => p.id === id);
  const events = localEvents.filter(e => e.patient_id === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!patient) return <div className="p-8 text-center">Paciente não encontrado</div>;

  // Auto-calculated fields for modal
  const ageInMonths = differenceInMonths(new Date(), new Date(patient.dob));
  const bmi = (newWeight && newHeight) ? (parseFloat(newWeight) / Math.pow(parseFloat(newHeight) / 100, 2)).toFixed(2) : '--';
  const { zScore, status: calcStatus } = calculateZScoreAndStatus(parseFloat(newWeight), parseFloat(newHeight), patient.gender);

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty prescriptions
    const validPrescriptions = prescriptions.filter(p => p.medication.trim() !== '' || p.treatment.trim() !== '');

    const newEvent: ClinicalEvent = {
      id: `e${Date.now()}`,
      patient_id: patient.id,
      event_type: 'acompanhamento',
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newWeight),
      height: parseFloat(newHeight),
      muac: parseFloat(newMuac),
      bmi: parseFloat(bmi as string),
      z_score_weight_height: zScore !== null ? zScore : undefined,
      nutritional_status: calcStatus,
      prescriptions: validPrescriptions.length > 0 ? validPrescriptions : undefined,
      notes: newNotes,
      professional: 'Dra. Helena (Logada)', // Simulated logged-in user
      return_date: returnDate || undefined,
      kit_delivered: selectedKit || undefined,
    };
    
    if (selectedKit) {
      deductKitFromInventory(selectedKit);
    }

    setLocalEvents([newEvent, ...localEvents]);
    setIsModalOpen(false);
    setNewWeight(''); setNewHeight(''); setNewMuac(''); setNewNotes(''); setReturnDate(''); setSelectedKit('');
    setPrescriptions([{ id: Date.now(), medication: '', treatment: '' }]);
    setActiveTab('historico');
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { id: Date.now(), medication: '', treatment: '' }]);
  };

  const removePrescription = (id: number) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const updatePrescription = (id: number, field: 'medication' | 'treatment', value: string) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const openReferralModal = () => {
    setRefWeight(events[0]?.weight ? (events[0].weight * 1000).toString() : '');
    setRefHeight(events[0]?.height ? events[0].height.toString() : '');
    setRefPE(events[0]?.z_score_weight_height !== undefined ? events[0].z_score_weight_height.toString() : '');
    setEdema('Não');
    setEdemaLocation('');
    setReferralReason('');
    setOtherReason('');
    setIsReferralModalOpen(true);
  };

  const handlePrintReferral = (e: React.FormEvent) => {
    e.preventDefault();
    // Em um cenário real, aqui salvaríamos no Supabase
    window.print();
    setIsReferralModalOpen(false);
  };

  return (
    <>
    <div className="space-y-6 pb-12 print:hidden">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/nutrition/patients" className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{patient.name}</h1>
            <StatusBadge status={events[0]?.nutritional_status || patient.status} />
          </div>
          <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
            <span>ID: {patient.registration_number}</span>
            <span>•</span>
            <span>{calculateAge(patient.dob)} ({patient.gender === 'M' ? 'Masculino' : 'Feminino'})</span>
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
        >
          <Plus size={18} />
          Novo Acompanhamento
        </button>
        <button 
          onClick={openReferralModal}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
        >
          <FileText size={18} />
          Gerar Encaminhamento
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto hide-scrollbar">
          <TabButton active={activeTab === 'resumo'} onClick={() => setActiveTab('resumo')} icon={Activity}>Resumo & Gráficos</TabButton>
          <TabButton active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} icon={Calendar}>Histórico Clínico</TabButton>
          <TabButton active={activeTab === 'triagem'} onClick={() => setActiveTab('triagem')} icon={Home}>Triagem Social</TabButton>
        </div>

        <div className="p-6">
          {activeTab === 'resumo' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Weight size={16}/> Último Peso</p>
                  <p className="text-2xl font-bold text-slate-900">{events[0]?.weight || '--'} kg</p>
                  <p className="text-xs text-slate-400 mt-1">Medido em {new Date(events[0]?.date).toLocaleDateString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Activity size={16}/> Última Estatura</p>
                  <p className="text-2xl font-bold text-slate-900">{events[0]?.height || '--'} cm</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Activity size={16}/> Perímetro Braquial</p>
                  <p className="text-2xl font-bold text-slate-900">{events[0]?.muac || '--'} cm</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Activity size={16}/> P. Craniano</p>
                  <p className="text-2xl font-bold text-slate-900">{events[0]?.head_circumference || '--'} cm</p>
                </div>
              </div>

              <div>
                <GrowthCharts patient={patient} events={events} />
              </div>
            </div>
          )}

          {activeTab === 'triagem' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><User size={20} className="text-emerald-600"/> Dados Familiares</h3>
                <div className="space-y-4">
                  <InfoRow label="Responsável" value={patient.guardian_name} />
                  <InfoRow label="Comunidade" value={patient.community} />
                  <InfoRow label="Data de Cadastro" value={new Date(patient.created_at).toLocaleDateString()} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Home size={20} className="text-emerald-600"/> Condições de Moradia</h3>
                <div className="space-y-4">
                  <InfoRow label="Tipo de Habitação" value={patient.housing_type} />
                  <InfoRow label="Saneamento" value={patient.sanitation} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
              {/* Summary Table for Quick Evolution Check */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tabela de Evolução</h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Resumo Clínico</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="p-4">Data</th>
                        <th className="p-4 text-center">Peso (kg)</th>
                        <th className="p-4 text-center">Est. (cm)</th>
                        <th className="p-4 text-center">PB (cm)</th>
                        <th className="p-4 text-center">P/E (Z)</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {events.filter(e => e.event_type !== 'acs_visit').map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-xs font-medium text-slate-600">
                            {new Date(event.date).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center text-sm font-bold text-slate-900">
                            {event.weight || '--'}
                          </td>
                          <td className="p-4 text-center text-sm font-semibold text-slate-700">
                            {event.height || '--'}
                          </td>
                          <td className="p-4 text-center text-sm font-semibold text-slate-700">
                            {event.muac || '--'}
                          </td>
                          <td className="p-4 text-center text-sm">
                             <span className={cn(
                               "font-bold",
                               event.z_score_weight_height && event.z_score_weight_height < -2 ? "text-red-500" : 
                               event.z_score_weight_height && event.z_score_weight_height < -1 ? "text-amber-500" : "text-emerald-500"
                             )}>
                               {event.z_score_weight_height !== undefined ? event.z_score_weight_height : '--'}
                             </span>
                          </td>
                          <td className="p-4">
                            {event.nutritional_status && <StatusBadge status={event.nutritional_status} />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  Linha do Tempo Detalhada
                </h3>
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                  {events.map((event, idx) => (
                    <div key={event.id} className="relative pl-8 group">
                      {/* Timeline Dot */}
                      <div className={cn(
                        "absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110",
                        event.event_type === 'initial' ? 'bg-blue-500' :
                        event.event_type === 'acompanhamento' ? 'bg-emerald-500' :
                        event.event_type === 'acs_visit' ? 'bg-amber-500' : 'bg-slate-500'
                      )}></div>
                      
                      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900 capitalize text-lg">
                              {event.event_type === 'initial' ? 'Avaliação Inicial' : 
                               event.event_type === 'acompanhamento' ? 'Acompanhamento Clínico' :
                               event.event_type === 'acs_visit' ? 'Visita ACS' : 'Retorno'}
                            </span>
                            {event.nutritional_status && <StatusBadge status={event.nutritional_status} />}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><Clock size={12}/> {new Date(event.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><User size={12}/> {event.professional}</span>
                          </div>
                        </div>

                        {event.notes && (
                          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-4">
                            <p className="text-slate-600 text-sm italic">"{event.notes}"</p>
                          </div>
                        )}

                        {event.return_date && (
                          <div className="mb-4 bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                            <Calendar size={14} className="text-amber-600 shadow-sm" />
                            <span className="font-bold uppercase tracking-tight">Retorno agendado:</span> 
                            <span className="font-semibold">{new Date(event.return_date).toLocaleDateString()}</span>
                          </div>
                        )}

                        {event.kit_delivered && (
                          <div className="mb-4 bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                            <BriefcaseMedical size={14} className="text-emerald-600 shadow-sm" />
                            <span className="font-bold uppercase tracking-tight">Kit Entregue:</span> 
                            <span className="font-semibold">{kits.find(k => k.id === event.kit_delivered)?.name || 'Kit Padrão'}</span>
                          </div>
                        )}

                        {/* Measurements Grid - Refactored as a mini-table or clean grid */}
                        {(event.weight || event.height || event.muac) && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/30 rounded-xl border border-slate-50">
                            {event.weight && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peso</span>
                                <span className="text-base font-bold text-slate-900">{event.weight} <small className="text-[10px] text-slate-400 font-normal">kg</small></span>
                              </div>
                            )}
                            {event.height && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estatura</span>
                                <span className="text-base font-bold text-slate-900">{event.height} <small className="text-[10px] text-slate-400 font-normal">cm</small></span>
                              </div>
                            )}
                            {event.bmi && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IMC</span>
                                <span className="text-base font-bold text-slate-900">{event.bmi}</span>
                              </div>
                            )}
                            {event.z_score_weight_height !== undefined && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">P/E (DP)</span>
                                <span className={cn(
                                  "text-base font-bold",
                                  event.z_score_weight_height < -2 ? "text-red-500" : 
                                  event.z_score_weight_height < -1 ? "text-amber-500" : "text-emerald-500"
                                )}>{event.z_score_weight_height}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Medication & Treatment Table-style */}
                        {event.prescriptions && event.prescriptions.length > 0 && (
                          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100 shadow-sm">
                            <div className="bg-emerald-600 px-3 py-1.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Prescrição & Suplementação</span>
                              <Activity size={12} className="text-white/80" />
                            </div>
                            <div className="divide-y divide-emerald-50">
                              {event.prescriptions.map((p, i) => (
                                <div key={i} className="flex flex-col sm:grid sm:grid-cols-2 p-3 bg-emerald-50/30 text-sm group/row hover:bg-emerald-50/60 transition-colors">
                                  {p.medication && (
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Suplemento/Medicamento</span>
                                      <span className="text-emerald-900 font-medium">{p.medication}</span>
                                    </div>
                                  )}
                                  {p.treatment && (
                                    <div className="flex flex-col mt-2 sm:mt-0 sm:pl-4 sm:border-l sm:border-emerald-100/50">
                                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Posologia / Orientação</span>
                                      <span className="text-emerald-800">{p.treatment}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Acompanhamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Stethoscope size={24} className="text-emerald-600" />
                  Novo Acompanhamento Clínico
                </h2>
                <p className="text-sm text-slate-500 mt-1">Paciente: {patient.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="followup-form" onSubmit={handleSaveEvent} className="space-y-6">
                
                {/* Auto-filled Info */}
                <div className="flex flex-wrap gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Data do Atendimento</p>
                    <p className="text-sm font-bold text-emerald-900">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Profissional</p>
                    <p className="text-sm font-bold text-emerald-900">Dra. Helena (Logada)</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Idade Atual</p>
                    <p className="text-sm font-bold text-emerald-900">{ageInMonths} meses</p>
                  </div>
                </div>

                {/* Measurements */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Peso (kg) *</label>
                    <input required type="number" step="0.01" value={newWeight} onChange={e => setNewWeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: 8.5" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Estatura (cm) *</label>
                    <input required type="number" step="0.1" value={newHeight} onChange={e => setNewHeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: 72" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Perímetro Braquial (cm)</label>
                    <input type="number" step="0.1" value={newMuac} onChange={e => setNewMuac(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: 12.5" />
                  </div>
                </div>

                {/* Auto-calculated Results */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">IMC Calculado</p>
                    <p className="text-lg font-bold text-slate-800">{bmi}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">P/E (DP - Z-Score)</p>
                    <p className="text-lg font-bold text-slate-800">{zScore !== null ? zScore : '--'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Grau de Nutrição</p>
                    <div className="mt-1">
                      <StatusBadge status={calcStatus} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Observações Clínicas</label>
                  <textarea required rows={3} value={newNotes} onChange={e => setNewNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Descreva a evolução, conduta..."></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Data de Retorno (opcional)</label>
                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Kit Entregue (opcional)</label>
                    <select value={selectedKit} onChange={e => setSelectedKit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
                      <option value="">Nenhum kit entregue</option>
                      {kits.map(kit => (
                        <option key={kit.id} value={kit.id}>{kit.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Medication and Treatment (Dynamic) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Medicamentos e Suplementos</label>
                    <button 
                      type="button" 
                      onClick={addPrescription}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                  
                  {prescriptions.map((p, index) => (
                    <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
                      <div className="sm:col-span-5 space-y-1">
                        <input 
                          type="text" 
                          value={p.medication} 
                          onChange={e => updatePrescription(p.id, 'medication', e.target.value)} 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                          placeholder="Ex: Plumpy'Nut" 
                        />
                      </div>
                      <div className="sm:col-span-6 space-y-1">
                        <input 
                          type="text" 
                          value={p.treatment} 
                          onChange={e => updatePrescription(p.id, 'treatment', e.target.value)} 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                          placeholder="Ex: 1 sachê 2x ao dia" 
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end sm:justify-center pt-1">
                        {prescriptions.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removePrescription(p.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="followup-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                Salvar Acompanhamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gerar Encaminhamento */}
      {isReferralModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={24} className="text-emerald-600" />
                  Gerar Encaminhamento
                </h2>
                <p className="text-sm text-slate-500 mt-1">Paciente: {patient.name}</p>
              </div>
              <button onClick={() => setIsReferralModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="referral-form" onSubmit={handlePrintReferral} className="space-y-6">
                {/* Auto-filled Info */}
                <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <div>
                    <p className="text-xs font-medium text-emerald-800 mb-1">Nome da Criança</p>
                    <p className="text-sm font-bold text-emerald-900">{patient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-800 mb-1">Idade</p>
                    <p className="text-sm font-bold text-emerald-900">{ageInMonths} meses</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-800 mb-1">Acompanhante</p>
                    <p className="text-sm font-bold text-emerald-900">{patient.guardian_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-800 mb-1">Data</p>
                    <p className="text-sm font-bold text-emerald-900">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Measurements */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Peso (g) *</label>
                    <input required type="number" value={refWeight} onChange={e => setRefWeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Estatura (cm) *</label>
                    <input required type="number" step="0.1" value={refHeight} onChange={e => setRefHeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Índice P/E (Z-Score)</label>
                    <input type="number" step="0.01" value={refPE} onChange={e => setRefPE(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                </div>

                {/* Edema */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <label className="text-sm font-medium text-slate-700">Presença de Edema?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="edema" value="Sim" checked={edema === 'Sim'} onChange={() => setEdema('Sim')} className="text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm text-slate-700">Sim</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="edema" value="Não" checked={edema === 'Não'} onChange={() => { setEdema('Não'); setEdemaLocation(''); }} className="text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm text-slate-700">Não</span>
                    </label>
                  </div>
                  {edema === 'Sim' && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Onde?</label>
                      <input required type="text" value={edemaLocation} onChange={e => setEdemaLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: Membros inferiores, face..." />
                    </div>
                  )}
                </div>

                {/* Referral Reason */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <label className="text-sm font-medium text-slate-700">Encaminhamento Para: *</label>
                  <div className="space-y-2">
                    {[
                      'Orientação Nutricional no centro de Saude',
                      'Suplementação Alimentar',
                      'Tratamento de Desnutrição grave sem complicações',
                      'Internamento para desnutrição grave',
                      'Outro'
                    ].map(reason => (
                      <label key={reason} className="flex items-center gap-2 cursor-pointer">
                        <input required type="radio" name="referralReason" value={reason} checked={referralReason === reason} onChange={() => setReferralReason(reason)} className="text-emerald-600 focus:ring-emerald-500" />
                        <span className="text-sm text-slate-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                  {referralReason === 'Outro' && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Qual motivo?</label>
                      <input required type="text" value={otherReason} onChange={e => setOtherReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Descreva o motivo..." />
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsReferralModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="referral-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2">
                <FileText size={18} />
                Salvar e Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Print Layout */}
    <div id="print-area" className="hidden print:block bg-white text-black p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase">Ficha de Encaminhamento</h1>
          <p className="text-sm mt-1">Programa de Nutrição Infantil - YAHope</p>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Nome da Criança:</strong> {patient.name}</p>
            <p><strong>Idade:</strong> {ageInMonths} meses</p>
            <p><strong>Nome do Acompanhante:</strong> {patient.guardian_name}</p>
            <p><strong>Data:</strong> {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 border-t border-b border-gray-300 py-4">
            <p><strong>Peso (P):</strong> {refWeight} g</p>
            <p><strong>Estatura (E):</strong> {refHeight} cm</p>
            <p><strong>Índice P/E:</strong> {refPE}</p>
          </div>
          
          <div>
            <p><strong>Presença de Edema:</strong> {edema}</p>
            {edema === 'Sim' && <p><strong>Local do Edema:</strong> {edemaLocation}</p>}
          </div>
          
          <div className="mt-8">
            <h2 className="font-bold text-lg mb-3">Encaminhamento Para:</h2>
            <ul className="list-none space-y-3">
              <li className={referralReason === 'Orientação Nutricional no centro de Saude' ? 'font-bold' : ''}>
                [ {referralReason === 'Orientação Nutricional no centro de Saude' ? 'X' : ' '} ] Orientação Nutricional no centro de Saúde
              </li>
              <li className={referralReason === 'Suplementação Alimentar' ? 'font-bold' : ''}>
                [ {referralReason === 'Suplementação Alimentar' ? 'X' : ' '} ] Suplementação Alimentar
              </li>
              <li className={referralReason === 'Tratamento de Desnutrição grave sem complicações' ? 'font-bold' : ''}>
                [ {referralReason === 'Tratamento de Desnutrição grave sem complicações' ? 'X' : ' '} ] Tratamento de Desnutrição grave sem complicações
              </li>
              <li className={referralReason === 'Internamento para desnutrição grave' ? 'font-bold' : ''}>
                [ {referralReason === 'Internamento para desnutrição grave' ? 'X' : ' '} ] Internamento para desnutrição grave
              </li>
              <li className={referralReason === 'Outro' ? 'font-bold' : ''}>
                [ {referralReason === 'Outro' ? 'X' : ' '} ] Outro motivo: {referralReason === 'Outro' ? otherReason : '___________________________________'}
              </li>
            </ul>
          </div>
          
          <div className="mt-24 pt-8 border-t border-black text-center w-64 mx-auto">
            <p>Assinatura do Profissional</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
        active 
          ? "border-emerald-500 text-emerald-600 bg-emerald-50/50" 
          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
      )}
    >
      <Icon size={18} />
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="font-medium text-slate-900 text-sm text-right">{value}</span>
    </div>
  );
}
