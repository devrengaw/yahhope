import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Activity, Home, Calendar, User, Weight, X, Stethoscope, Clock, BriefcaseMedical, Heart, Send, CheckCircle2, Sparkles, Package, Edit2, Trash2, Save, MessageSquare, Building2 } from 'lucide-react';
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
import { useConfirm } from '../contexts/ConfirmContext';

// Helper to calculate Z-score approximation based on WHO simplified math
const calculateZScoreAndStatus = (weight: number, height: number, gender: 'M' | 'F', ageInMonths?: number) => {
  if (!weight || !height || height < 45 || height > 120) return { zScore: null, status: 'N/A' };
  
  // 1. Weight-for-Height (WFH) Calculation (Original logic)
  const base = gender === 'M' ? 2.5 : 2.4;
  const wfhMedian = base + 0.15 * (height - 45) + 0.0015 * Math.pow(height - 45, 2);
  const wfhZ2Offset = 0.5 + (height - 45) * 0.03;
  const wfhZ3Offset = 0.8 + (height - 45) * 0.04;

  const wfh_z_2 = wfhMedian - wfhZ2Offset;
  const wfh_z_3 = wfhMedian - wfhZ3Offset;

  let zScore = 0;
  if (weight < wfhMedian) {
    zScore = -((wfhMedian - weight) / (wfhZ2Offset / 2)); // Approximate SD
  } else {
    zScore = ((weight - wfhMedian) / (wfhZ2Offset / 2));
  }

  let status = 'Adequado';
  if (weight <= wfh_z_3) status = 'DAG';
  else if (weight <= wfh_z_2) status = 'DAM';
  else if (zScore < -1) status = 'Risco';

  // 2. Age-based checks for Stunting (Height-for-Age) and Underweight (Weight-for-Age)
  if (ageInMonths !== undefined && ageInMonths >= 0) {
    // Piecewise approximation for Median Height
    let hfaMedian = 50;
    if (ageInMonths <= 3) hfaMedian = 50 + ageInMonths * 3.5;
    else if (ageInMonths <= 12) hfaMedian = 60.5 + (ageInMonths - 3) * 1.5;
    else if (ageInMonths <= 24) hfaMedian = 74 + (ageInMonths - 12) * 1.0;
    else if (ageInMonths <= 36) hfaMedian = 86 + (ageInMonths - 24) * 0.8;
    else if (ageInMonths <= 48) hfaMedian = 95.6 + (ageInMonths - 36) * 0.7;
    else hfaMedian = 104 + (ageInMonths - 48) * 0.5;

    // Roughly -3 SD for height is 10-12% below median
    const sd_h = hfaMedian * 0.04;
    
    // Piecewise approximation for Median Weight
    let wfaMedian = 3.3;
    if (ageInMonths <= 3) wfaMedian = 3.3 + ageInMonths * 0.9;
    else if (ageInMonths <= 12) wfaMedian = 6.0 + (ageInMonths - 3) * 0.3;
    else if (ageInMonths <= 24) wfaMedian = 8.7 + (ageInMonths - 12) * 0.23;
    else if (ageInMonths <= 36) wfaMedian = 11.5 + (ageInMonths - 24) * 0.16;
    else if (ageInMonths <= 48) wfaMedian = 13.4 + (ageInMonths - 36) * 0.15;
    else wfaMedian = 15.2 + (ageInMonths - 48) * 0.15;

    // Roughly -3 SD for weight is 25-30% below median
    const sd_w = wfaMedian * 0.10;

    // Check Stunting (Height-for-Age)
    if (height <= hfaMedian - 3 * sd_h && status !== 'DAG') {
      status = 'DAG'; // Severe stunting -> DAG
    } else if (height <= hfaMedian - 2 * sd_h && (status === 'Adequado' || status === 'Risco')) {
      status = 'DAM'; // Moderate stunting -> DAM
    }

    // Check Underweight (Weight-for-Age)
    if (weight <= wfaMedian - 3 * sd_w && status !== 'DAG') {
      status = 'DAG'; // Severe underweight -> DAG
    } else if (weight <= wfaMedian - 2 * sd_w && (status === 'Adequado' || status === 'Risco')) {
      status = 'DAM'; // Moderate underweight -> DAM
    }
  }

  return { zScore: parseFloat(zScore.toFixed(2)), status };
};

