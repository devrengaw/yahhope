import React, { createContext, useContext, useState, useEffect } from 'react';
import { HomeVisit } from '../lib/mockData';
import { formatLocalDate } from '../lib/utils';
import { addDays } from 'date-fns';
import { supabase } from '../lib/supabase';

interface VisitContextType {
  visits: HomeVisit[];
  agendarVisita: (patientId: string, clinicalDate: string) => void;
  concluirVisita: (visitId: string, observations: string, checklist: any) => void;
}

const VisitContext = createContext<VisitContextType | undefined>(undefined);

export function VisitProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState<HomeVisit[]>([]);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    const { data } = await supabase.from('home_visits').select('*').order('date', { ascending: false });
    if (data) setVisits(data as HomeVisit[]);
  };

  const agendarVisita = async (patientId: string, clinicalDate: string) => {
    const exists = visits.find(v => v.patient_id === patientId && v.status === 'pending');
    if (exists) return;

    const newVisit = {
      patient_id: patientId,
      acs_id: 'acs-1', 
      date: formatLocalDate(addDays(new Date(), 7)),
      status: 'pending',
      checklist: {
        house_cleanliness: 0,
        vitamins_followed: false,
        medical_recommendations_followed: false
      },
      observations: '',
      last_clinical_date: clinicalDate
    };

    const { data, error } = await supabase.from('home_visits').insert([newVisit]).select().single();
    if (data) {
      setVisits(prev => [data as HomeVisit, ...prev]);
    }
  };

  const concluirVisita = async (visitId: string, observations: string, checklist: any) => {
    const updates = { 
      status: 'completed', 
      observations, 
      checklist,
      date: formatLocalDate(new Date()) 
    };

    const { error } = await supabase.from('home_visits').update(updates).eq('id', visitId);
    if (!error) {
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, ...updates } : v));
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
