import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronLeft, Save, User, Activity, FileText, Home, HeartPulse, Plus, Trash2, ClipboardList, Stethoscope, CheckSquare, Heart } from 'lucide-react';
import { differenceInMonths } from 'date-fns';
import { calculateAge, cn, parseLocalDate, formatLocalDate } from '../lib/utils';
import { usePatients } from '../contexts/PatientContext';
import { useInventory } from '../contexts/InventoryContext';

const STEPS = [
  { id: 1, title: 'Identificação', icon: User },
  { id: 2, title: 'Triagem Social', icon: Home },
  { id: 3, title: 'História Gestacional', icon: HeartPulse },
  { id: 4, title: 'Alimentação', icon: FileText },
  { id: 5, title: 'História Clínica', icon: ClipboardList },
  { id: 6, title: 'Exame Físico', icon: Activity },
  { id: 7, title: 'Avaliação Nutricional', icon: Stethoscope },
  { id: 8, title: 'Complementar', icon: FileText },
  { id: 9, title: 'Conclusão', icon: CheckSquare },
];


const Input = ({ label, name, type = 'text', required = false, placeholder = '', formData, handleChange, readOnly = false }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label} {required && '*'}</label>
    <input 
      required={required} type={type} name={name} value={formData[name] || ''} onChange={handleChange} placeholder={placeholder} readOnly={readOnly}
      className={cn("w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all", readOnly && "opacity-70 cursor-not-allowed")} 
    />
  </div>
);

const Select = ({ label, name, options, required = false, formData, handleChange }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label} {required && '*'}</label>
    <select required={required} name={name} value={formData[name] || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
      <option value="">Selecione...</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, name, rows = 3, formData, handleChange }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <textarea name={name} value={formData[name] || ''} onChange={handleChange} rows={rows} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"></textarea>
  </div>
);

