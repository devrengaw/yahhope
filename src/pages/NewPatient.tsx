import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronLeft, Save, User, Activity, FileText, Home, HeartPulse, Plus, Trash2, ClipboardList, Stethoscope, CheckSquare } from 'lucide-react';
import { cn, calculateAge } from '../lib/utils';

const STEPS = [
  { id: 1, title: 'Identificação', icon: User },
  { id: 2, title: 'Triagem Social', icon: Home },
  { id: 3, title: 'História Gestacional', icon: HeartPulse },
  { id: 4, title: 'Alimentação', icon: FileText },
  { id: 5, title: 'História Clínica', icon: ClipboardList },
  { id: 6, title: 'Exame Físico', icon: Activity },
  { id: 7, title: 'Avaliação Nutricional', icon: Stethoscope },
  { id: 8, title: 'Conduta', icon: FileText },
  { id: 9, title: 'Conclusão', icon: CheckSquare },
];

export function NewPatient() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({
    // Step 1: Identificação
    service_date: new Date().toISOString().split('T')[0],
    registration_number: '', name: '', birthplace: '', province: '', origin: '',
    address: '', city: '', dob: '', gender: 'M', color: '', informant: '',
    main_complaint: '', history: '', current_medications: '',
    
    // Step 2: Triagem Social
    caregiver_name: '', marital_status: '', education: '', religion: '',
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
    discharge: false, return_needed: false, referral: '', return_date: '', filled_by: ''
  });

  // Complex States
  const [dependents, setDependents] = useState([{ id: 1, name: '', dob: '', weight: '', height: '', muac: '' }]);
  const [clinicalSigns, setClinicalSigns] = useState<string[]>([]);
  const [nutritionalEval, setNutritionalEval] = useState<string[]>([]);
  const [educationalActions, setEducationalActions] = useState<string[]>([]);

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

  const handleNext = () => currentStep < STEPS.length && setCurrentStep(currentStep + 1);
  const handlePrev = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, dependents, clinicalSigns, nutritionalEval, educationalActions };
    console.log('Payload para o Supabase:', payload);
    navigate('/nutrition/patients');
  };

  // Helper component for inputs
  const Input = ({ label, name, type = 'text', required = false, placeholder = '' }: any) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label} {required && '*'}</label>
      <input 
        required={required} type={type} name={name} value={formData[name] || ''} onChange={handleChange} placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
      />
    </div>
  );

  const Select = ({ label, name, options, required = false }: any) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label} {required && '*'}</label>
      <select required={required} name={name} value={formData[name] || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
        <option value="">Selecione...</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  const Textarea = ({ label, name, rows = 3 }: any) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <textarea name={name} value={formData[name] || ''} onChange={handleChange} rows={rows} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"></textarea>
    </div>
  );

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Data do Atendimento" name="service_date" type="date" required />
                  <Input label="Número de Identificação" name="registration_number" required />
                  <Input label="Nome da Criança" name="name" required />
                  <Input label="Data de Nascimento" name="dob" type="date" required />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Idade Calculada</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-600">
                      {formData.dob ? calculateAge(formData.dob) : '--'}
                    </div>
                  </div>
                  <Select label="Sexo" name="gender" options={['M', 'F']} required />
                  <Input label="Cor" name="color" />
                  <Input label="Naturalidade" name="birthplace" />
                  <Input label="Província" name="province" />
                  <Input label="Procedência" name="origin" />
                  <Input label="Cidade" name="city" />
                  <Input label="Informante" name="informant" />
                </div>
                <Input label="Endereço de Referência" name="address" />
                <Textarea label="Queixa Principal" name="main_complaint" />
                <Textarea label="História da Criança ou Gestante" name="history" />
                <Textarea label="Medicamentos ou Tratamentos em Uso" name="current_medications" />
              </div>
            )}

            {/* STEP 2: Triagem Social */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Informações Básicas dos Pais/Responsáveis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Nome dos Pais ou Responsáveis" name="caregiver_name" />
                    <Select label="Estado Civil" name="marital_status" options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']} />
                    <Select label="Grau de Instrução" name="education" options={['Nenhum', 'Ensino Primário', 'Ensino Secundário', 'Ensino Superior']} />
                    <Input label="Religião" name="religion" />
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
                    <Select label="Tipo de Casa" name="housing_type" options={['Própria', 'Alugada', 'Cedida', 'Outra']} />
                    <Input label="Número de Cômodos" name="rooms" type="number" />
                    <Input label="Tipo de Habitação" name="dwelling_type" />
                    <Input label="Cobertura" name="roof" />
                    <Select label="Saneamento Básico" name="sanitation" options={['Sim', 'Não']} />
                    <Select label="Rede de Esgoto" name="sewage" options={['Sim', 'Não']} />
                    <Select label="Destino do Lixo" name="garbage" options={['Coleta Pública', 'Queimado', 'Enterrado', 'Céu Aberto']} />
                    <Select label="Presença de Animais" name="animals" options={['Sim', 'Não']} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Condição Socioeconômica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Renda Familiar Mensal" name="monthly_income" type="number" />
                    <Input label="Trabalho do Pai" name="father_job" />
                    <Input label="Trabalho da Mãe" name="mother_job" />
                    <Input label="Trabalho do Responsável" name="caregiver_job" />
                  </div>
                  <div className="mt-6">
                    <Textarea label="Observações Sociais" name="social_observations" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: História Gestacional */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Problemas no Pré-natal" name="prenatal_problems" />
                  <Input label="Nº Consultas Pré-natal" name="prenatal_consultations" type="number" />
                  <Select label="Tipo de Parto" name="delivery_type" options={['Normal', 'Cesárea', 'Fórceps']} />
                  <Input label="Idade Gestacional (semanas)" name="gestational_age" type="number" />
                  <Input label="Apgar 1º Minuto" name="apgar_1" type="number" />
                  <Input label="Apgar 5º Minuto" name="apgar_5" type="number" />
                  <Input label="Peso ao Nascer (kg)" name="birth_weight" type="number" />
                  <Input label="Altura ao Nascer (cm)" name="birth_height" type="number" />
                  <Input label="Perímetro Cefálico (cm)" name="birth_hc" type="number" />
                  <Input label="Perímetro Torácico (cm)" name="birth_tc" type="number" />
                </div>
                <Textarea label="Problemas durante o nascimento" name="birth_problems" />
              </div>
            )}

            {/* STEP 4: Alimentação no 1º Ano */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Select label="Leite Materno" name="breast_milk" options={['Sim', 'Não']} />
                  <Input label="Exclusivo até quando (meses)" name="exclusive_breast_milk_until" />
                  <Input label="Idade do Desmame (meses)" name="weaning_age" />
                  <Input label="Intro. Água/Chá (meses)" name="water_tea_intro" />
                  <Input label="Intro. Leite de Vaca (meses)" name="cow_milk_intro" />
                  <Input label="Intro. Papas de Sal (meses)" name="salty_mush_intro" />
                  <Input label="Intro. Sucos (meses)" name="juice_intro" />
                  <Input label="Intro. Sopas (meses)" name="soup_intro" />
                </div>
                <Textarea label="Outros Alimentos" name="other_foods" />
                <Textarea label="Alimentação Atual" name="current_feeding" />
              </div>
            )}

            {/* STEP 5: História Clínica e Familiar */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <Textarea label="Suplementação Medicamentosa (Vitaminas/Sais)" name="supplements" />
                <Textarea label="Doenças e Internações Anteriores" name="previous_diseases" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Textarea label="História Familiar da Mãe" name="mother_history" />
                  <Textarea label="História Familiar do Pai" name="father_history" />
                  <Textarea label="História de Outros Familiares (1º Grau)" name="other_relatives_history" />
                  <Textarea label="História de Desnutrição na Família" name="family_malnutrition_history" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select label="Consanguinidade" name="consanguinity" options={['Sim', 'Não']} />
                  <Input label="Doenças Hereditárias" name="hereditary_diseases" />
                </div>
                <Textarea label="Dinâmica das Relações Familiares" name="family_dynamics" />
                <Textarea label="Imunização (Vacinas)" name="immunization" />
              </div>
            )}

            {/* STEP 6: Exame Físico */}
            {currentStep === 6 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Input label="Peso (kg)" name="weight" type="number" required />
                  <Input label="Estatura (cm)" name="height" type="number" required />
                  <Input label="Escore Z Estatura/Idade" name="z_score_height_age" type="number" />
                  <Input label="Escore Z Peso/Estatura" name="z_score_weight_height" type="number" />
                  <Input label="Perímetro Cefálico (cm)" name="head_circumference" type="number" />
                  <Input label="Perímetro Braquial (cm)" name="muac" type="number" />
                  <Input label="IMC" name="bmi" type="number" />
                  <Input label="IMC seg. Sem. Gestacional" name="bmi_gestational" type="number" />
                  <Select label="Edema Bilateral" name="bilateral_edema" options={['Não', 'Sim (+)', 'Sim (++)', 'Sim (+++)']} />
                  <Input label="Temperatura Axilar (°C)" name="axillary_temperature" type="number" />
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
                  <Input label="Saúde Oral" name="oral_health" />
                  <Input label="Outros Achados Clínicos" name="other_findings" />
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

            {/* STEP 8: Conduta */}
            {currentStep === 8 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Exames Complementares</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="HIV" name="exams_hiv" />
                    <Input label="Outros Exames" name="exams_other" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Tratamento</h3>
                  <Textarea label="Medicamentos" name="treatment_medications" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-2 p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <input type="checkbox" name="discharge" checked={formData.discharge} onChange={handleChange} className="w-5 h-5 text-emerald-600 rounded" />
                    <label className="font-medium text-slate-700">Alta</label>
                  </div>
                  <div className="flex items-center gap-2 p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <input type="checkbox" name="return_needed" checked={formData.return_needed} onChange={handleChange} className="w-5 h-5 text-emerald-600 rounded" />
                    <label className="font-medium text-slate-700">Retorno</label>
                  </div>
                  <Input label="Data do Retorno" name="return_date" type="date" />
                </div>
                <Textarea label="Encaminhamento" name="referral" />
                <Input label="Responsável pelo Preenchimento" name="filled_by" required />
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Save size={20} />
                  Salvar Cadastro Completo
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

