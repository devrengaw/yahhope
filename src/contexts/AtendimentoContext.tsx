import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatLocalDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { addDays } from 'date-fns';

export type AtendimentoStatus = 'scheduled' | 'waiting' | 'in_progress' | 'completed';

export interface Atendimento {
  id: string;
  patient_id: string;
  patient_name: string;
  status: AtendimentoStatus;
  date: string; // YYYY-MM-DD
}

interface AtendimentoContextType {
  atendimentos: Atendimento[];
  adicionarNaFila: (patientId: string, patientName: string) => void;
  agendarAtendimento: (patientId: string, patientName: string, date: string) => void;
  marcarPresenca: (id: string) => void;
  iniciarAtendimento: (id: string) => void;
  concluirAtendimento: (id: string) => void;
}

const AtendimentoContext = createContext<AtendimentoContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_atendimentos'; // kept for backward compatibility reference, but no longer used

export function AtendimentoProvider({ children }: { children: React.ReactNode }) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  useEffect(() => {
    fetchAtendimentos();

    const sub = supabase.channel('atendimentos_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinical_appointments' }, () => {
        fetchAtendimentos();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchAtendimentos = async () => {
    const { data } = await supabase.from('clinical_appointments').select('*').order('date', { ascending: false });
    if (data) {
      setAtendimentos(data as Atendimento[]);
    }
  };
  
  const adicionarNaFila = async (patientId: string, patientName: string) => {
    const today = formatLocalDate(new Date());
    // Check if patient already in queue for today (not completed)
    const exists = atendimentos.find(a => a.patient_id === patientId && a.date === today && a.status !== 'completed');
    if (exists) return;

    const newAtendimento: Omit<Atendimento, 'id'> = {
      patient_id: patientId,
      patient_name: patientName,
      status: 'waiting',
      date: today
    };

    const tempId = Math.random().toString();
    setAtendimentos(prev => [...prev, { ...newAtendimento, id: tempId }]);

    const { data } = await supabase.from('clinical_appointments').insert([newAtendimento]).select().single();
    if (data) {
      setAtendimentos(prev => prev.map(a => a.id === tempId ? data : a));
    }
  };

  const agendarAtendimento = async (patientId: string, patientName: string, date: string) => {
    // Check if patient already scheduled for that date
    const exists = atendimentos.find(a => a.patient_id === patientId && a.date === date);
    if (exists) return;

    const newAtendimento: Omit<Atendimento, 'id'> = {
      patient_id: patientId,
      patient_name: patientName,
      status: 'scheduled',
      date: date
    };

    const tempId = Math.random().toString();
    setAtendimentos(prev => [...prev, { ...newAtendimento, id: tempId }]);

    const { data } = await supabase.from('clinical_appointments').insert([newAtendimento]).select().single();
    if (data) {
      setAtendimentos(prev => prev.map(a => a.id === tempId ? data : a));
    }
  };

  const marcarPresenca = async (id: string) => {
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'waiting' } : a));
    await supabase.from('clinical_appointments').update({ status: 'waiting' }).eq('id', id);
  };

  const iniciarAtendimento = async (id: string) => {
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'in_progress' } : a));
    await supabase.from('clinical_appointments').update({ status: 'in_progress' }).eq('id', id);
  };

  const concluirAtendimento = async (id: string) => {
    const atendimento = atendimentos.find(a => a.id === id);
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    await supabase.from('clinical_appointments').update({ status: 'completed' }).eq('id', id);

    if (atendimento) {
      const date = formatLocalDate(addDays(new Date(), 7));
      
      const newVisit = {
        patient_id: atendimento.patient_id,
        date: date,
        status: 'pending',
        checklist: {
          dynamic: {} // Use empty dynamic checklist instead of old format
        },
        observations: '',
        last_clinical_date: atendimento.date
      };

      const { error } = await supabase.from('home_visits').insert([newVisit]);
      if (error) {
        console.error('Failed to create home visit after attendance:', error);
      }
    }
  };

  return (
    <AtendimentoContext.Provider value={{ atendimentos, adicionarNaFila, agendarAtendimento, marcarPresenca, iniciarAtendimento, concluirAtendimento }}>
      {children}
    </AtendimentoContext.Provider>
  );
}

export function useAtendimento() {
  const context = useContext(AtendimentoContext);
  if (context === undefined) {
    throw new Error('useAtendimento must be used within an AtendimentoProvider');
  }
  return context;
}
