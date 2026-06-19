import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, MapPin, Calendar, Users, Phone, Trash2, Edit2, Save, X, Home } from 'lucide-react';
import { calculateAge, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../contexts/PatientContext';

interface PatientProfileProps {
  patientId: string;
}

export function PatientProfile({ patientId }: PatientProfileProps) {
  const navigate = useNavigate();
  const { deletePatient } = usePatients();
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [childData, setChildData] = useState<any>(null);
  const [caregiverData, setCaregiverData] = useState<any>(null);
  const [householdData, setHouseholdData] = useState<any>(null);

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

      // Fetch Triage & Household (Optional, for display only)
      const { data: triage } = await supabase.from('social_triage').select('id').eq('child_id', patientId).single();
      if (triage) {
        const { data: household } = await supabase.from('household_conditions').select('*').eq('social_triage_id', triage.id).single();
        if (household) setHouseholdData(household);
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

  const handleDelete = () => {
    deletePatient(patientId);
    navigate('/nutrition/patients');
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
                onClick={() => setShowDeleteConfirm(true)}
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

      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-red-800 font-black text-lg flex items-center gap-2 mb-2">
            <Trash2 size={20} /> Tem certeza absoluta?
          </h3>
          <p className="text-red-700 text-sm mb-4 font-medium">
            A exclusão da criança apagará <b>todo o seu histórico clínico, pesagens, consultas e dados da família</b>. 
            Esta ação é irreversível.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleDelete}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              Sim, excluir permanentemente
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="px-6 py-2 bg-white text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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

        {/* Housing Info (Display Only to keep it simple, or add edit if needed) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Home size={18} className="text-amber-500" /> Condições de Moradia (Triagem)
          </h3>
          {householdData ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Tipo de Casa</span> <span className="font-medium text-slate-800">{householdData.housing_type || '--'}</span></div>
                <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Material</span> <span className="font-medium text-slate-800">{householdData.dwelling_type || '--'}</span></div>
                <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Saneamento</span> <span className="font-medium text-slate-800">{householdData.sanitation || '--'}</span></div>
                <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Animais no quintal</span> <span className="font-medium text-slate-800">{householdData.animals || '--'}</span></div>
              </div>
              <p className="text-xs text-slate-400 italic mt-4 pt-4 border-t border-slate-100">
                Os dados completos de triagem (saneamento, lixo, dependentes e socioeconômicos) foram registrados na Avaliação Inicial.
              </p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Nenhum formulário de triagem associado a esta criança.</p>
          )}
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
