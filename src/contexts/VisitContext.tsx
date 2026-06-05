import React, { createContext, useContext, useState, useEffect } from 'react';
import { HomeVisit, mockHomeVisits } from '../lib/mockData';
import { formatLocalDate } from '../lib/utils';
import { addDays } from 'date-fns';

interface VisitContextType {
  visits: HomeVisit[];
  agendarVisita: (patientId: string, clinicalDate: string) => void;
  concluirVisita: (visitId: string, observations: string, checklist: any) => void;
}

const VisitContext = createContext<VisitContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_visits';

export function VisitProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState<HomeVisit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : mockHomeVisits;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  }, [visits]);

  const agendarVisita = (patientId: string, clinicalDate: string) => {
    // Check if there is already a pending visit for this patient
    const exists = visits.find(v => v.patient_id === patientId && v.status === 'pending');
    if (exists) return;

    const newVisit: HomeVisit = {
      id: `v${Date.now()}`,
      patient_id: patientId,
      acs_id: 'acs-1', // Default ACS
      date: formatLocalDate(addDays(new Date(), 7)), // Suggested for 7 days after
      status: 'pending',
      checklist: {
        house_cleanliness: 0,
        vitamins_followed: false,
        medical_recommendations_followed: false
      },
      observations: '',
      last_clinical_date: clinicalDate
    };

    setVisits(prev => [newVisit, ...prev]);
  };

  const concluirVisita = (visitId: string, observations: string, checklist: any) => {
    setVisits(prev => prev.map(v => v.id === visitId ? { 
      ...v, 
      status: 'completed', 
      observations, 
      checklist,
      date: formatLocalDate(new Date()) 
    } : v));
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
