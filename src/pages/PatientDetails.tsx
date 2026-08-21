import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Activity, Home, Calendar, User, Weight, X, Stethoscope, Clock, BriefcaseMedical, Heart, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { usePatients } from '../contexts/PatientContext';
import { ClinicalEvent } from '../lib/mockData';
import { calculateAge, cn, formatLocalDate, parseLocalDate } from '../lib/utils';
import { StatusBadge } from '../components/StatusBadge';
import { GrowthCharts } from '../components/GrowthCharts';
import { PatientProfile } from '../components/PatientProfile';
import { differenceInMonths, addDays, differenceInDays } from 'date-fns';
import { useInventory } from '../contexts/InventoryContext';
import { useAtendimento } from '../contexts/AtendimentoContext';
import { useVisits } from '../contexts/VisitContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

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
  const location = useLocation();
  const navigate = useNavigate();
  const { addEvent, updateEvent, updatePatient, patients, events } = usePatients();
  const { items, kits, deductKitFromInventory, deductPrescriptionsFromInventory } = useInventory();
  const { agendarVisita, visits } = useVisits();
  const { agendarAtendimento, concluirAtendimento, iniciarAtendimento, adicionarNaFila, atendimentos } = useAtendimento();
  const { sendNotification } = useNotification();
  const { user } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const action = searchParams.get('action');
  const aptId = searchParams.get('aptId');

  const [activeTab, setActiveTab] = useState<'resumo' | 'ficha' | 'historico'>('resumo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  
  const patient = patients.find(p => p.id === id);
  const patientVisits = (visits || []).filter(v => v.patient_id === id && v.status === 'completed').map(v => ({
    id: v.id,
    patient_id: v.patient_id,
    event_type: 'acs_visit' as const,
    date: v.date,
    notes: v.observations || 'Visita domiciliar realizada.',
    professional: 'ACS'
  }));
  const patientEvents = [...events.filter(e => e.patient_id === id), ...patientVisits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    if (action === 'new-followup') {
      const defaultReturnDate = new Date();
      defaultReturnDate.setDate(defaultReturnDate.getDate() + 14);
      setReturnDate(formatLocalDate(defaultReturnDate));
      setProfessional(user?.name || '');
      setIsModalOpen(true);
      if (aptId) {
        iniciarAtendimento(aptId);
        if (patient) {
          sendNotification('Atendimento Iniciado', `${patient.name} começou a ser atendido(a) na clínica agora.`, 'info');
        }
      }
    } else if (action === 'edit-last') {
      const lastEvent = patientEvents[0];
      if (lastEvent) {
        setNewWeight(lastEvent.weight?.toString() || '');
        setNewHeight(lastEvent.height?.toString() || '');
        setNewMuac(lastEvent.muac?.toString() || '');
        setNewHead(lastEvent.head_circumference?.toString() || '');
        setNewNotes(lastEvent.notes || '');
        setReturnDate(lastEvent.return_date || '');
        setSelectedKits(lastEvent.kit_delivered || []);
        setEventDate(lastEvent.date);
        setIsModalOpen(true);
      }
    } else if (action === 'referral') {
      setIsReferralModalOpen(true);
    }
  }, [action, aptId]);

  const handleOpenNewFollowup = () => {
    const defaultReturnDate = new Date();
    defaultReturnDate.setDate(defaultReturnDate.getDate() + 14);
    
    setEventDate(formatLocalDate(new Date()));
    setNewWeight('');
    setNewHeight('');
    setNewMuac('');
    setNewHead('');
    setNewNotes('');
    setReturnDate(formatLocalDate(defaultReturnDate));
    setSelectedKits([]);
    setPrescriptions([{ id: '1', item_id: '', medication: '', treatment: '', duration_days: '', quantity: '' }]);
    setProfessional(user?.name || '');
    setIsModalOpen(true);
  };

  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [impactMessage, setImpactMessage] = useState('');
  const [showImpactSuccess, setShowImpactSuccess] = useState(false);
  const [showQueueSuccess, setShowQueueSuccess] = useState(false);

  // Form state
  const [eventDate, setEventDate] = useState(formatLocalDate(new Date()));
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [newMuac, setNewMuac] = useState('');
  const [newHead, setNewHead] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [professional, setProfessional] = useState(user?.name || '');
  const [selectedKits, setSelectedKits] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState([{ id: '1', item_id: '', medication: '', treatment: '', duration_days: '', quantity: '' }]);

  // Referral Modal State
  const [refWeight, setRefWeight] = useState('');
  const [refHeight, setRefHeight] = useState('');
  const [refPE, setRefPE] = useState('');
  const [edema, setEdema] = useState<'Sim' | 'Não'>('Não');
  const [edemaLocation, setEdemaLocation] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [otherReason, setOtherReason] = useState('');


  // Find latest events with specific measurements
  const latestWeightEvent = patientEvents.find(e => e.weight !== undefined);
  const latestHeightEvent = patientEvents.find(e => e.height !== undefined);
  const latestMuacEvent = patientEvents.find(e => e.muac !== undefined);
  const latestHeadEvent = patientEvents.find(e => e.head_circumference !== undefined);
  
  // For the diagnosis/Z-score, we use the latest clinical visit (not ACS visit)
  const latestClinicalEvent = patientEvents.find(e => e.event_type !== 'acs_visit') || patientEvents[0];

  const activeMedications = [...(latestClinicalEvent?.prescriptions || [])];
  if (latestClinicalEvent?.kit_delivered) {
    latestClinicalEvent.kit_delivered.forEach(kitId => {
      const kit = kits.find(k => k.id === kitId);
      if (kit) {
        kit.items.forEach(kitItem => {
          const invItem = items.find(i => i.id === kitItem.item_id);
          if (invItem) {
            const cat = invItem.category?.toLowerCase() || '';
            const isMedication = cat.includes('medicamento') || cat.includes('remédio') || cat.includes('remedio') || cat.includes('suplemento');
            
            if (isMedication) {
              activeMedications.push({
                medication: invItem.name,
                treatment: kitItem.dosage ? `${kitItem.dosage} (Kit: ${kit.name})` : `Via Kit: ${kit.name}`,
                duration_days: undefined,
                quantity: kitItem.quantity,
              });
            }
          }
        });
      }
    });
  }

  if (!patient) return <div className="p-8 text-center">Paciente não encontrado</div>;

  // Auto-calculated fields for modal
  const ageInMonths = differenceInMonths(new Date(), new Date(patient.dob));
  const bmi = (newWeight && newHeight) ? (parseFloat(newWeight) / Math.pow(parseFloat(newHeight) / 100, 2)).toFixed(2) : '--';
  const { zScore, status: calcStatus } = calculateZScoreAndStatus(parseFloat(newWeight), parseFloat(newHeight), patient.gender);

  const handleSaveEvent = (e: React.FormEvent, isDischarge: boolean = false) => {
    e.preventDefault();
    
    // Filter out empty prescriptions
    const validPrescriptions = prescriptions.filter(p => p.item_id !== '' || p.medication.trim() !== '').map(p => ({
      ...p,
      medication: p.medication.trim(),
      treatment: p.treatment.trim(),
      duration_days: parseInt(p.duration_days) || undefined,
      quantity: parseInt(p.quantity) || undefined
    }));

    const newEvent: ClinicalEvent = {
      id: `e${Date.now()}`,
      patient_id: patient.id,
      event_type: 'acompanhamento',
      date: eventDate,
      weight: parseFloat(newWeight) || undefined,
      height: parseFloat(newHeight) || undefined,
      muac: parseFloat(newMuac) || undefined,
      head_circumference: parseFloat(newHead) || undefined,
      bmi: parseFloat(bmi as string) || undefined,
      z_score_weight_height: calcStatus !== 'N/A' && zScore !== null ? zScore : undefined,
      nutritional_status: calcStatus !== 'N/A' ? calcStatus : undefined,
      professional: professional || 'Dra. Helena',
      prescriptions: validPrescriptions.length > 0 ? validPrescriptions : undefined,
      notes: newNotes,
      return_date: isDischarge ? undefined : (returnDate || undefined),
      kit_delivered: selectedKits.length > 0 ? selectedKits : undefined,
      is_discharge: isDischarge,
    };
    
    if (selectedKits.length > 0) {
      selectedKits.forEach(kitId => deductKitFromInventory(kitId, patient.id));
    }
    
    if (validPrescriptions.length > 0) {
      deductPrescriptionsFromInventory(validPrescriptions, patient.id);
    }

    if (action === 'edit-last' && patientEvents[0]) {
      updateEvent(patientEvents[0].id, newEvent);
    } else {
      addEvent(newEvent);
    }

    // Update patient status if it's a discharge
    if (isDischarge) {
      updatePatient(patient.id, { status: 'Alta' });
    } else if (calcStatus !== 'N/A') {
      // Also update status based on latest measurement if not discharge
      updatePatient(patient.id, { status: calcStatus as any });
    }
    
    // Auto-schedule return if set and not discharge
    if (returnDate && !isDischarge) {
      agendarAtendimento(patient.id, patient.name, returnDate);
    }

    // Schedule ACS visit for next week
    agendarVisita(patient.id, eventDate);

    // If it was an appointment from the queue, mark it as completed
    if (aptId) {
      concluirAtendimento(aptId);
      sendNotification(
        'Evolução Atualizada',
        `O atendimento de ${patient.name} foi finalizado. Peso registrado: ${newWeight || '--'}kg, Estatura: ${newHeight || '--'}cm. Acesso o portal para ver detalhes.`,
        'success'
      );
    }

    setIsModalOpen(false);
    // Remove query params
    navigate(`/nutrition/patients/${patient.id}`, { replace: true });
    
    setNewWeight(''); setNewHeight(''); setNewMuac(''); setNewHead(''); setNewNotes(''); setReturnDate(formatLocalDate(addDays(new Date(), 14))); setSelectedKits([]); setEventDate(formatLocalDate(new Date()));
    setPrescriptions([{ id: Date.now(), medication: '', treatment: '', duration_days: '' }]);
    setActiveTab('historico');
  };

  const handleToggleKit = (kitId: string) => {
    const isSelected = selectedKits.includes(kitId);
    let newSelectedKits: string[] = [];
    
    if (isSelected) {
      newSelectedKits = selectedKits.filter(id => id !== kitId);
    } else {
      newSelectedKits = [...selectedKits, kitId];
      
      // Auto-add medications from this kit
      const kit = kits.find(k => k.id === kitId);
      if (kit) {
        kit.items.forEach(kitItem => {
          const invItem = items.find(i => i.id === kitItem.item_id);
          if (invItem && invItem.category === 'Medicamento') {
            setPrescriptions(prev => {
              const alreadyHas = prev.some(p => p.medication === invItem.name);
              if (alreadyHas) return prev;
              
              // Remove first empty prescription if it exists
              const cleaned = prev.filter(p => p.medication !== '' || p.treatment !== '');
              return [...cleaned, { id: Date.now() + Math.random(), medication: invItem.name, treatment: '', duration_days: '' }];
            });
          }
        });
      }
    }
    setSelectedKits(newSelectedKits);
  };
  const handleAddToQueue = () => {
    if (patient) {
      adicionarNaFila(patient.id, patient.name);
      setShowQueueSuccess(true);
      setTimeout(() => setShowQueueSuccess(false), 3000);
    }
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { id: Date.now(), medication: '', treatment: '', duration_days: '' }]);
  };

  const removePrescription = (id: number) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const updatePrescription = (id: number, field: 'medication' | 'treatment' | 'duration_days' | 'quantity', value: string) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const openReferralModal = () => {
    setRefWeight(patientEvents[0]?.weight ? (patientEvents[0].weight * 1000).toString() : '');
    setRefHeight(patientEvents[0]?.height ? patientEvents[0].height.toString() : '');
    setRefPE(patientEvents[0]?.z_score_weight_height !== undefined ? patientEvents[0].z_score_weight_height.toString() : '');
    setEdema('Não');
    setEdemaLocation('');
    setReferralReason('');
    setOtherReason('');
    setIsReferralModalOpen(true);
  };

  const handlePrintReferral = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save referral event
    const newEvent: ClinicalEvent = {
      id: `ref${Date.now()}`,
      patient_id: patient.id,
      event_type: 'referral',
      date: formatLocalDate(new Date()),
      notes: `Encaminhamento: ${referralReason}${otherReason ? ' - ' + otherReason : ''}. Edema: ${edema}${edemaLocation ? ' (' + edemaLocation + ')' : ''}`,
      weight: parseFloat(refWeight) / 1000,
      height: parseFloat(refHeight),
      z_score_weight_height: parseFloat(refPE),
      professional: 'Dra. Helena (Logada)',
      hospital_referral: true,
    };
    
    addEvent(newEvent);
    
    window.print();
    setIsReferralModalOpen(false);
  };

  const handleSendImpactUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!impactMessage.trim()) return;

    // Em um cenário real, isso salvaria no banco com status 'pending'
    console.log('Enviando atualização de impacto:', impactMessage);
    
    setIsImpactModalOpen(false);
    setImpactMessage('');
    setShowImpactSuccess(true);
    setTimeout(() => setShowImpactSuccess(false), 3000);
  };

  const generateSuggestions = () => {
    const suggestions = [];
    const lastEvent = patientEvents[0];
    const prevEvent = patientEvents[1];

    if (lastEvent && prevEvent) {
      // Weight progress
      if (lastEvent.weight > prevEvent.weight) {
        const gain = (lastEvent.weight - prevEvent.weight).toFixed(2);
        suggestions.push({
          label: 'Ganho de Peso',
          text: `Vitória! ${patient.name} teve um ótimo progresso e ganhou ${gain}kg desde a última visita. Continua firme no tratamento!`
        });
      }

      // Status improvement
      if (lastEvent.nutritional_status === 'Adequado' && prevEvent.nutritional_status !== 'Adequado') {
        suggestions.push({
          label: 'Recuperação Total',
          text: `Momento de celebração! ${patient.name} atingiu o estado nutricional Adequado hoje. Obrigado a todos que apoiam essa jornada!`
        });
      }
    }

    // General encouragement
    suggestions.push({
      label: 'Saúde Geral',
      text: `${patient.name} passou por consulta hoje e está reagindo muito bem aos suplementos. A família agradece o apoio!`
    });

    return suggestions;
  };

  const suggestions = generateSuggestions();

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
            <StatusBadge status={latestClinicalEvent?.nutritional_status || patient.status} />
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
          onClick={handleOpenNewFollowup}
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
        <button 
          onClick={() => setIsImpactModalOpen(true)}
          className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
        >
          <Heart size={18} className="fill-amber-600" />
          Enviar Atualização de Impacto
        </button>
        
        {!atendimentos.find(a => a.patient_id === patient.id && a.status !== 'completed' && a.date === formatLocalDate(new Date())) ? (
          <button 
            onClick={handleAddToQueue}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
          >
            <Clock size={18} className="text-emerald-600" />
            Colocar na Fila
          </button>
        ) : (
          <div className="bg-slate-100 text-slate-500 border border-slate-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 text-sm">
            <CheckCircle2 size={18} className="text-slate-400" />
            Já está na Fila
          </div>
        )}

        {showImpactSuccess && (
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-right-4 duration-300 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={16} /> Enviado para Aprovação!
          </div>
        )}

        {showQueueSuccess && (
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-right-4 duration-300 shadow-lg shadow-emerald-500/20">
            <Clock size={16} /> Adicionado à Fila!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto hide-scrollbar">
          <TabButton active={activeTab === 'resumo'} onClick={() => setActiveTab('resumo')} icon={Activity}>Resumo & Gráficos</TabButton>
          <TabButton active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} icon={Calendar}>Histórico Clínico</TabButton>
          <TabButton active={activeTab === 'ficha'} onClick={() => setActiveTab('ficha')} icon={User}>Ficha da Criança</TabButton>
        </div>

        <div className="p-6">
          {activeTab === 'resumo' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Weight size={14} className="text-emerald-500"/> Último Peso
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {latestWeightEvent?.weight ? `${latestWeightEvent.weight} kg` : '--'}
                  </p>
                  {latestWeightEvent && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-0.5 rounded-lg">
                      Medido em {new Date(latestWeightEvent.date).toLocaleDateString('pt-BR')} ({calculateAge(patient.dob, latestWeightEvent.date)})
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={14} className="text-blue-500"/> Última Estatura
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {latestHeightEvent?.height ? `${latestHeightEvent.height} cm` : '--'}
                  </p>
                  {latestHeightEvent && (
                    <p className="text-[10px] font-bold text-blue-600 mt-2 bg-blue-50 inline-block px-2 py-0.5 rounded-lg">
                      Em {new Date(latestHeightEvent.date).toLocaleDateString('pt-BR')} ({calculateAge(patient.dob, latestHeightEvent.date)})
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={14} className="text-amber-500"/> PB (Braquial)
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {latestMuacEvent?.muac ? `${latestMuacEvent.muac} cm` : '--'}
                  </p>
                  {latestMuacEvent?.muac && (
                    <p className="text-[10px] font-bold text-amber-600 mt-2 bg-amber-50 inline-block px-2 py-0.5 rounded-lg">
                      Zona: {latestMuacEvent.muac > 12.5 ? 'Verde' : latestMuacEvent.muac > 11.5 ? 'Amarela' : 'Vermelha'}
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={14} className="text-purple-500"/> P. Craniano
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {latestHeadEvent?.head_circumference ? `${latestHeadEvent.head_circumference} cm` : '--'}
                  </p>
                  {latestHeadEvent && (
                    <p className="text-[10px] font-bold text-slate-400 mt-2">
                      Medido em {new Date(latestHeadEvent.date).toLocaleDateString('pt-BR')} ({calculateAge(patient.dob, latestHeadEvent.date)})
                    </p>
                  )}
                </div>
              </div>

              {/* Active Medications Section */}
              <div className="bg-emerald-50/30 rounded-[2.5rem] p-8 border border-emerald-100/50 shadow-sm">
                <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                  <BriefcaseMedical size={18} className="text-emerald-600" />
                  Medicamentos e Suplementos Ativos
                </h3>
                {activeMedications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeMedications.map((p, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-emerald-100 flex flex-col group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg">
                            Prescrito em {parseLocalDate(latestClinicalEvent.date).toLocaleDateString('pt-BR')}
                          </span>
                          <Sparkles size={14} className="text-emerald-400" />
                        </div>
                        
                        <p className="text-sm font-black text-slate-800 mb-1">{p.medication}</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{p.treatment || 'Posologia não informada'}</p>
                        
                        {p.duration_days ? (() => {
                          const prescribedDate = parseLocalDate(latestClinicalEvent.date);
                          const today = new Date();
                          const daysTaken = Math.max(0, differenceInDays(today, prescribedDate));
                          const endDate = addDays(prescribedDate, p.duration_days);
                          const isFinished = daysTaken >= p.duration_days;

                          return (
                            <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
                              <div className="flex justify-between items-center text-[11px] uppercase tracking-wider">
                                <span className="font-bold text-slate-500">Uso (Dias)</span>
                                <span className={cn("font-black", isFinished ? "text-slate-400" : "text-emerald-600")}>
                                  {Math.min(daysTaken, p.duration_days)} / {p.duration_days}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full transition-all", isFinished ? "bg-slate-300" : "bg-emerald-500")}
                                  style={{ width: `${Math.min((daysTaken / p.duration_days) * 100, 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span>{isFinished ? 'TRATAMENTO CONCLUÍDO' : 'EM ANDAMENTO'}</span>
                                <span>FIM: {endDate.toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="mt-auto space-y-2 border-t border-slate-100 pt-3">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uso Contínuo / Sem Prazo</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/60 border border-emerald-100/50 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                    <BriefcaseMedical size={24} className="text-emerald-300/50 mb-3" />
                    <p className="text-sm font-bold text-slate-500">Nenhum medicamento ativo</p>
                    <p className="text-xs text-slate-400 mt-1">A criança não possui indicações de uso no momento.</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <GrowthCharts patient={patient} events={patientEvents} />
                
                {/* Simplified Evolution Table beneath charts */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    Dados das medições
                  </h3>
                  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="p-5">Data</th>
                            <th className="p-5 text-center">Peso (kg)</th>
                            <th className="p-5 text-center">Est. (cm)</th>
                            <th className="p-5 text-center">PB (cm)</th>
                            <th className="p-5 text-center">PC (cm)</th>
                            <th className="p-5 text-center">P/E (Z)</th>
                            <th className="p-5">Status</th>
                            <th className="p-5 text-right">Profissional</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {patientEvents.filter(e => e.event_type !== 'acs_visit').map((event) => (
                            <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-5 text-xs font-bold text-slate-600">
                                {parseLocalDate(event.date).toLocaleDateString()}
                              </td>
                              <td className="p-5 text-center text-sm font-black text-slate-900">
                                {event.weight || '--'}
                              </td>
                              <td className="p-5 text-center text-sm font-bold text-slate-700">
                                {event.height || '--'}
                              </td>
                              <td className="p-5 text-center text-sm font-bold text-slate-700">
                                {event.muac || '--'}
                              </td>
                              <td className="p-5 text-center text-sm font-bold text-slate-700">
                                {event.head_circumference || '--'}
                              </td>
                              <td className="p-5 text-center text-sm">
                                 <span className={cn(
                                   "font-black",
                                   event.z_score_weight_height && event.z_score_weight_height < -2 ? "text-red-500" : 
                                   event.z_score_weight_height && event.z_score_weight_height < -1 ? "text-amber-500" : "text-emerald-500"
                                 )}>
                                   {event.z_score_weight_height !== undefined ? event.z_score_weight_height : '--'}
                                 </span>
                              </td>
                              <td className="p-5">
                                {event.nutritional_status && <StatusBadge status={event.nutritional_status} />}
                              </td>
                              <td className="p-5 text-right text-xs font-bold text-slate-500">
                                {event.professional || '--'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ficha' && (
            <PatientProfile patientId={patient.id} />
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
                      {patientEvents.filter(e => e.event_type !== 'acs_visit').map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-xs font-medium text-slate-600">
                            {parseLocalDate(event.date).toLocaleDateString()}
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
                  {patientEvents.map((event, idx) => (
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
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><Clock size={12}/> {parseLocalDate(event.date).toLocaleDateString()}</span>
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
                        {(event.weight || event.height || event.muac || event.head_circumference) && (
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
                            {event.muac && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">P. Braquial</span>
                                <span className="text-base font-bold text-slate-900">{event.muac} <small className="text-[10px] text-slate-400 font-normal">cm</small></span>
                              </div>
                            )}
                            {event.head_circumference && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">P. Cefálico</span>
                                <span className="text-base font-bold text-slate-900">{event.head_circumference} <small className="text-[10px] text-slate-400 font-normal">cm</small></span>
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
                  {action === 'edit-last' ? 'Editar Acompanhamento Clínico' : 'Novo Acompanhamento Clínico'}
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
                    <input 
                      required
                      type="date"
                      value={eventDate}
                      onChange={e => {
                        setEventDate(e.target.value);
                        if (e.target.value) {
                          const newDate = parseLocalDate(e.target.value);
                          if (!isNaN(newDate.getTime())) {
                            newDate.setDate(newDate.getDate() + 14);
                            setReturnDate(formatLocalDate(newDate));
                          }
                        }
                      }}
                      className="w-full bg-emerald-50/50 border-b-2 border-emerald-200 px-0 py-1 text-sm font-bold text-emerald-900 focus:border-emerald-500 focus:outline-none bg-transparent"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Profissional *</p>
                    <input 
                      required
                      type="text" 
                      value={professional} 
                      onChange={e => setProfessional(e.target.value)}
                      className="w-full bg-emerald-50/50 border-b-2 border-emerald-200 px-0 py-1 text-sm font-bold text-emerald-900 focus:border-emerald-500 focus:outline-none bg-transparent"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Idade Atual</p>
                    <p className="text-sm font-bold text-emerald-900">{ageInMonths} meses</p>
                  </div>
                </div>

                {/* Measurements */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Peso (kg) *</label>
                    <input required type="number" step="0.01" value={newWeight} onChange={e => setNewWeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: 8.5" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Estatura (cm) *</label>
                    <input required type="number" step="0.1" value={newHeight} onChange={e => setNewHeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: 72" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">P. Braquial (cm)</label>
                    <input type="number" step="0.1" value={newMuac} onChange={e => setNewMuac(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: 12.5" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">P. Cefálico (cm)</label>
                    <input type="number" step="0.1" value={newHead} onChange={e => setNewHead(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: 42" />
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
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Kits Entregues (selecione múltiplos se necessário)</label>
                    <div className="flex flex-wrap gap-2">
                      {kits.map(kit => (
                        <button
                          key={kit.id}
                          type="button"
                          onClick={() => handleToggleKit(kit.id)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                            selectedKits.includes(kit.id) 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200" 
                              : "bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"
                          )}
                        >
                          {kit.name}
                        </button>
                      ))}
                    </div>
                    {selectedKits.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic">Nenhum kit selecionado</p>
                    )}
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
                      <div className="sm:col-span-4 space-y-1">
                        <select
                          value={p.item_id || ''}
                          onChange={e => {
                            const itemId = e.target.value;
                            const item = items.find(i => i.id === itemId);
                            setPrescriptions(prev => prev.map(pr => pr.id === p.id ? { ...pr, item_id: itemId, medication: item ? item.name : '' } : pr));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                          <option value="">Selecione do estoque...</option>
                          {items.filter(i => !i.internal_use && i.quantity > 0).map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.quantity} dispon.)</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3 space-y-1">
                        <input 
                          type="text" 
                          value={p.treatment} 
                          onChange={e => updatePrescription(p.id, 'treatment', e.target.value)} 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                          placeholder="Ex: 1 sachê 2x ao dia" 
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <input 
                          type="number" 
                          value={p.quantity} 
                          onChange={e => updatePrescription(p.id, 'quantity', e.target.value)} 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                          placeholder="Qtd (Retirada)" 
                          min="1"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <input 
                          type="number" 
                          value={p.duration_days} 
                          onChange={e => updatePrescription(p.id, 'duration_days', e.target.value)} 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                          placeholder="Uso (Dias)" 
                          min="1"
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

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={(e) => {
                    handleSaveEvent(e as any, true);
                  }}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] border border-emerald-200 transition-all shadow-sm"
                >
                  Alta do Programa
                </button>
                
                <button 
                  type="submit" 
                  form="followup-form"
                  className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-slate-900/10"
                >
                  Concluir Atendimento
                </button>
              </div>
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

      {/* Modal Enviar Atualização de Impacto */}
      {isImpactModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Heart size={24} className="text-amber-600 fill-amber-600" />
                Atualização de Impacto
              </h3>
              <button onClick={() => setIsImpactModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSendImpactUpdate} className="p-8 space-y-6">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                <p className="text-sm text-amber-900 font-medium leading-relaxed">
                  Esta mensagem será enviada para o <strong>Gestor</strong> aprovar antes de aparecer no feed de notícias dos apoiadores.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" /> Sugestões Inteligentes
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => setImpactMessage(s.text)}
                      className="text-[10px] font-bold bg-white border border-slate-200 hover:border-amber-500 hover:text-amber-600 px-3 py-2 rounded-xl transition-all shadow-sm"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensagem Final</label>
                <textarea 
                  value={impactMessage}
                  onChange={(e) => setImpactMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder="Selecione uma sugestão acima ou escreva aqui..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all resize-none font-medium text-slate-700"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsImpactModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!impactMessage.trim()}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Enviar
                </button>
              </div>
            </form>
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