export function NewPatient() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({
    // Step 1: Identificação
    service_date: formatLocalDate(new Date()),
    registration_number: '', name: '', birthplace: '', province: '', origin: '',
    address: '', city: '', dob: '', gender: 'M', color: '', informant: '',
    main_complaint: '', history: '', current_medications: '',
    
    // Step 2: Triagem Social
    caregiver_name: '', marital_status: '', education: '', religion: '',
    caregiver_phone: '', caregiver_email: '',
    housing_type: 'Própria', rooms: '', dwelling_type: '', roof: '', sanitation: '',
    sewage: '', garbage: '', animals: 'Não', monthly_income: '', father_job: '',
    mother_job: '', caregiver_job: '', social_observations: '',
    
    // Step 3: História Gestacional
    prenatal_problems: '', prenatal_consultations: '', delivery_type: 'Normal',
    gestational_age: '', apgar_1: '', apgar_5: '', birth_weight: '', birth_height: '',
    birth_hc: '', birth_tc: '', birth_problems: '',
    
    // Step 4: Alimentação
    breast_milk: 'Sim', exclusive_breast_milk_until: '', weaning_age: '',
    water_tea_intro: '', cow_milk_intro: '', salty_mush_intro: '', juice_intro: '',
    soup_intro: '', other_foods: '', current_feeding: '',
    
    // Step 5: História Clínica
    supplements: '', previous_diseases: '', mother_history: '', father_history: '',
    other_relatives_history: '', family_malnutrition_history: '', consanguinity: 'Não',
    hereditary_diseases: '', family_dynamics: '', immunization: '',
    
    // Step 6: Exame Físico
    weight: '', height: '', z_score_height_age: '', z_score_weight_height: '',
    head_circumference: '', muac: '', bmi: '', bmi_gestational: '', bilateral_edema: 'Não',
    axillary_temperature: '', oral_health: '', other_findings: '',
    
    // Step 8: Conduta
    exams_hiv: '', exams_other: '', treatment_medications: '',
    
    // Step 9: Conclusão
    discharge: false,
    in_treatment: true,
    return_needed: false,
    referral: '',
    return_date: '',
    filled_by: '',
    general_observations: '',
    
    // Sponsorship
    enable_sponsorship: false,
    child_profile: '',
    child_photo: '',
    
    waiting_list_id: ''
  });

  // Complex States
  const [dependents, setDependents] = useState([{ id: 1, name: '', dob: '', weight: '', height: '', muac: '' }]);
  const [clinicalSigns, setClinicalSigns] = useState<string[]>([]);
  const [nutritionalEval, setNutritionalEval] = useState<string[]>([]);
  const [educationalActions, setEducationalActions] = useState<string[]>([]);
  const [examsList, setExamsList] = useState([{ id: 1, name: '', result: '' }]);
  const [medicationsList, setMedicationsList] = useState([{ id: 1, name: '', dosage: '' }]);

  const location = useLocation();
  const waitingChild = location.state?.waitingChild;

  useEffect(() => {
    if (waitingChild) {
      setFormData(prev => ({
        ...prev,
        name: waitingChild.name || '',
        dob: waitingChild.dob || '',
        address: waitingChild.address || '',
        caregiver_name: waitingChild.guardian_name || '',
        weight: waitingChild.weight || '',
        height: waitingChild.height || '',
        muac: waitingChild.muac || '',
        head_circumference: waitingChild.head_circumference || '',
        bilateral_edema: waitingChild.edema || 'Não',
        other_findings: waitingChild.notes || '',
        waiting_list_id: waitingChild.id
      }));
    }
  }, [waitingChild]);

  const { patients, addFullPatientRecord, isLoading } = usePatients();
  const { kits, items, deductKitFromInventory } = useInventory();
  const [selectedKits, setSelectedKits] = useState<string[]>([]);

  const handleToggleKit = (kitId: string) => {
    setSelectedKits(prev => 
      prev.includes(kitId) ? prev.filter(id => id !== kitId) : [...prev, kitId]
    );
  };

  // Auto-generate registration_number
  useEffect(() => {
    if (!isLoading && !formData.registration_number) {
      const currentYear = new Date().getFullYear().toString();
      const thisYearPatients = patients.filter(p => p.registration_number?.startsWith(currentYear));
      let nextNumber = 1;
      if (thisYearPatients.length > 0) {
        const max = Math.max(...thisYearPatients.map(p => {
          const numStr = p.registration_number.replace(currentYear, '');
          return parseInt(numStr, 10) || 0;
        }));
        nextNumber = max + 1;
      }
      const newRegNum = `${currentYear}${nextNumber.toString().padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, registration_number: newRegNum }));
    }
  }, [patients, isLoading, formData.registration_number]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleCheckboxArray = (state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (state.includes(value)) setState(state.filter(item => item !== value));
    else setState([...state, value]);
  };

  const handleDependentChange = (id: number, field: string, value: string) => {
    setDependents(dependents.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addDependent = () => setDependents([...dependents, { id: Date.now(), name: '', dob: '', weight: '', height: '', muac: '' }]);
  const removeDependent = (id: number) => setDependents(dependents.filter(d => d.id !== id));

  const handleExamChange = (id: number, field: string, value: string) => setExamsList(examsList.map(e => e.id === id ? { ...e, [field]: value } : e));
  const addExam = () => setExamsList([...examsList, { id: Date.now(), name: '', result: '' }]);
  const removeExam = (id: number) => setExamsList(examsList.filter(e => e.id !== id));

  const handleMedicationChange = (id: number, field: string, value: string) => setMedicationsList(medicationsList.map(m => m.id === id ? { ...m, [field]: value } : m));
  const addMedication = () => setMedicationsList([...medicationsList, { id: Date.now(), name: '', dosage: '' }]);
  const removeMedication = (id: number) => setMedicationsList(medicationsList.filter(m => m.id !== id));

  const handleNext = () => currentStep < STEPS.length && setCurrentStep(currentStep + 1);
  const handlePrev = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  // Auto-calculate Z-Scores and BMI
  useEffect(() => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const gender = formData.gender;
    const dob = formData.dob;
    const serviceDate = formData.service_date;

    let updates: any = {};

    if (serviceDate) {
      const returnDateObj = parseLocalDate(serviceDate);
      returnDateObj.setDate(returnDateObj.getDate() + 14);
      const calculatedReturn = formatLocalDate(returnDateObj);
      updates.return_date = calculatedReturn;
    }

    if (weight > 0 && height > 0) {
      // IMC
      const heightInMeters = height / 100;
      const calcBmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      
      // Z-Score Weight/Height (WHO approximation)
      let zWHCalc = '';
      if (height >= 45 && height <= 120) {
        const baseWH = gender === 'M' ? 2.5 : 2.4;
        const medianWH = baseWH + 0.15 * (height - 45) + 0.0015 * Math.pow(height - 45, 2);
        const z2OffsetWH = 0.5 + (height - 45) * 0.03;
        let zWH = 0;
        if (weight < medianWH) {
          zWH = -((medianWH - weight) / (z2OffsetWH / 2));
        } else {
          zWH = (weight - medianWH) / (z2OffsetWH / 2);
        }
        zWHCalc = zWH.toFixed(2);
      }

      updates.bmi = calcBmi;
      updates.bmi_gestational = calcBmi; // Preenchendo com o mesmo cálculo conforme solicitado
      updates.z_score_weight_height = zWHCalc;
    } else {
      if (formData.bmi !== '') updates.bmi = '';
      if (formData.bmi_gestational !== '') updates.bmi_gestational = '';
      if (formData.z_score_weight_height !== '') updates.z_score_weight_height = '';
    }

    if (height > 0 && dob) {
      // Z-Score Height/Age (WHO approximation)
      const ageM = differenceInMonths(new Date(), parseLocalDate(dob));
      if (ageM >= 0 && ageM <= 60) {
        const baseHA = gender === 'M' ? 50 : 49;
        const medianHA = baseHA + 25 * Math.pow(ageM / 12, 0.6);
        const z2OffsetHA = 4 + ageM * 0.05;
        const zHA = (height - medianHA) / (z2OffsetHA / 2);
        updates.z_score_height_age = zHA.toFixed(2);
      } else {
        if (formData.z_score_height_age !== '') updates.z_score_height_age = '';
      }
    } else {
      if (formData.z_score_height_age !== '') updates.z_score_height_age = '';
    }

    setFormData(prev => {
      let changed = false;
      for (const key in updates) {
        if (prev[key] !== updates[key]) {
          changed = true;
          break;
        }
      }
      return changed ? { ...prev, ...updates } : prev;
    });

  }, [formData.weight, formData.height, formData.dob, formData.gender, formData.service_date]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < STEPS.length) {
      handleNext();
      return;
    }
    
    setIsSubmitting(true);
    try {
      const validPrescriptions: any[] = medicationsList
        .filter((m: any) => m.name.trim() !== '')
        .map((m: any) => ({
          medication: m.name.trim(),
          treatment: m.dosage.trim(),
        }));

      // Auto-add kit items to prescriptions so they show up in medications area permanently
      if (selectedKits.length > 0) {
        selectedKits.forEach(kitId => {
          const kit = kits.find(k => k.id === kitId);
          if (kit) {
            kit.items.forEach(kitItem => {
              const invItem = items.find(i => i.id === kitItem.item_id);
              if (invItem) {
                const cat = invItem.category?.toLowerCase() || '';
                const isMedication = cat.includes('medicamento') || cat.includes('remédio') || cat.includes('remedio') || cat.includes('suplemento');
                
                if (isMedication) {
                  validPrescriptions.push({
                    medication: invItem.name,
                    treatment: kitItem.dosage ? `${kitItem.dosage} (Kit: ${kit.name})` : `Via Kit: ${kit.name}`,
                    quantity: kitItem.quantity,
                  });
                }
              }
            });
          }
        });
      }

      const payload = {
        ...formData,
        dependents,
        clinicalSigns,
        nutritionalEval,
        educationalActions,
        examsList,
        prescriptions: validPrescriptions,
        selectedKits
      };
      
      const newChildId = await addFullPatientRecord(payload);
      
      // Deduct kits from inventory
      if (selectedKits.length > 0 && newChildId) {
        selectedKits.forEach(kitId => deductKitFromInventory(kitId, newChildId));
      }
      
      navigate('/patients');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar cadastro. Verifique a conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

    return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/nutrition/patients" className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Novo Cadastro</h1>
          <p className="text-slate-500 mt-1 text-sm">Prontuário Eletrônico Longitudinal</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 overflow-x-auto hide-scrollbar">
        <div className="flex items-center justify-between relative min-w-[800px]">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          ></div>
          
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors border-2",
                  isActive ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : 
                  isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : 
                  "bg-white border-slate-200 text-slate-400"
                )}>
                  {isCompleted ? <Check size={20} /> : <Icon size={18} />}
                </div>
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isActive ? "text-emerald-700" : isCompleted ? "text-emerald-600" : "text-slate-400"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            {STEPS[currentStep - 1].title}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {/* STEP 1: Identificação */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 mb-2">
                  <div className="relative group cursor-pointer w-24 h-24 shrink-0">
                    <div className="w-full h-full rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-500 transition-colors">
                      {formData.child_photo ? (
                        <img src={formData.child_photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <User size={24} className="text-slate-400 group-hover:text-emerald-500 mb-1" />
                          <span className="text-[9px] font-bold text-slate-400 text-center px-1">Upload</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData(prev => ({ ...prev, child_photo: URL.createObjectURL(file) }));
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Foto da Criança</h3>
                    <p className="text-sm text-slate-500">Adicione uma foto ao prontuário (opcional)</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input formData={formData} handleChange={handleChange} label="Data do Atendimento" name="service_date" type="date" required />
                  <Input formData={formData} handleChange={handleChange} label="Número de Identificação" name="registration_number" required readOnly={true} />
                  <Input formData={formData} handleChange={handleChange} label="Nome da Criança" name="name" required />
                  <Input formData={formData} handleChange={handleChange} label="Data de Nascimento" name="dob" type="date" required />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Idade Calculada</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-600">
                      {formData.dob ? calculateAge(formData.dob) : '--'}
                    </div>
                  </div>
                  <Select formData={formData} handleChange={handleChange} label="Sexo" name="gender" options={['M', 'F']} required />
                  <Input formData={formData} handleChange={handleChange} label="Cor" name="color" />
                  <Input formData={formData} handleChange={handleChange} label="Naturalidade" name="birthplace" />
                  <Input formData={formData} handleChange={handleChange} label="Província" name="province" />
                  <Input formData={formData} handleChange={handleChange} label="Procedência" name="origin" />
                  <Input formData={formData} handleChange={handleChange} label="Cidade" name="city" />
                  <Input formData={formData} handleChange={handleChange} label="Informante" name="informant" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                        <Heart size={20} fill="currentColor" />
                      </div>
                      <h3 className="font-black text-slate-900 tracking-tight">Habilitar Apadrinhamento</h3>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Ao habilitar, esta criança ficará visível para apoiadores no portal externo.</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, enable_sponsorship: !prev.enable_sponsorship }))}
                      className={cn(
                        "w-16 h-8 rounded-full relative transition-all duration-300",
                        formData.enable_sponsorship ? "bg-amber-500 shadow-lg shadow-amber-500/30" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm",
                        formData.enable_sponsorship ? "translate-x-8" : ""
                      )}></div>
                    </button>
                  </div>
                  {formData.enable_sponsorship && (
                    <div className="md:col-span-2 mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="grid grid-cols-1 gap-6 items-start">
                        <div className="md:col-span-1">
                          <Input formData={formData} handleChange={handleChange} 
                            label="Perfil da Criança (Biografia para Apoiadores)" 
                            name="child_profile" 
                            rows={5} 
                            placeholder="Conte um pouco sobre a história, sonhos e personalidade da criança para os futuros padrinhos..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Triagem Social */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Informações Básicas dos Pais/Responsáveis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input formData={formData} handleChange={handleChange} label="Nome dos Pais ou Responsáveis" name="caregiver_name" />
                    <Select formData={formData} handleChange={handleChange} label="Estado Civil" name="marital_status" options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']} />
                    <Select formData={formData} handleChange={handleChange} label="Grau de Instrução" name="education" options={['Nenhum', 'Ensino Primário', 'Ensino Secundário', 'Ensino Superior']} />
                    <Input formData={formData} handleChange={handleChange} label="Religião" name="religion" />
                    <Input formData={formData} handleChange={handleChange} label="Celular" name="caregiver_phone" placeholder="(00) 00000-0000" />
                    <Input formData={formData} handleChange={handleChange} label="E-mail" name="caregiver_email" type="email" placeholder="email@exemplo.com" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-slate-800">Dependentes</h3>
                    <button type="button" onClick={addDependent} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium">
                      <Plus size={16} /> Adicionar Dependente
                    </button>
                  </div>
                  <div className="space-y-4">
                    {dependents.map((dep, index) => (
                      <div key={dep.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-slate-700 mb-1 block">Nome</label>
                          <input type="text" value={dep.name} onChange={(e) => handleDependentChange(dep.id, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700 mb-1 block">Data Nasc.</label>
                          <input type="date" value={dep.dob} onChange={(e) => handleDependentChange(dep.id, 'dob', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700 mb-1 block">Peso (kg)</label>
                          <input type="number" value={dep.weight} onChange={(e) => handleDependentChange(dep.id, 'weight', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700 mb-1 block">Estatura (cm)</label>
                          <input type="number" value={dep.height} onChange={(e) => handleDependentChange(dep.id, 'height', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-slate-700 mb-1 block">PB (cm)</label>
                            <input type="number" value={dep.muac} onChange={(e) => handleDependentChange(dep.id, 'muac', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                          </div>
                          <button type="button" onClick={() => removeDependent(dep.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-5">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Condições de Moradia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Select formData={formData} handleChange={handleChange} label="Tipo de Casa" name="housing_type" options={['Própria', 'Alugada', 'Cedida', 'Outra']} />
                    <Input formData={formData} handleChange={handleChange} label="Número de Cômodos" name="rooms" type="number" />
                    <Input formData={formData} handleChange={handleChange} label="Tipo de Habitação" name="dwelling_type" />
                    <Input formData={formData} handleChange={handleChange} label="Cobertura" name="roof" />
                    <Select formData={formData} handleChange={handleChange} label="Saneamento Básico" name="sanitation" options={['Sim', 'Não']} />
                    <Select formData={formData} handleChange={handleChange} label="Rede de Esgoto" name="sewage" options={['Sim', 'Não']} />
                    <Select formData={formData} handleChange={handleChange} label="Destino do Lixo" name="garbage" options={['Coleta Pública', 'Queimado', 'Enterrado', 'Céu Aberto']} />
                    <Select formData={formData} handleChange={handleChange} label="Presença de Animais" name="animals" options={['Sim', 'Não']} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Condição Socioeconômica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input formData={formData} handleChange={handleChange} label="Renda Familiar Mensal" name="monthly_income" type="number" />
                    <Input formData={formData} handleChange={handleChange} label="Trabalho do Pai" name="father_job" />
                    <Input formData={formData} handleChange={handleChange} label="Trabalho da Mãe" name="mother_job" />
                    <Input formData={formData} handleChange={handleChange} label="Trabalho do Responsável" name="caregiver_job" />
                  </div>
                  <div className="mt-6">
                    <Input formData={formData} handleChange={handleChange} label="Observações Sociais" name="social_observations" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: História Gestacional */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input formData={formData} handleChange={handleChange} label="Problemas no Pré-natal" name="prenatal_problems" />
                  <Input formData={formData} handleChange={handleChange} label="Nº Consultas Pré-natal" name="prenatal_consultations" type="number" />
                  <Select formData={formData} handleChange={handleChange} label="Tipo de Parto" name="delivery_type" options={['Normal', 'Cesárea', 'Fórceps']} />
                  <Input formData={formData} handleChange={handleChange} label="Idade Gestacional (semanas)" name="gestational_age" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Apgar 1º Minuto" name="apgar_1" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Apgar 5º Minuto" name="apgar_5" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Peso ao Nascer (kg)" name="birth_weight" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Altura ao Nascer (cm)" name="birth_height" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Perímetro Cefálico (cm)" name="birth_hc" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Perímetro Torácico (cm)" name="birth_tc" type="number" />
                </div>
                <Textarea formData={formData} handleChange={handleChange} label="Problemas durante o nascimento" name="birth_problems" />
              </div>
            )}

            {/* STEP 4: Alimentação no 1º Ano */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Select formData={formData} handleChange={handleChange} label="Leite Materno" name="breast_milk" options={['Sim', 'Não']} />
                  <Input formData={formData} handleChange={handleChange} label="Exclusivo até quando (meses)" name="exclusive_breast_milk_until" />
                  <Input formData={formData} handleChange={handleChange} label="Idade do Desmame (meses)" name="weaning_age" />
                  <Input formData={formData} handleChange={handleChange} label="Intro. Água/Chá (meses)" name="water_tea_intro" />
                  <Input formData={formData} handleChange={handleChange} label="Intro. Leite de Vaca (meses)" name="cow_milk_intro" />
                  <Input formData={formData} handleChange={handleChange} label="Intro. Papas de Sal (meses)" name="salty_mush_intro" />
                  <Input formData={formData} handleChange={handleChange} label="Intro. Sucos (meses)" name="juice_intro" />
                  <Input formData={formData} handleChange={handleChange} label="Intro. Sopas (meses)" name="soup_intro" />
                </div>
                <Textarea formData={formData} handleChange={handleChange} label="Outros Alimentos" name="other_foods" />
                <Textarea formData={formData} handleChange={handleChange} label="Alimentação Atual" name="current_feeding" />
              </div>
            )}

            {/* STEP 5: História Clínica e Familiar */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <Textarea formData={formData} handleChange={handleChange} label="Suplementação Medicamentosa (Vitaminas/Sais)" name="supplements" />
                <Textarea formData={formData} handleChange={handleChange} label="Doenças e Internações Anteriores" name="previous_diseases" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Textarea formData={formData} handleChange={handleChange} label="História Familiar da Mãe" name="mother_history" />
                  <Textarea formData={formData} handleChange={handleChange} label="História Familiar do Pai" name="father_history" />
                  <Textarea formData={formData} handleChange={handleChange} label="História de Outros Familiares (1º Grau)" name="other_relatives_history" />
                  <Textarea formData={formData} handleChange={handleChange} label="História de Desnutrição na Família" name="family_malnutrition_history" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select formData={formData} handleChange={handleChange} label="Consanguinidade" name="consanguinity" options={['Sim', 'Não']} />
                  <Input formData={formData} handleChange={handleChange} label="Doenças Hereditárias" name="hereditary_diseases" />
                </div>
                <Textarea formData={formData} handleChange={handleChange} label="Dinâmica das Relações Familiares" name="family_dynamics" />
                <Textarea formData={formData} handleChange={handleChange} label="Imunização (Vacinas)" name="immunization" />
              </div>
            )}

            {/* STEP 6: Exame Físico */}
            {currentStep === 6 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Input formData={formData} handleChange={handleChange} label="Peso (kg)" name="weight" type="number" required />
                  <Input formData={formData} handleChange={handleChange} label="Estatura (cm)" name="height" type="number" required />
                  <Input formData={formData} handleChange={handleChange} label="Escore Z Estatura/Idade" name="z_score_height_age" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Escore Z Peso/Estatura" name="z_score_weight_height" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Perímetro Cefálico (cm)" name="head_circumference" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="Perímetro Braquial (cm)" name="muac" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="IMC" name="bmi" type="number" />
                  <Input formData={formData} handleChange={handleChange} label="IMC seg. Sem. Gestacional" name="bmi_gestational" type="number" />
                  <Select formData={formData} handleChange={handleChange} label="Edema Bilateral" name="bilateral_edema" options={['Não', 'Sim (+)', 'Sim (++)', 'Sim (+++)']} />
                  <Input formData={formData} handleChange={handleChange} label="Temperatura Axilar (°C)" name="axillary_temperature" type="number" />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Sinais Clínicos de Desnutrição</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Manchas ou descamações pelagróides', 'Face senil', 'Hepatomegalia', 'Escassez de panículo adiposo', 'Despigmentação e queda do cabelo'].map(sign => (
                      <label key={sign} className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={clinicalSigns.includes(sign)} onChange={() => handleCheckboxArray(clinicalSigns, setClinicalSigns, sign)} className="w-4 h-4 text-emerald-600 rounded" />
                        <span className="text-sm text-slate-700">{sign}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input formData={formData} handleChange={handleChange} label="Saúde Oral" name="oral_health" />
                  <Input formData={formData} handleChange={handleChange} label="Outros Achados Clínicos" name="other_findings" />
                </div>
              </div>
            )}

            {/* STEP 7: Avaliação Nutricional */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Selecione as classificações aplicáveis:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Estatura adequada para idade', 'Baixa estatura para idade', 'Muito baixa estatura para idade',
                    'Desnutrição aguda ligeira', 'Desnutrição aguda moderada (DAM)', 'Desnutrição aguda grave sem complicações',
                    'Desnutrição aguda grave com complicações', 'Complicação médica sugestiva', 'Anemia', 'Hipovitaminose', 'Microcefalia', 'Outros'
                  ].map(evalItem => (
                    <label key={evalItem} className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input type="checkbox" checked={nutritionalEval.includes(evalItem)} onChange={() => handleCheckboxArray(nutritionalEval, setNutritionalEval, evalItem)} className="w-4 h-4 text-emerald-600 rounded" />
                      <span className="text-sm text-slate-700">{evalItem}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: Complementar */}
            {currentStep === 8 && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-slate-800">Exames Complementares</h3>
                    <button type="button" onClick={addExam} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium">
                      <Plus size={16} /> Adicionar Exame
                    </button>
                  </div>
                  <div className="mb-4">
                    <Input formData={formData} handleChange={handleChange} label="HIV" name="exams_hiv" />
                  </div>
                  <div className="space-y-4">
                    {examsList.map((exam) => (
                      <div key={exam.id} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-700 mb-1 block">Nome do Exame</label>
                          <input type="text" value={exam.name} onChange={(e) => handleExamChange(exam.id, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-700 mb-1 block">Resultado</label>
                          <input type="text" value={exam.result} onChange={(e) => handleExamChange(exam.id, 'result', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <button type="button" onClick={() => removeExam(exam.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-1">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-slate-800">Tratamento / Medicamentos</h3>
                    <button type="button" onClick={addMedication} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium">
                      <Plus size={16} /> Adicionar Medicamento
                    </button>
                  </div>
                  <div className="space-y-4">
                    {medicationsList.map((med) => (
                      <div key={med.id} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-700 mb-1 block">Nome do Medicamento</label>
                          <input type="text" value={med.name} onChange={(e) => handleMedicationChange(med.id, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-700 mb-1 block">Posologia / Uso</label>
                          <input type="text" value={med.dosage} onChange={(e) => handleMedicationChange(med.id, 'dosage', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <button type="button" onClick={() => removeMedication(med.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-1">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Ações Educativas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Orientação alimentar e crescimento', 'Orientação de desenvolvimento psicossocial',
                      'Orientação vacinal', 'Terapia de reidratação oral', 'Orientação de doença respiratória aguda', 'Outras orientações'
                    ].map(action => (
                      <label key={action} className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={educationalActions.includes(action)} onChange={() => handleCheckboxArray(educationalActions, setEducationalActions, action)} className="w-4 h-4 text-emerald-600 rounded" />
                        <span className="text-sm text-slate-700">{action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: Conclusão */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input formData={formData} handleChange={handleChange} label="Data do Retorno (Automático +14 dias)" name="return_date" type="date" />
                  
                  {/* Kits Entregues */}
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
                  
                  <Input formData={formData} handleChange={handleChange} label="Responsável pelo Preenchimento *" name="filled_by" required />
                </div>
                <Textarea formData={formData} handleChange={handleChange} label="Encaminhamento" name="referral" />
                <Textarea formData={formData} handleChange={handleChange} label="Observações Gerais sobre o Paciente" name="general_observations" />
              </div>
            )}

            {/* Footer Navigation */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
                  currentStep === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <ChevronLeft size={20} />
                Voltar
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  Próximo
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn("bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm", isSubmitting ? "opacity-50 cursor-not-allowed" : "")}
                >
                  <Save size={20} />
                  {isSubmitting ? 'Salvando...' : 'Salvar Cadastro Completo'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

