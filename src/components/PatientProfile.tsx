import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, MapPin, Calendar, Users, Phone, Trash2, Edit2, Save, X, Home, ClipboardList, HeartPulse, FileText, BriefcaseMedical, Baby, Activity } from 'lucide-react';
import { calculateAge, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../contexts/PatientContext';
import { useConfirm } from '../contexts/ConfirmContext';

interface PatientProfileProps {
  patientId: string;
}

export function PatientProfile({ patientId }: PatientProfileProps) {
  const navigate = useNavigate();
  const { deletePatient } = usePatients();
  const { confirm } = useConfirm();
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [childData, setChildData] = useState<any>(null);
  const [caregiverData, setCaregiverData] = useState<any>(null);
  const [householdData, setHouseholdData] = useState<any>(null);
  const [fullData, setFullData] = useState<any>({});

  // Form State
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchProfileData();
  }, [patientId]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch Child
      const { data: child } = await supabase.from('children').select('*').eq('id', patientId).single();
      if (child) {
        setChildData(child);
        setFormData((prev: any) => ({ ...prev, ...child }));
      }
      
      // Fetch Caregiver
      const { data: caregiver } = await supabase.from('caregivers').select('*').eq('child_id', patientId).single();
      if (caregiver) {
        setCaregiverData(caregiver);
        setFormData((prev: any) => ({ 
          ...prev, 
          caregiver_name: caregiver.name,
          caregiver_marital_status: caregiver.marital_status,
          caregiver_education: caregiver.education,
          caregiver_religion: caregiver.religion
        }));
      }

      // Fetch Triage & Household & Socioeconomics
      const { data: triage } = await supabase.from('social_triage').select('*').eq('child_id', patientId).single();
      if (triage) {
        const { data: household } = await supabase.from('household_conditions').select('*').eq('social_triage_id', triage.id).single();
        if (household) setHouseholdData(household);
        
        const { data: socioeconomics } = await supabase.from('socioeconomics').select('*').eq('social_triage_id', triage.id).single();
        if (socioeconomics) setFullData((prev: any) => ({ ...prev, socioeconomics }));
      }

      // Fetch Initial Assessments & Related
      const { data: ia } = await supabase.from('initial_assessments').select('*').eq('child_id', patientId).single();
      if (ia) {
        setFullData((prev: any) => ({ ...prev, initial_assessment: ia }));
        
        const { data: gestational } = await supabase.from('gestational_history').select('*').eq('assessment_id', ia.id).single();
        if (gestational) setFullData((prev: any) => ({ ...prev, gestational }));
        
        const { data: feeding } = await supabase.from('feeding_history').select('*').eq('assessment_id', ia.id).single();
        if (feeding) setFullData((prev: any) => ({ ...prev, feeding }));
        
        const { data: clinical } = await supabase.from('clinical_history').select('*').eq('assessment_id', ia.id).single();
        if (clinical) setFullData((prev: any) => ({ ...prev, clinical }));
        
        const { data: physical } = await supabase.from('physical_exam').select('*').eq('assessment_id', ia.id).single();
        if (physical) setFullData((prev: any) => ({ ...prev, physical }));
      }

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Update Child
      await supabase.from('children').update({
        name: formData.name,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        color: formData.color
      }).eq('id', patientId);

      // Update Caregiver
      if (caregiverData) {
        await supabase.from('caregivers').update({
          name: formData.caregiver_name,
          marital_status: formData.caregiver_marital_status,
          education: formData.caregiver_education,
          religion: formData.caregiver_religion
        }).eq('id', caregiverData.id);
      } else if (formData.caregiver_name) {
        // Create if didn't exist
        await supabase.from('caregivers').insert({
          child_id: patientId,
          name: formData.caregiver_name,
          marital_status: formData.caregiver_marital_status,
          education: formData.caregiver_education,
          religion: formData.caregiver_religion
        });
      }

      setIsEditing(false);
      fetchProfileData(); // Reload
      // Note: We might want to trigger context refresh too, but a page reload or minimal state is fine
      window.location.reload(); // Simple way to ensure Context is updated
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Houve um erro ao salvar os dados.");
    }
  };

  const handleDelete = async () => {
    if (await confirm({
      title: 'Tem certeza absoluta?',
      message: 'A exclusão da criança apagará todo o seu histórico clínico, pesagens, consultas e dados da família. Esta ação é irreversível.',
      confirmText: 'Sim, excluir permanentemente',
      type: 'danger'
    })) {
      deletePatient(patientId);
      navigate('/nutrition/patients');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando ficha...</div>;
  if (!childData) return <div className="p-8 text-center text-slate-500">Dados não encontrados.</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <User className="text-emerald-500" /> 
          Ficha Cadastral
        </h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 border border-slate-200"
              >
                <Edit2 size={16} /> Editar
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 border border-red-100"
              >
                <Trash2 size={16} /> Excluir
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 border border-slate-200"
              >
                <X size={16} /> Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save size={16} /> Salvar Alterações
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Child Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 mb-6">
            <User size={18} className="text-emerald-500" /> Dados da Criança
          </h3>
          <div className="space-y-4">
            <ProfileField 
              label="Nome Completo" name="name" value={formData.name} 
              isEditing={isEditing} onChange={handleInputChange} 
            />
            <div className="grid grid-cols-2 gap-4">
              <ProfileField 
                label="Data de Nascimento" name="dob" type="date" value={formData.dob} 
                isEditing={isEditing} onChange={handleInputChange} 
              />
              <ProfileField 
                label="Gênero" name="gender" value={formData.gender} 
                isEditing={isEditing} onChange={handleInputChange} 
                type="select" options={['M', 'F']}
              />
            </div>
            <ProfileField 
              label="Cor/Raça" name="color" value={formData.color} 
              isEditing={isEditing} onChange={handleInputChange} 
            />
            {!isEditing && (
              <ProfileField 
                label="Idade Atual" value={calculateAge(childData.dob)} isEditing={false} 
              />
            )}
          </div>
        </div>

        {/* Contact & Address */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest flex items-center gap-2 mb-6">
            <MapPin size={18} className="text-blue-500" /> Localização
          </h3>
          <div className="space-y-4">
            <ProfileField 
              label="Endereço / Comunidade" name="address" value={formData.address} 
              isEditing={isEditing} onChange={handleInputChange} 
            />
            <div className="grid grid-cols-2 gap-4">
              <ProfileField 
                label="Cidade" name="city" value={formData.city} 
                isEditing={isEditing} onChange={handleInputChange} 
              />
              <ProfileField 
                label="Província/Estado" name="province" value={formData.province} 
                isEditing={isEditing} onChange={handleInputChange} 
              />
            </div>
          </div>
        </div>

        {/* Caregiver Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-purple-800 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Users size={18} className="text-purple-500" /> Responsável (Família)
          </h3>
          <div className="space-y-4">
            <ProfileField 
              label="Nome do Responsável" name="caregiver_name" value={formData.caregiver_name} 
              isEditing={isEditing} onChange={handleInputChange} 
            />
            <ProfileField 
              label="Estado Civil" name="caregiver_marital_status" value={formData.caregiver_marital_status} 
              isEditing={isEditing} onChange={handleInputChange} 
              type="select" options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Outro']}
            />
            <ProfileField 
              label="Escolaridade" name="caregiver_education" value={formData.caregiver_education} 
              isEditing={isEditing} onChange={handleInputChange} 
            />
            <ProfileField 
              label="Religião" name="caregiver_religion" value={formData.caregiver_religion} 
              isEditing={isEditing} onChange={handleInputChange} 
            />
          </div>
        </div>

        {/* Full Registration Data Accordions */}
        <div className="md:col-span-2 space-y-4 mt-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
            <ClipboardList size={18} className="text-slate-500" /> Cadastro Completo (Admissão)
          </h3>
          
          <details className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <summary className="font-bold text-slate-800 px-6 py-4 cursor-pointer hover:bg-slate-50 flex justify-between items-center list-none select-none">
              <div className="flex items-center gap-2"><Home size={18} className="text-amber-500"/> Triagem Social e Condições de Moradia</div>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <DisplayField label="Tipo de Casa" value={householdData?.housing_type} />
                <DisplayField label="Cômodos" value={householdData?.rooms} />
                <DisplayField label="Material" value={householdData?.dwelling_type} />
                <DisplayField label="Telhado" value={householdData?.roof} />
                <DisplayField label="Saneamento" value={householdData?.sanitation} />
                <DisplayField label="Esgoto" value={householdData?.sewage} />
                <DisplayField label="Lixo" value={householdData?.garbage} />
                <DisplayField label="Animais no Quintal" value={householdData?.animals} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <DisplayField label="Renda Mensal" value={fullData.socioeconomics?.monthly_income ? `MZN ${fullData.socioeconomics.monthly_income}` : ''} />
                <DisplayField label="Trabalho Pai" value={fullData.socioeconomics?.father_job} />
                <DisplayField label="Trabalho Mãe" value={fullData.socioeconomics?.mother_job} />
                <DisplayField label="Trabalho Responsável" value={fullData.socioeconomics?.caregiver_job} />
                <DisplayField label="Observações Sociais" value={fullData.socioeconomics?.observations} />
              </div>
            </div>
          </details>

          <details className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <summary className="font-bold text-slate-800 px-6 py-4 cursor-pointer hover:bg-slate-50 flex justify-between items-center list-none select-none">
              <div className="flex items-center gap-2"><Baby size={18} className="text-rose-500"/> História Gestacional</div>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
              <DisplayField label="Intercorrências Pré-Natal" value={fullData.gestational?.prenatal_problems} />
              <DisplayField label="Consultas Pré-Natal" value={fullData.gestational?.prenatal_consultations} />
              <DisplayField label="Tipo de Parto" value={fullData.gestational?.delivery_type} />
              <DisplayField label="Idade Gestacional" value={fullData.gestational?.gestational_age} />
              <DisplayField label="APGAR 1 min" value={fullData.gestational?.apgar_1} />
              <DisplayField label="APGAR 5 min" value={fullData.gestational?.apgar_5} />
              <DisplayField label="Peso ao Nascer" value={fullData.gestational?.birth_weight ? `${fullData.gestational.birth_weight} kg` : ''} />
              <DisplayField label="Estatura ao Nascer" value={fullData.gestational?.birth_height ? `${fullData.gestational.birth_height} cm` : ''} />
              <DisplayField label="PC ao Nascer" value={fullData.gestational?.birth_hc ? `${fullData.gestational.birth_hc} cm` : ''} />
              <DisplayField label="Intercorrências no Parto" value={fullData.gestational?.birth_problems} />
            </div>
          </details>

          <details className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <summary className="font-bold text-slate-800 px-6 py-4 cursor-pointer hover:bg-slate-50 flex justify-between items-center list-none select-none">
              <div className="flex items-center gap-2"><FileText size={18} className="text-orange-500"/> Alimentação</div>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
              <DisplayField label="Leite Materno" value={fullData.feeding?.breast_milk ? 'Sim' : 'Não'} />
              <DisplayField label="Exclusivo Até (meses)" value={fullData.feeding?.exclusive_breast_milk_until} />
              <DisplayField label="Idade Desmame" value={fullData.feeding?.weaning_age} />
              <DisplayField label="Intro: Água/Chá" value={fullData.feeding?.water_tea_intro} />
              <DisplayField label="Intro: Leite de Vaca" value={fullData.feeding?.cow_milk_intro} />
              <DisplayField label="Intro: Papa Salgada" value={fullData.feeding?.salty_mush_intro} />
              <DisplayField label="Intro: Suco" value={fullData.feeding?.juice_intro} />
              <DisplayField label="Intro: Sopa" value={fullData.feeding?.soup_intro} />
              <DisplayField label="Outros Alimentos" value={fullData.feeding?.other_foods} />
              <DisplayField label="Alimentação Atual" value={fullData.feeding?.current_feeding} />
            </div>
          </details>

          <details className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <summary className="font-bold text-slate-800 px-6 py-4 cursor-pointer hover:bg-slate-50 flex justify-between items-center list-none select-none">
              <div className="flex items-center gap-2"><BriefcaseMedical size={18} className="text-indigo-500"/> História Clínica e Familiar</div>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 text-sm grid grid-cols-2 md:grid-cols-3 gap-4">
              <DisplayField label="Doenças Prévias" value={fullData.clinical?.previous_diseases} />
              <DisplayField label="Suplementos" value={fullData.clinical?.supplements} />
              <DisplayField label="Imunização" value={fullData.clinical?.immunization} />
              <DisplayField label="Histórico Materno" value={fullData.clinical?.mother_history} />
              <DisplayField label="Histórico Paterno" value={fullData.clinical?.father_history} />
              <DisplayField label="Desnutrição na Família" value={fullData.clinical?.family_malnutrition_history} />
              <DisplayField label="Consanguinidade" value={fullData.clinical?.consanguinity ? 'Sim' : 'Não'} />
              <DisplayField label="Doenças Hereditárias" value={fullData.clinical?.hereditary_diseases} />
              <DisplayField label="Dinâmica Familiar" value={fullData.clinical?.family_dynamics} />
            </div>
          </details>
          
          <details className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <summary className="font-bold text-slate-800 px-6 py-4 cursor-pointer hover:bg-slate-50 flex justify-between items-center list-none select-none">
              <div className="flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Avaliação Inicial e Exame Físico</div>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <DisplayField label="Data da Avaliação" value={fullData.initial_assessment?.date} />
                <DisplayField label="Informante" value={fullData.initial_assessment?.informant} />
                <DisplayField label="Queixa Principal" value={fullData.initial_assessment?.main_complaint} />
                <DisplayField label="História da Doença" value={fullData.initial_assessment?.history} />
                <DisplayField label="Medicamentos em Uso" value={fullData.initial_assessment?.current_medications} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                <DisplayField label="Peso" value={fullData.physical?.weight ? `${fullData.physical.weight} kg` : ''} />
                <DisplayField label="Estatura" value={fullData.physical?.height ? `${fullData.physical.height} cm` : ''} />
                <DisplayField label="Perímetro Braquial" value={fullData.physical?.muac ? `${fullData.physical.muac} cm` : ''} />
                <DisplayField label="Perímetro Cefálico" value={fullData.physical?.head_circumference ? `${fullData.physical.head_circumference} cm` : ''} />
                <DisplayField label="Edema Bilateral" value={fullData.physical?.bilateral_edema} />
                <DisplayField label="Temperatura" value={fullData.physical?.axillary_temperature ? `${fullData.physical.axillary_temperature} °C` : ''} />
                <DisplayField label="Saúde Oral" value={fullData.physical?.oral_health} />
                <DisplayField label="Outros Achados" value={fullData.physical?.other_findings} />
              </div>
            </div>
          </details>

        </div>
      </div>

    </div>
  );
}

// Helper Component
const ProfileField = ({ label, name, value, isEditing, onChange, type = 'text', options }: any) => {
  if (isEditing && name) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
        {type === 'select' ? (
          <select 
            name={name} value={value || ''} onChange={onChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
          >
            <option value="">Selecione...</option>
            {options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input 
            type={type} name={name} value={value || ''} onChange={onChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold text-slate-800 mt-0.5">{value || '--'}</span>
    </div>
  );
};

const DisplayField = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
    <span className="text-sm font-medium text-slate-800 mt-0.5">{value || '--'}</span>
  </div>
);
