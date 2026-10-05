import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatLocalDate, parseLocalDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { addDays } from 'date-fns';
import { useAuth } from './AuthContext';

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
  iniciarAtendimentoPorPaciente: (patientId: string, patientName?: string) => Promise<string | null>;
  concluirAtendimento: (id: string) => Promise<void>;
  concluirAtendimentosPorPaciente: (patientId: string) => Promise<boolean>;
  removerDaFila: (id: string) => void;
  removerAtendimentosPorPaciente: (patientId: string) => Promise<void>;
  cancelarAtendimentoHoje: (patientId: string, appointmentId?: string | null) => Promise<void>;
}

const AtendimentoContext = createContext<AtendimentoContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_atendimentos'; // kept for backward compatibility reference, but no longer used

export function AtendimentoProvider({ children }: { children: React.ReactNode }) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const { user } = useAuth();

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

  const removerDaFila = async (id: string) => {
    setAtendimentos(prev => prev.filter(a => a.id !== id));
    await supabase.from('clinical_appointments').delete().eq('id', id);
  };

  const iniciarAtendimento = async (id: string) => {
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'in_progress' } : a));
    await supabase.from('clinical_appointments').update({ status: 'in_progress' }).eq('id', id);
  };

  const iniciarAtendimentoPorPaciente = async (patientId: string, patientName?: string): Promise<string | null> => {
    const today = formatLocalDate(new Date());
    // Find active or scheduled appointment for this patient today or past
    const apt = atendimentos.find(
      a => a.patient_id === patientId && a.status !== 'completed' && a.date <= today
    );

    if (apt) {
      if (apt.status !== 'in_progress') {
        await iniciarAtendimento(apt.id);
      }
      return apt.id;
    } else {
      // If none found in queue, automatically create an appointment in progress for today
      const newAtendimento: Omit<Atendimento, 'id'> = {
        patient_id: patientId,
        patient_name: patientName || 'Paciente',
        status: 'in_progress',
        date: today
      };
      const tempId = Math.random().toString();
      setAtendimentos(prev => [...prev, { ...newAtendimento, id: tempId }]);
      const { data } = await supabase.from('clinical_appointments').insert([newAtendimento]).select().single();
      if (data) {
        setAtendimentos(prev => prev.map(a => a.id === tempId ? data : a));
        return data.id;
      }
      return tempId;
    }
  };

  const concluirAtendimento = async (id: string) => {
    const today = formatLocalDate(new Date());
    const atendimento = atendimentos.find(a => a.id === id);
    const clinicalDate = atendimento?.date || today;

    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    await supabase.from('clinical_appointments').update({ status: 'completed' }).eq('id', id);

    if (atendimento) {
      // Check if a pending visit already exists for this clinical date
      const { data: existingVisits } = await supabase
        .from('home_visits')
        .select('id, last_clinical_date')
        .eq('patient_id', atendimento.patient_id)
        .eq('status', 'pending');

      const alreadyHasVisitForThisDate = existingVisits?.some(
        v => v.last_clinical_date === clinicalDate
      );

      if (!alreadyHasVisitForThisDate) {
        // Remove older pending visits from previous cycles to prevent duplicates
        if (existingVisits && existingVisits.length > 0) {
          const oldIds = existingVisits.map(v => v.id);
          await supabase.from('home_visits').delete().in('id', oldIds);
        }

        const acsId = user?.id || (await supabase.auth.getUser()).data.user?.id || '417afa81-df6d-406e-b605-86beec9da3f0';
        const visitDate = formatLocalDate(addDays(parseLocalDate(clinicalDate), 7));
        const newVisit = {
          patient_id: atendimento.patient_id,
          acs_id: acsId,
          date: visitDate,
          status: 'pending',
          checklist: {
            dynamic: {} // Use empty dynamic checklist instead of old format
          },
          observations: '',
          last_clinical_date: clinicalDate
        };

        const { error } = await supabase.from('home_visits').insert([newVisit]);
        if (error) {
          console.error('Failed to create home visit after attendance:', error);
        }
      }
    }
  };

  const concluirAtendimentosPorPaciente = async (patientId: string): Promise<boolean> => {
    const today = formatLocalDate(new Date());
    // Find any appointments in the queue, in progress, or scheduled for today/pending for this patient
    const matching = atendimentos.filter(
      a => a.patient_id === patientId && a.status !== 'completed' && a.date <= today
    );

    if (matching.length === 0) {
      return false;
    }

    for (const apt of matching) {
      await concluirAtendimento(apt.id);
    }
    return true;
  };

  const removerAtendimentosPorPaciente = async (patientId: string) => {
    const matching = atendimentos.filter(a => a.patient_id === patientId && a.status !== 'completed');
    if (matching.length > 0) {
      const ids = matching.map(a => a.id);
      setAtendimentos(prev => prev.filter(a => !ids.includes(a.id)));
      await supabase.from('clinical_appointments').delete().in('id', ids);
    }
  };

  const cancelarAtendimentoHoje = async (patientId: string, appointmentId?: string | null) => {
    const today = formatLocalDate(new Date());
    const matching = atendimentos.filter(
      a => (appointmentId && a.id === appointmentId) ||
           (a.patient_id === patientId && a.status !== 'completed' && a.date <= today)
    );

    const idsToDelete = new Set(matching.map(a => a.id));
    if (appointmentId) {
      idsToDelete.add(appointmentId);
    }
    const idsArray = Array.from(idsToDelete);

    if (idsArray.length > 0) {
      setAtendimentos(prev => prev.filter(a => !idsToDelete.has(a.id)));
      await supabase.from('clinical_appointments').delete().in('id', idsArray);
    }

    // Direct deletion fallback to ensure removal from supabase in all scenarios (e.g. recent insert)
    await supabase.from('clinical_appointments')
      .delete()
      .eq('patient_id', patientId)
      .neq('status', 'completed')
      .lte('date', today);

    await fetchAtendimentos();
  };

  return (
    <AtendimentoContext.Provider value={{ 
      atendimentos, 
      adicionarNaFila, 
      agendarAtendimento,
      marcarPresenca, 
      iniciarAtendimento, 
      iniciarAtendimentoPorPaciente,
      concluirAtendimento,
      concluirAtendimentosPorPaciente,
      removerDaFila,
      removerAtendimentosPorPaciente,
      cancelarAtendimentoHoje
    }}>
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
