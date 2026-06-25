import React, { createContext, useContext, useState, useEffect } from 'react';
import { HomeVisit } from '../lib/mockData';
import { formatLocalDate } from '../lib/utils';
import { addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface VisitContextType {
  visits: HomeVisit[];
  agendarVisita: (patientId: string, clinicalDate: string) => void;
  concluirVisita: (visitId: string, observations: string, checklist: any) => void;
}

const VisitContext = createContext<VisitContextType | undefined>(undefined);

export function VisitProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchVisits().then(() => {
      syncCompletedAtendimentosToVisits();
    });

    const sub = supabase.channel('visits_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_visits' }, () => {
        fetchVisits();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const syncCompletedAtendimentosToVisits = async () => {
    try {
      const { data: atendimentos } = await supabase.from('clinical_appointments').select('*').eq('status', 'completed');
      if (!atendimentos || atendimentos.length === 0) return;

      const { data: visits } = await supabase.from('home_visits').select('patient_id, last_clinical_date');
      if (!visits) return;

      const visitsMap = new Set(visits.filter(v => v.last_clinical_date).map(v => `${v.patient_id}_${v.last_clinical_date}`));

      const missingVisits = atendimentos.filter(a => !visitsMap.has(`${a.patient_id}_${a.date}`));

      if (missingVisits.length > 0) {
        const newVisits = missingVisits.map(a => ({
          patient_id: a.patient_id,
          acs_id: user?.id || null,
          date: formatLocalDate(addDays(new Date(a.date), 7)),
          status: 'pending',
          checklist: { dynamic: {} },
          observations: '',
          last_clinical_date: a.date
        }));

        const { error } = await supabase.from('home_visits').insert(newVisits);
        if (error) {
          console.error('Error syncing missed visits:', error);
        } else {
          fetchVisits();
        }
      }
    } catch (err) {
      console.error('Failed to sync completed atendimentos:', err);
    }
  };

  const fetchVisits = async () => {
    const { data } = await supabase.from('home_visits').select('*').order('date', { ascending: false });
    if (data) setVisits(data as HomeVisit[]);
  };

  const agendarVisita = async (patientId: string, clinicalDate: string) => {
    const exists = visits.find(v => v.patient_id === patientId && v.status === 'pending');
    if (exists) return;

    const tempId = Math.random().toString();
    const newVisit = {
      id: tempId,
      patient_id: patientId,
      acs_id: user?.id || null,
      date: formatLocalDate(addDays(new Date(), 7)),
      status: 'pending',
      checklist: {
        dynamic: {}
      },
      observations: '',
      last_clinical_date: clinicalDate
    };

    setVisits(prev => [newVisit as HomeVisit, ...prev]);

    const { data, error } = await supabase.from('home_visits').insert([{
      patient_id: newVisit.patient_id,
      acs_id: newVisit.acs_id,
      date: newVisit.date,
      status: newVisit.status,
      checklist: newVisit.checklist,
      observations: newVisit.observations,
      last_clinical_date: newVisit.last_clinical_date
    }]).select().single();
    
    if (data) {
      setVisits(prev => prev.map(v => v.id === tempId ? data as HomeVisit : v));
    } else if (error) {
      console.error('Error scheduling visit:', error);
    }
  };

  const concluirVisita = async (visitId: string, observations: string, checklist: any) => {
    const updates = { 
      status: 'completed' as const, 
      observations, 
      checklist,
      date: formatLocalDate(new Date()) 
    };

    setVisits(prev => prev.map(v => v.id === visitId ? { ...v, ...updates } : v));

    const { error } = await supabase.from('home_visits').update(updates).eq('id', visitId);
    if (error) {
      console.error('Error completing visit:', error);
    }
  };

  return (
    <VisitContext.Provider value={{ visits, agendarVisita, concluirVisita }}>
      {children}
    </VisitContext.Provider>
  );
}

export function useVisits() {
  const context = useContext(VisitContext);
  if (context === undefined) {
    throw new Error('useVisits must be used within a VisitProvider');
  }
  return context;
}