export function PatientDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addEvent, updateEvent, deleteEvent, updatePatient, patients, events } = usePatients();
  const { items, kits, deductKitFromInventory, deductPrescriptionsFromInventory } = useInventory();
  const { agendarVisita, visits } = useVisits();
  const { agendarAtendimento, concluirAtendimento, concluirAtendimentosPorPaciente, iniciarAtendimento, iniciarAtendimentoPorPaciente, adicionarNaFila, atendimentos, removerAtendimentosPorPaciente } = useAtendimento();
  const { sendNotification } = useNotification();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const isObserver = user?.role === 'OBSERVER';
  
  const searchParams = new URLSearchParams(location.search);
  const action = searchParams.get('action');
  const aptId = searchParams.get('aptId');

  const [activeTab, setActiveTab] = useState<'resumo' | 'ficha' | 'historico'>('resumo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Hospitalization State
  const [isHospitalizationModalOpen, setIsHospitalizationModalOpen] = useState(false);
  const [hospHospitalName, setHospHospitalName] = useState('Hospital Geral');
  const [hospDate, setHospDate] = useState(formatLocalDate(new Date()));
  const [hospReason, setHospReason] = useState('Desnutrição Aguda Grave com complicações clínicas');
  const [hospNotes, setHospNotes] = useState('');
  const [isSavingHospitalization, setIsSavingHospitalization] = useState(false);

  // Hospital Discharge State
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [hospDischargeDate, setHospDischargeDate] = useState(formatLocalDate(new Date()));
  const [hospDischargeStatus, setHospDischargeStatus] = useState<string>('DAG');
  const [hospDischargeReturnDate, setHospDischargeReturnDate] = useState<string>(formatLocalDate(addDays(new Date(), 7)));
  const [hospDischargeWeight, setHospDischargeWeight] = useState<string>('');
  const [hospDischargeHeight, setHospDischargeHeight] = useState<string>('');
  const [hospDischargeNotes, setHospDischargeNotes] = useState('');
  const [isSavingDischarge, setIsSavingDischarge] = useState(false);

  // Observer Observation Modal State
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observationDate, setObservationDate] = useState(formatLocalDate(new Date()));
  const [observationProfessional, setObservationProfessional] = useState(user?.name || '');
  const [observationNotes, setObservationNotes] = useState('');
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  
  const patient = patients.find(p => p.id === id);
  const isPatientHospitalized = patient?.status === 'Internada' || patient?.status === 'Internado';
  const patientVisits = (visits || []).filter(v => v.patient_id === id && v.status === 'completed').map(v => ({
    id: v.id,
    patient_id: v.patient_id,
    event_type: 'acs_visit' as const,
    date: v.date,
    notes: v.observations || 'Visita domiciliar realizada.',
    professional: 'ACS'
  }));
  const patientEvents = [...events.filter(e => e.patient_id === id), ...patientVisits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper to match a clinical consultation to its corresponding home visit (scheduled for the following week)
  const getVisitForEvent = (eventDate: string) => {
    if (!visits || !patient) return null;
    const pVisits = visits.filter(v => v.patient_id === patient.id);
    const pDate = parseLocalDate(eventDate);

    // 1. Prioritize COMPLETED visits
    // 1a. Direct match by last_clinical_date
    const directCompleted = pVisits.find(v => v.status === 'completed' && v.last_clinical_date === eventDate);
    if (directCompleted) return directCompleted;

    // 1b. Weekly cycle proximity match: visit occurred in the following week window (1 to 13 days after eventDate)
    const proximityCompleted = pVisits.find(v => {
      if (v.status !== 'completed') return false;
      const diff = differenceInDays(parseLocalDate(v.date), pDate);
      return diff >= 1 && diff <= 13;
    });
    if (proximityCompleted) return proximityCompleted;

    // 2. Fallback to PENDING visits
    // 2a. Direct match by last_clinical_date
    const directPending = pVisits.find(v => v.status === 'pending' && v.last_clinical_date === eventDate);
    if (directPending) return directPending;

    // 2b. Proximity match for pending visit (scheduled in the following week)
    const proximityPending = pVisits.find(v => {
      if (v.status !== 'pending') return false;
      const diff = differenceInDays(parseLocalDate(v.date), pDate);
      return diff >= 1 && diff <= 13;
    });
    if (proximityPending) return proximityPending;

    return null;
  };

  const formatProfessionalName = (prof?: string) => {
    if (!prof) return 'Profissional';
    if (prof === 'Dra. Helena (Logada)' || prof.includes('(Logada)') || prof === 'Dra. Helena') {
      return user?.name || 'Profissional';
    }
    if (prof === 'db5a34ae-1fd2-44ac-8135-f1a0bea91c29') return 'Amos Inacio';
    if (prof === '417afa81-df6d-406e-b605-86beec9da3f0') return 'Lucas Wagner';
    if (user && user.id === prof) return user.name;
    if (prof.includes('-') && prof.length > 20) return 'Amos Inacio';
    return prof;
  };

  useEffect(() => {
    if (isObserver) {
      if (action || aptId) {
        navigate(`/nutrition/patients/${id}`, { replace: true });
      }
      return;
    }
    if (action === 'new-followup') {
      const defaultReturnDate = new Date();
      defaultReturnDate.setDate(defaultReturnDate.getDate() + 14);
      setReturnDate(formatLocalDate(defaultReturnDate));
      setProfessional(user?.name || '');
      setIsModalOpen(true);
      if (patient) {
        iniciarAtendimentoPorPaciente(patient.id, patient.name);
        sendNotification('Atendimento Iniciado', `${patient.name} começou a ser atendido(a) na clínica agora.`, 'info');
      }
    } else if (action === 'edit-last') {
      const lastEvent = patientEvents[0];
      if (lastEvent) {
        setEditingEventId(lastEvent.id);
        setNewWeight(lastEvent.weight?.toString() || '');
        setNewHeight(lastEvent.height?.toString() || '');
        setNewMuac(lastEvent.muac?.toString() || '');
        setNewHead(lastEvent.head_circumference?.toString() || '');
        setNewNotes(lastEvent.notes || '');
        setReturnDate(lastEvent.return_date || '');
        setSelectedKits(lastEvent.kit_delivered || []);
        if (lastEvent.prescriptions && lastEvent.prescriptions.length > 0) {
          setPrescriptions(lastEvent.prescriptions);
        } else {
          setPrescriptions([{ id: '1', item_id: '', medication: '', treatment: '', duration_days: '', quantity: '' }]);
        }
        setEventDate(lastEvent.date);
        setIsModalOpen(true);
      }
    } else if (action === 'referral') {
      setRefProfessional(user?.name || '');
      setIsReferralModalOpen(true);
    }
  }, [action, aptId, patient?.id]);

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
    setEditingEventId(null);
    setIsModalOpen(true);

    if (patient) {
      iniciarAtendimentoPorPaciente(patient.id, patient.name);
      sendNotification('Atendimento Iniciado', `${patient.name} começou a ser atendido(a) na clínica agora.`, 'info');
    }
  };

  const handleEditPastEvent = (event: any) => {
    setEditingEventId(event.id);
    setNewWeight(event.weight?.toString() || '');
    setNewHeight(event.height?.toString() || '');
    setNewMuac(event.muac?.toString() || '');
    setNewHead(event.head_circumference?.toString() || '');
    setNewNotes(event.notes || '');
    setReturnDate(event.return_date || '');
    setSelectedKits(event.kit_delivered || []);
    if (event.prescriptions && event.prescriptions.length > 0) {
      setPrescriptions(event.prescriptions);
    } else {
      setPrescriptions([{ id: '1', item_id: '', medication: '', treatment: '', duration_days: '', quantity: '' }]);
    }
    setProfessional(event.professional || user?.name || '');
    setEventDate(event.date);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string, eventDate: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Atendimento',
      message: `Tem certeza que deseja excluir o atendimento do dia ${parseLocalDate(eventDate).toLocaleDateString()}? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await deleteEvent(eventId);
      sendNotification('Atendimento Excluído', 'O atendimento foi excluído com sucesso.', 'info');
    } catch (error) {
      console.error('Erro ao excluir atendimento:', error);
      sendNotification('Erro', 'Não foi possível excluir o atendimento.', 'error');
    }
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
  const [refProfessional, setRefProfessional] = useState(user?.name || '');
  const [refWeight, setRefWeight] = useState('');
  const [refHeight, setRefHeight] = useState('');
  const [refPE, setRefPE] = useState('');
  const [refStatus, setRefStatus] = useState('DAG');
  const [isHospitalized, setIsHospitalized] = useState<'Sim' | 'Não'>('Não');
  const [hospitalName, setHospitalName] = useState('');
  const [edema, setEdema] = useState<'Sim' | 'Não'>('Não');
  const [edemaLocation, setEdemaLocation] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  // Sync state with user when auth resolves
  useEffect(() => {
    if (user?.name) {
      if (!professional) setProfessional(user.name);
      if (!refProfessional) setRefProfessional(user.name);
      if (!observationProfessional) setObservationProfessional(user.name);
    }
  }, [user?.name]);

  // Active Medication Editing State
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);
  const [editedMedication, setEditedMedication] = useState<{ medication: string, treatment: string, duration_days?: string }>({ medication: '', treatment: '' });
  // Find latest events with specific measurements
  const latestWeightEvent = patientEvents.find(e => e.weight !== undefined);
  const latestHeightEvent = patientEvents.find(e => e.height !== undefined);
  const latestMuacEvent = patientEvents.find(e => e.muac !== undefined);
  const latestHeadEvent = patientEvents.find(e => e.head_circumference !== undefined);
  
  // For the diagnosis/Z-score, we use the latest clinical visit (not ACS visit and not observer notes)
  const latestClinicalEvent = patientEvents.find(e => e.event_type !== 'acs_visit' && e.event_type !== 'observation') || patientEvents[0];

  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationNotes.trim() || !patient) return;
    setIsSavingObservation(true);
    try {
      const newEvent: ClinicalEvent = {
        id: Math.random().toString(36).substring(2, 9),
        patient_id: patient.id,
        event_type: 'observation',
        date: observationDate,
        notes: observationNotes.trim(),
        professional: observationProfessional.trim() || user?.name || 'Profissional Observador'
      };
      await addEvent(newEvent);
      setIsObservationModalOpen(false);
      setObservationNotes('');
      setActiveTab('historico');
    } catch (err) {
      console.error('Erro ao salvar observação:', err);
      alert('Erro ao salvar observação clínica.');
    } finally {
      setIsSavingObservation(false);
    }
  };

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
              const alreadyHas = activeMedications.some(p => p.item_id === invItem.id || p.medication === invItem.name);
              if (!alreadyHas) {
                activeMedications.push({
                  medication: invItem.name,
                  treatment: kitItem.dosage ? `${kitItem.dosage} (Kit: ${kit.name})` : `Via Kit: ${kit.name}`,
                  duration_days: undefined,
                  quantity: kitItem.quantity?.toString(),
                });
              }
            }
          }
        });
      }
    });
  }

  const handleDeleteMedication = (index: number) => {
    if (!latestClinicalEvent) return;
    const newMeds = [...activeMedications];
    newMeds.splice(index, 1);
    updateEvent(latestClinicalEvent.id, { prescriptions: newMeds.length > 0 ? newMeds : undefined });
  };

  const handleSaveMedication = (index: number) => {
    if (!latestClinicalEvent) return;
    const newMeds = [...activeMedications];
    newMeds[index] = { 
      ...newMeds[index], 
      ...editedMedication,
      duration_days: editedMedication.duration_days ? parseInt(editedMedication.duration_days) : undefined
    };
    updateEvent(latestClinicalEvent.id, { prescriptions: newMeds });
    setEditingMedicationIndex(null);
  };
  
  if (!patient) return <div className="p-8 text-center">Paciente não encontrado</div>;

  // Auto-calculated fields for modal
  const ageInMonths = differenceInMonths(new Date(), new Date(patient.dob));
  const bmi = (newWeight && newHeight) ? (parseFloat(newWeight) / Math.pow(parseFloat(newHeight) / 100, 2)).toFixed(2) : '--';
  const { zScore, status: calcStatus } = calculateZScoreAndStatus(parseFloat(newWeight), parseFloat(newHeight), patient.gender, ageInMonths);
  const queueAppointment = patient ? atendimentos.find(
    a => a.patient_id === patient.id && a.status !== 'completed' && a.date <= formatLocalDate(new Date())
  ) : undefined;

  const handleSaveEvent = async (e: React.FormEvent, isDischarge: boolean = false) => {
    e.preventDefault();
    
    // Filter out empty prescriptions
    const validPrescriptions = prescriptions.filter(p => (p.item_id && p.item_id !== '') || (p.medication && p.medication.trim() !== '')).map(p => ({
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
      professional: professional || user?.name || 'Profissional',
      prescriptions: validPrescriptions.length > 0 ? validPrescriptions : undefined,
      notes: newNotes,
      return_date: isDischarge ? undefined : (returnDate || undefined),
      kit_delivered: selectedKits.length > 0 ? selectedKits : undefined,
      is_discharge: isDischarge,
    };
    
    const originalEvent = editingEventId ? patientEvents.find(e => e.id === editingEventId) : null;
    
    // Only deduct newly added kits during an edit
    const originalKits = originalEvent?.kit_delivered || [];
    const kitsToDeduct = editingEventId 
      ? selectedKits.filter(kitId => !originalKits.includes(kitId))
      : selectedKits;

    if (kitsToDeduct.length > 0) {
      kitsToDeduct.forEach(kitId => deductKitFromInventory(kitId, patient.id));
    }
    
    // Only deduct newly added prescriptions during an edit
    const originalPrescriptions = originalEvent?.prescriptions || [];
    const prescriptionsToDeduct = editingEventId
      ? validPrescriptions.filter(p => !originalPrescriptions.some(op => op.item_id === p.item_id))
      : validPrescriptions;

    if (prescriptionsToDeduct.length > 0) {
      deductPrescriptionsFromInventory(prescriptionsToDeduct, patient.id);
    }

    if (editingEventId) {
      updateEvent(editingEventId, newEvent);
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
    
    // Auto-schedule return if set, not discharge, not editing an old event, and date is in future
    const today = formatLocalDate(new Date());
    if (returnDate && !isDischarge && !editingEventId && returnDate > today) {
      agendarAtendimento(patient.id, patient.name, returnDate);
    }

    // Match and conclude appointment from queue if present (either via aptId or direct patient match)
    let concludedFromQueue = false;
    if (aptId) {
      await concluirAtendimento(aptId);
      concludedFromQueue = true;
    }
    
    // Also match any active appointment in the queue for this patient (e.g. attendant accessed via Crianças > Novo Acompanhamento)
    const matched = await concluirAtendimentosPorPaciente(patient.id);
    if (matched) {
      concludedFromQueue = true;
    }

    // Always ensure the ACS visit for next week is scheduled for new clinical events
    if (!editingEventId) {
      agendarVisita(patient.id, eventDate);
    }

    if (concludedFromQueue) {
      sendNotification(
        'Evolução Atualizada',
        `O atendimento de ${patient.name} foi finalizado e retirado da fila. Peso registrado: ${newWeight || '--'}kg, Estatura: ${newHeight || '--'}cm. Acesso o portal para ver detalhes.`,
        'success'
      );
    }

    setIsModalOpen(false);
    // Remove query params
    navigate(`/nutrition/patients/${patient.id}`, { replace: true });
    
    setNewWeight(''); setNewHeight(''); setNewMuac(''); setNewHead(''); setNewNotes(''); setReturnDate(formatLocalDate(addDays(new Date(), 14))); setSelectedKits([]); setEventDate(formatLocalDate(new Date()));
    setPrescriptions([{ id: Date.now().toString(), item_id: '', medication: '', treatment: '', duration_days: '', quantity: '' }]);
    setActiveTab('historico');
  };

  const handleToggleKit = (kitId: string) => {
    const isSelected = selectedKits.includes(kitId);
    let newSelectedKits: string[] = [];
    
    if (isSelected) {
      newSelectedKits = selectedKits.filter(id => id !== kitId);
      
      // Auto-remove medications from this kit
      const kit = kits.find(k => k.id === kitId);
      if (kit) {
        kit.items.forEach(kitItem => {
          const invItem = items.find(i => i.id === kitItem.item_id);
          if (invItem) {
            const cat = invItem.category?.toLowerCase() || '';
            const isMedication = cat.includes('medicamento') || cat.includes('remédio') || cat.includes('remedio') || cat.includes('suplemento');
            
            if (isMedication) {
              setPrescriptions(prev => {
                // If it's the last one, leave an empty template
                const filtered = prev.filter(p => p.medication !== invItem.name);
                if (filtered.length === 0) {
                  return [{ id: '1', item_id: '', medication: '', treatment: '', duration_days: '', quantity: '' }];
                }
                return filtered;
              });
            }
          }
        });
      }
    } else {
      newSelectedKits = [...selectedKits, kitId];
      
      // Auto-add medications from this kit
      const kit = kits.find(k => k.id === kitId);
      if (kit) {
        kit.items.forEach(kitItem => {
          const invItem = items.find(i => i.id === kitItem.item_id);
          if (invItem) {
            const cat = invItem.category?.toLowerCase() || '';
            const isMedication = cat.includes('medicamento') || cat.includes('remédio') || cat.includes('remedio') || cat.includes('suplemento');
            
            if (isMedication) {
              setPrescriptions(prev => {
                const alreadyHas = prev.some(p => p.medication === invItem.name);
                if (alreadyHas) return prev;
                
                // Remove first empty prescription if it exists
                const cleaned = prev.filter(p => p.medication !== '' || p.treatment !== '');
                return [...cleaned, { 
                  id: Date.now().toString() + Math.random().toString(), 
                  item_id: invItem.id,
                  medication: invItem.name, 
                  treatment: kitItem.dosage || '', 
                  duration_days: '',
                  quantity: kitItem.quantity?.toString() || '1'
                }];
              });
            }
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
    setPrescriptions([...prescriptions, { id: Date.now().toString(), item_id: '', medication: '', treatment: '', duration_days: '', quantity: '' }]);
  };

  const removePrescription = (id: number) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const updatePrescription = (id: number, field: 'medication' | 'treatment' | 'duration_days' | 'quantity', value: string) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const openReferralModal = (fromEvent?: { weight?: number, height?: number, zScore?: number, status?: string, professional?: string }) => {
    const w = fromEvent?.weight ?? patientEvents[0]?.weight;
    const h = fromEvent?.height ?? patientEvents[0]?.height;
    const pe = fromEvent?.zScore ?? patientEvents[0]?.z_score_weight_height;
    const st = fromEvent?.status || (patient ? patient.status : 'DAG');

    setRefProfessional(fromEvent?.professional || user?.name || '');
    setRefWeight(w ? (w * 1000).toString() : '');
    setRefHeight(h ? h.toString() : '');
    setRefPE(pe !== undefined && pe !== null ? pe.toString() : '');
    setRefStatus(st || 'DAG');
    setIsHospitalized(st === 'Internada' ? 'Sim' : 'Não');
    setHospitalName('');
    setEdema('Não');
    setEdemaLocation('');
    setReferralReason('');
    setOtherReason('');
    setIsReferralModalOpen(true);
  };

  const handleOpenReferralFromEdit = () => {
    const w = newWeight ? parseFloat(newWeight) : undefined;
    const h = newHeight ? parseFloat(newHeight) : undefined;
    const pe = zScore !== null ? zScore : undefined;
    const st = calcStatus !== 'N/A' ? calcStatus : (patient?.status || 'DAG');

    setIsModalOpen(false);
    openReferralModal({
      weight: w,
      height: h,
      zScore: pe,
      status: st,
      professional: professional || user?.name || ''
    });
  };

  const handlePrintReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    
    const hospitalizationNotes = isHospitalized === 'Sim'
      ? `Internada: Sim${hospitalName ? ` (${hospitalName})` : ''}`
      : 'Internada: Não';

    // Save referral event
    const newEvent: ClinicalEvent = {
      id: `ref${Date.now()}`,
      patient_id: patient.id,
      event_type: 'referral',
      date: formatLocalDate(new Date()),
      notes: `Encaminhamento: ${referralReason}${otherReason ? ' - ' + otherReason : ''}. Edema: ${edema}${edemaLocation ? ' (' + edemaLocation + ')' : ''}. ${hospitalizationNotes}. Status: ${refStatus}.`,
      weight: refWeight ? parseFloat(refWeight) / 1000 : undefined,
      height: refHeight ? parseFloat(refHeight) : undefined,
      z_score_weight_height: refPE ? parseFloat(refPE) : undefined,
      nutritional_status: refStatus,
      professional: refProfessional.trim() || user?.name || 'Profissional',
      hospital_referral: true,
    };
    
    addEvent(newEvent);

    updatePatient(patient.id, {
      status: refStatus as any
    });

    if (refStatus === 'Internada' || isHospitalized === 'Sim') {
      removerAtendimentosPorPaciente(patient.id);
    }
    
    window.print();
    setIsReferralModalOpen(false);
  };

  const handleConfirmHospitalization = async () => {
    if (!patient) return;
    setIsSavingHospitalization(true);
    try {
      // 1. Update patient status to 'Internada'
      updatePatient(patient.id, { status: 'Internada' });

      // 2. Add clinical event registering the hospitalization
      const notesParts = [];
      if (hospHospitalName) notesParts.push(`Hospital: ${hospHospitalName}`);
      if (hospReason) notesParts.push(`Motivo: ${hospReason}`);
      if (hospNotes) notesParts.push(`Notas: ${hospNotes}`);

      const newEvent: ClinicalEvent = {
        id: `hosp_${Date.now()}`,
        patient_id: patient.id,
        date: hospDate,
        weight: latestWeightEvent?.weight,
        height: latestHeightEvent?.height,
        muac: latestClinicalEvent?.muac,
        nutritional_status: 'Internada',
        notes: `[INTERNAÇÃO HOSPITALAR] ${notesParts.join(' | ')}`,
        event_type: 'referral',
        hospital_referral: true,
        professional: user?.name || 'Profissional',
      };

      addEvent(newEvent);

      // 3. Remove patient from consultation queue / pending appointments
      await removerAtendimentosPorPaciente(patient.id);

      sendNotification(
        'Internação Registrada',
        `${patient.name} foi marcada como Internada e isenta da rotina de consultas ambulatoriais.`,
        'info'
      );

      setIsHospitalizationModalOpen(false);
    } catch (err) {
      console.error('Erro ao registrar internação:', err);
    } finally {
      setIsSavingHospitalization(false);
    }
  };

  const handleConfirmDischarge = async () => {
    if (!patient) return;
    setIsSavingDischarge(true);
    try {
      const dischargeWeightNum = hospDischargeWeight ? parseFloat(hospDischargeWeight) : latestWeightEvent?.weight;
      const dischargeHeightNum = hospDischargeHeight ? parseFloat(hospDischargeHeight) : latestHeightEvent?.height;

      // 1. Update patient status to the discharge status
      updatePatient(patient.id, { status: hospDischargeStatus as any });

      // 2. Add clinical event registering hospital discharge
      const newEvent: ClinicalEvent = {
        id: `discharge_${Date.now()}`,
        patient_id: patient.id,
        date: hospDischargeDate,
        weight: dischargeWeightNum,
        height: dischargeHeightNum,
        muac: latestClinicalEvent?.muac,
        nutritional_status: hospDischargeStatus,
        notes: `[ALTA HOSPITALAR] Criança recebeu alta hospitalar e retornou ao acompanhamento ambulatorial. ${hospDischargeNotes ? `Observações: ${hospDischargeNotes}` : ''}`.trim(),
        event_type: 'acompanhamento',
        return_date: hospDischargeReturnDate || undefined,
        professional: user?.name || 'Profissional',
      };

      addEvent(newEvent);

      // 3. Auto-schedule return consultation if return date provided
      const today = formatLocalDate(new Date());
      if (hospDischargeReturnDate && hospDischargeReturnDate >= today) {
        agendarAtendimento(patient.id, patient.name, hospDischargeReturnDate);
      }

      // 4. Schedule home visit
      agendarVisita(patient.id, hospDischargeDate);

      sendNotification(
        'Alta Hospitalar Registrada',
        `${patient.name} recebeu alta hospitalar e retornou ao acompanhamento ambulatorial regular.`,
        'success'
      );

      setIsDischargeModalOpen(false);
    } catch (err) {
      console.error('Erro ao registrar alta hospitalar:', err);
    } finally {
      setIsSavingDischarge(false);
    }
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
            <StatusBadge status={isPatientHospitalized ? 'Internada' : (latestClinicalEvent?.nutritional_status || patient.status)} />
          </div>
          <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
            <span>ID: {patient.registration_number}</span>
            <span>•</span>
            <span>{calculateAge(patient.dob)} ({patient.gender === 'M' ? 'Masculino' : 'Feminino'})</span>
          </p>
        </div>
      </div>

      {/* Hospitalization Notice Banner */}
      {isPatientHospitalized && (
        <div className="bg-purple-50/90 border-2 border-purple-200 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-200">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-200 text-purple-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                  Criança Internada no Hospital
                </span>
                <span className="text-xs text-purple-700 font-semibold hidden sm:inline">Isenta da rotina ambulatorial</span>
              </div>
              <p className="text-sm font-semibold text-purple-950 mt-1">
                A criança encontra-se hospitalizada. As regras de consultas de retorno e presença na fila da clínica estão suspensas temporariamente.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setHospDischargeDate(formatLocalDate(new Date()));
              setHospDischargeStatus('DAG');
              setHospDischargeReturnDate(formatLocalDate(addDays(new Date(), 7)));
              setHospDischargeWeight(latestWeightEvent?.weight ? String(latestWeightEvent.weight) : '');
              setHospDischargeHeight(latestHeightEvent?.height ? String(latestHeightEvent.height) : '');
              setHospDischargeNotes('');
              setIsDischargeModalOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-200 text-sm shrink-0 active:scale-95"
          >
            <CheckCircle2 size={18} />
            Registrar Alta Hospitalar
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3">
        {isObserver ? (
          <button 
            onClick={() => {
              setObservationDate(formatLocalDate(new Date()));
              setObservationProfessional(user?.name || '');
              setObservationNotes('');
              setIsObservationModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-100 text-sm active:scale-95"
          >
            <MessageSquare size={18} />
            Adicionar Observação Clínica
          </button>
        ) : (
          <>
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
            
            {isPatientHospitalized ? (
              <>
                <button 
                  onClick={() => {
                    setHospDischargeDate(formatLocalDate(new Date()));
                    setHospDischargeStatus('DAG');
                    setHospDischargeReturnDate(formatLocalDate(addDays(new Date(), 7)));
                    setHospDischargeWeight(latestWeightEvent?.weight ? String(latestWeightEvent.weight) : '');
                    setHospDischargeHeight(latestHeightEvent?.height ? String(latestHeightEvent.height) : '');
                    setHospDischargeNotes('');
                    setIsDischargeModalOpen(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm active:scale-95"
                >
                  <CheckCircle2 size={18} />
                  Registrar Alta Hospitalar
                </button>
                <div 
                  className="bg-purple-50/70 text-purple-400 border border-purple-200/80 px-4 py-2 rounded-xl font-medium flex items-center gap-2 text-sm cursor-not-allowed select-none" 
                  title="A criança está internada no hospital. As consultas ambulatoriais estão suspensas até a alta hospitalar."
                >
                  <Clock size={18} className="text-purple-400" />
                  Fila Pausada (Internada)
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setHospDate(formatLocalDate(new Date()));
                    setHospHospitalName('Hospital Geral');
                    setHospReason('Desnutrição Aguda Grave com complicações clínicas');
                    setHospNotes('');
                    setIsHospitalizationModalOpen(true);
                  }}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
                  title="Registrar que a criança foi internada no hospital"
                >
                  <Building2 size={18} className="text-purple-600" />
                  Registrar Internação
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
              </>
            )}
          </>
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
                        {editingMedicationIndex === i ? (
                          <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Editando Medicação</span>
                            </div>
                            <input
                              type="text"
                              value={editedMedication.medication}
                              onChange={e => setEditedMedication(prev => ({ ...prev, medication: e.target.value }))}
                              className="w-full text-sm font-black text-slate-800 mb-2 border-b-2 border-slate-200 focus:border-emerald-500 outline-none pb-1 bg-transparent"
                              placeholder="Nome da Medicação"
                            />
                            <textarea
                              value={editedMedication.treatment}
                              onChange={e => setEditedMedication(prev => ({ ...prev, treatment: e.target.value }))}
                              className="w-full text-xs font-medium text-slate-600 leading-relaxed mb-4 border-b-2 border-slate-200 focus:border-emerald-500 outline-none pb-1 bg-transparent resize-none"
                              placeholder="Posologia"
                              rows={2}
                            />
                            <div className="flex gap-2 items-center mb-4">
                              <span className="text-xs font-bold text-slate-500">Duração (Dias):</span>
                              <input
                                type="number"
                                value={editedMedication.duration_days || ''}
                                onChange={e => setEditedMedication(prev => ({ ...prev, duration_days: e.target.value }))}
                                className="w-16 text-center text-sm font-bold border-b-2 border-slate-200 focus:border-emerald-500 outline-none bg-transparent"
                                placeholder="--"
                              />
                            </div>
                            <div className="mt-auto flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button onClick={() => setEditingMedicationIndex(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={16} />
                              </button>
                              <button onClick={() => handleSaveMedication(i)} className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                                <Save size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg">
                                Prescrito em {parseLocalDate(latestClinicalEvent.date).toLocaleDateString('pt-BR')}
                              </span>
                              {!isObserver && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => {
                                    setEditingMedicationIndex(i);
                                    setEditedMedication({ 
                                      medication: p.medication, 
                                      treatment: p.treatment,
                                      duration_days: p.duration_days?.toString() || ''
                                    });
                                  }} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteMedication(i)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
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
                              <div className="mt-auto space-y-2 border-t border-slate-100 pt-3 flex items-center justify-between">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uso Contínuo / Sem Prazo</p>
                                 <Sparkles size={14} className="text-emerald-400 opacity-50" />
                              </div>
                            )}
                          </>
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
                                {formatProfessionalName(event.professional)}
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
                        <th className="p-4 text-center">Visita Domiciliar</th>
                        {!isObserver && <th className="p-4 text-center">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {patientEvents.filter(e => e.event_type !== 'acs_visit' && e.event_type !== 'observation').map((event) => {
                        const relatedVisit = getVisitForEvent(event.date);
                        return (
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
                            <td className="p-4 text-center">
                              {relatedVisit ? (
                                relatedVisit.status === 'completed' ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                      Visitada ({parseLocalDate(relatedVisit.date).toLocaleDateString('pt-BR')})
                                    </span>
                                    {relatedVisit.observations && (
                                      <span className="text-[9px] text-slate-400 font-medium max-w-[140px] truncate" title={relatedVisit.observations}>
                                        {relatedVisit.observations}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock size={12} className="text-amber-600 shrink-0" />
                                      Na Fila ({parseLocalDate(relatedVisit.date).toLocaleDateString('pt-BR')})
                                    </span>
                                    <span className="text-[9px] text-amber-600/80 font-bold uppercase tracking-tight">
                                      Semana seguinte
                                    </span>
                                  </div>
                                )
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Não visitada
                                  </span>
                                  {!isObserver && (
                                    <button
                                      onClick={async () => {
                                        await agendarVisita(patient.id, event.date);
                                        sendNotification(
                                          'Visita Agendada',
                                          `A visita de ${patient.name} foi colocada na fila para a semana seguinte (${parseLocalDate(formatLocalDate(addDays(parseLocalDate(event.date), 7))).toLocaleDateString('pt-BR')}).`,
                                          'success'
                                        );
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                                      title="Colocar na fila de visitas domiciliares"
                                    >
                                      <Plus size={11} />
                                      Colocar na Fila
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            {!isObserver && (
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleEditPastEvent(event)}
                                    className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 transition-all cursor-pointer"
                                    title="Editar atendimento"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => openReferralModal({
                                      weight: event.weight,
                                      height: event.height,
                                      zScore: event.z_score_weight_height,
                                      status: event.nutritional_status || patient.status,
                                      professional: event.professional
                                    })}
                                    className="text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 transition-all cursor-pointer flex items-center gap-1"
                                    title="Fazer encaminhamento deste atendimento"
                                  >
                                    <FileText size={11} />
                                    Encaminhar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id, event.date)}
                                    className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 transition-all cursor-pointer flex items-center gap-1"
                                    title="Excluir atendimento"
                                  >
                                    <Trash2 size={11} />
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
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
                        event.event_type === 'acs_visit' ? 'bg-amber-500' : 
                        event.event_type === 'observation' ? 'bg-indigo-500' : 'bg-slate-500'
                      )}></div>
                      
                      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900 capitalize text-lg">
                              {event.event_type === 'initial' ? 'Avaliação Inicial' : 
                               event.event_type === 'acompanhamento' ? 'Acompanhamento Clínico' :
                               event.event_type === 'acs_visit' ? 'Visita ACS' : 
                               event.event_type === 'observation' ? 'Observação Clínica / Parecer' : 'Retorno'}
                            </span>
                            {event.event_type === 'observation' && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg">
                                Observador
                              </span>
                            )}
                            {event.nutritional_status && <StatusBadge status={event.nutritional_status} />}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><Clock size={12}/> {parseLocalDate(event.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><User size={12}/> {formatProfessionalName(event.professional)}</span>
                            {event.event_type !== 'acs_visit' && event.event_type !== 'observation' && !isObserver && (
                              <div className="flex items-center gap-1.5 ml-2">
                                <button
                                  onClick={() => handleEditPastEvent(event)}
                                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 transition-all cursor-pointer"
                                  title="Editar atendimento"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => openReferralModal({
                                    weight: event.weight,
                                    height: event.height,
                                    zScore: event.z_score_weight_height,
                                    status: event.nutritional_status || patient.status,
                                    professional: event.professional
                                  })}
                                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 transition-all cursor-pointer"
                                  title="Fazer encaminhamento deste atendimento"
                                >
                                  <FileText size={11} />
                                  Encaminhar
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id, event.date)}
                                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 transition-all cursor-pointer"
                                  title="Excluir atendimento"
                                >
                                  <Trash2 size={11} />
                                  Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {event.notes && (
                          <div className={cn(
                            "p-4 rounded-xl border mb-4",
                            event.event_type === 'observation' ? "bg-indigo-50/50 border-indigo-100 text-slate-700" : "bg-slate-50/50 border-slate-100 text-slate-600"
                          )}>
                            <p className="text-sm font-medium leading-relaxed">"{event.notes}"</p>
                          </div>
                        )}

                        {event.return_date && (
                          <div className="mb-4 bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                            <Calendar size={14} className="text-amber-600 shadow-sm" />
                            <span className="font-bold uppercase tracking-tight">Retorno agendado:</span> 
                            <span className="font-semibold">{new Date(event.return_date).toLocaleDateString()}</span>
                          </div>
                        )}

                        {event.kit_delivered && event.kit_delivered.length > 0 && (
                          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100 mb-4">
                            <Package className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-orange-800">
                              KIT ENTREGUE: <span className="font-semibold">{kits.find(k => k.id === event.kit_delivered?.[0])?.name || 'Kit Padrão'}</span>
                            </span>
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
                  {editingEventId ? 'Editar Acompanhamento Clínico' : 'Novo Acompanhamento Clínico'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Paciente: {patient.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenReferralFromEdit}
                  className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Fazer encaminhamento com os dados deste atendimento"
                >
                  <FileText size={14} className="text-amber-600" />
                  Fazer Encaminhamento
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="followup-form" onSubmit={handleSaveEvent} className="space-y-6">
                
                {/* Queue Match Alert Banner */}
                {queueAppointment && !editingEventId && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in duration-300">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">
                        Criança identificada na fila ({queueAppointment.status === 'in_progress' ? 'Em Atendimento' : queueAppointment.status === 'waiting' ? 'Na Fila' : 'Agendado'})
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Ao salvar este acompanhamento, o status passará direto para <strong>Atendidos Hoje</strong>.
                      </p>
                    </div>
                  </div>
                )}
                
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
                          {items.filter(i => !i.internal_use && !i.is_patrimonio && i.quantity > 0).map(item => (
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

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-3">
              <button 
                type="button"
                onClick={handleOpenReferralFromEdit}
                className="bg-amber-50 text-amber-800 hover:bg-amber-100 px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] border border-amber-200 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Fazer encaminhamento com os dados desta consulta"
              >
                <FileText size={13} className="text-amber-600" />
                Fazer Encaminhamento
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                
                <button 
                  type="button"
                  onClick={(e) => {
                    handleSaveEvent(e as any, true);
                  }}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] border border-emerald-200 transition-all shadow-sm cursor-pointer"
                >
                  Alta do Programa
                </button>
                
                <button 
                  type="submit" 
                  form="followup-form"
                  className="bg-slate-900 hover:bg-black text-white px-7 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-slate-900/10 cursor-pointer"
                >
                  {editingEventId ? 'Salvar Alterações' : 'Concluir Atendimento'}
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
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Profissional Responsável *</p>
                    <input 
                      required
                      type="text" 
                      value={refProfessional} 
                      onChange={e => setRefProfessional(e.target.value)}
                      placeholder="Nome do profissional"
                      className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
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

                {/* Status da Criança */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Status Clínico / Nutricional da Criança: *</label>
                    <span className="text-[11px] text-slate-400">Atualiza a ficha do paciente</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['DAG', 'DAM', 'Internada', 'Risco', 'Adequado', 'Encaminhada'].map(statusOption => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => {
                          setRefStatus(statusOption);
                          if (statusOption === 'Internada') {
                            setIsHospitalized('Sim');
                          }
                        }}
                        className={cn(
                          "px-2.5 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                          refStatus === statusOption
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20"
                            : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                        )}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Situação de Internação */}
                <div className="space-y-3 border-t border-slate-100 pt-4 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                      A criança está internada? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="isHospitalized" 
                          value="Não" 
                          checked={isHospitalized === 'Não'} 
                          onChange={() => {
                            setIsHospitalized('Não');
                            if (refStatus === 'Internada') setRefStatus('DAG');
                          }} 
                          className="text-purple-600 focus:ring-purple-500" 
                        />
                        <span className="text-sm font-medium text-slate-700">Não</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="isHospitalized" 
                          value="Sim" 
                          checked={isHospitalized === 'Sim'} 
                          onChange={() => {
                            setIsHospitalized('Sim');
                            setRefStatus('Internada');
                          }} 
                          className="text-purple-600 focus:ring-purple-500" 
                        />
                        <span className="text-sm font-bold text-purple-900">Sim (Internada)</span>
                      </label>
                    </div>
                  </div>

                  {isHospitalized === 'Sim' && (
                    <div className="mt-3 space-y-1 animate-in fade-in duration-200">
                      <label className="text-xs font-semibold text-purple-900">Hospital / Unidade de Saúde de Internação</label>
                      <input 
                        type="text" 
                        value={hospitalName} 
                        onChange={e => setHospitalName(e.target.value)} 
                        placeholder="Ex: Hospital Provincial de Pemba - Enfermaria Pediátrica" 
                        className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-xs"
                      />
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
                        <input 
                          required 
                          type="radio" 
                          name="referralReason" 
                          value={reason} 
                          checked={referralReason === reason} 
                          onChange={() => {
                            setReferralReason(reason);
                            if (reason === 'Internamento para desnutrição grave') {
                              setIsHospitalized('Sim');
                              setRefStatus('Internada');
                            }
                          }} 
                          className="text-emerald-600 focus:ring-emerald-500" 
                        />
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

      {/* Observation Modal (Observadores de Saúde & Equipe) */}
      {isObservationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Observação Clínica</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Parecer e notas técnicas sobre {patient.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsObservationModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveObservation} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Data da Observação
                  </label>
                  <input 
                    type="date"
                    value={observationDate}
                    onChange={(e) => setObservationDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Profissional / Especialidade
                  </label>
                  <input 
                    type="text"
                    value={observationProfessional}
                    onChange={(e) => setObservationProfessional(e.target.value)}
                    placeholder="Ex: Dra. Mariana - Pediatra"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Parecer Clínico / Observações *
                </label>
                <textarea 
                  value={observationNotes}
                  onChange={(e) => setObservationNotes(e.target.value)}
                  rows={5}
                  required
                  placeholder="Descreva suas observações técnicas sobre o quadro da criança, acompanhamento de evolução, alertas ou considerações multidisciplinares..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none font-medium text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsObservationModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!observationNotes.trim() || isSavingObservation}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingObservation ? 'Salvando...' : 'Salvar Observação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Internação Hospitalar */}
      {isHospitalizationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Registrar Internação</h3>
                  <p className="text-xs text-slate-500 font-medium">Internação hospitalar de {patient.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHospitalizationModalOpen(false)} 
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs text-purple-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-purple-800">
                <Building2 size={14} /> Regra de Consultas e Fila Clínica:
              </p>
              <p className="leading-relaxed">
                Ao registrar que a criança está internada, o status mudará para <strong>Internada</strong>. Ela sairá automaticamente da fila de consultas, não será computada em faltas nem gerará retornos pendentes enquanto estiver no hospital.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmHospitalization(); }} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Data da Internação *
                </label>
                <input 
                  type="date"
                  value={hospDate}
                  onChange={(e) => setHospDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Hospital / Unidade de Saúde *
                </label>
                <input 
                  type="text"
                  value={hospHospitalName}
                  onChange={(e) => setHospHospitalName(e.target.value)}
                  placeholder="Ex: Hospital Geral, Hospital Municipal, Centro Pediátrico..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Motivo / Diagnóstico da Internação
                </label>
                <input 
                  type="text"
                  value={hospReason}
                  onChange={(e) => setHospReason(e.target.value)}
                  placeholder="Ex: Desnutrição Aguda Grave com complicações, Infecção respiratória..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Observações Clínicas Adicionais
                </label>
                <textarea 
                  value={hospNotes}
                  onChange={(e) => setHospNotes(e.target.value)}
                  rows={3}
                  placeholder="Anotações sobre leito, contato com familiares, parecer médico do hospital..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium resize-none text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsHospitalizationModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingHospitalization}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-md shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSavingHospitalization ? 'Salvando...' : 'Confirmar Internação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Alta Hospitalar */}
      {isDischargeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Registrar Alta Hospitalar</h3>
                  <p className="text-xs text-slate-500 font-medium">Retorno ao acompanhamento ambulatorial de {patient.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDischargeModalOpen(false)} 
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
                A criança sairá da condição de internação hospitalar e retornará ao fluxo de consultas ambulatoriais e visitas domiciliares comunitárias.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmDischarge(); }} className="space-y-4">
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
                    placeholder={latestWeightEvent?.weight ? String(latestWeightEvent.weight) : "0.00"}
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
                    placeholder={latestHeightEvent?.height ? String(latestHeightEvent.height) : "0.0"}
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
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingDischarge}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSavingDischarge ? 'Salvando...' : 'Confirmar Alta'}
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
            <p><strong>Presença de Edema:</strong> {edema}{edema === 'Sim' && edemaLocation ? ` (${edemaLocation})` : ''}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-300 py-3 text-sm">
            <p><strong>Status Clínico / Nutricional:</strong> {refStatus}</p>
            <p><strong>Criança Internada:</strong> {isHospitalized === 'Sim' ? `Sim ${hospitalName ? `(${hospitalName})` : ''}` : 'Não'}</p>
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
            <p className="font-bold text-sm">{refProfessional.trim() || user?.name || 'Profissional'}</p>
            <p className="text-xs text-gray-600">Assinatura do Profissional</p>
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
