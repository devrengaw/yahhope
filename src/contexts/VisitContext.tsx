import React, { createContext, useContext, useState, useEffect } from 'react';
import { HomeVisit } from '../lib/mockData';
import { formatLocalDate, parseLocalDate } from '../lib/utils';
import { addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface VisitContextType {
  visits: HomeVisit[];
  agendarVisita: (patientId: string, clinicalDate: string) => void;
  concluirVisita: (visitId: string, observations: string, checklist: any) => void;
  excluirVisita: (visitId: string) => void;
}

const VisitContext = createContext<VisitContextType | undefined>(undefined);

export function VisitProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    fetchVisits().then(() => {
      syncCompletedAtendimentosToVisits();
    });

    const sub = supabase.channel('visits_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_visits' }, () => {
        fetchVisits();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user?.id]);

  const syncCompletedAtendimentosToVisits = async () => {
    try {
      // 1. Sync visits for clinical appointments that are completed
      const { data: atendimentos } = await supabase
        .from('clinical_appointments')
        .select('*')
        .eq('status', 'completed');

      // 2. Also check clinical events (the clinical source of truth)
      const { data: clinicalEvents } = await supabase
        .from('clinical_events')
        .select('child_id, date');

      const { data: visitsData } = await supabase.from('home_visits').select('patient_id, last_clinical_date');
      const visitsMap = new Set((visitsData || []).filter(v => v.last_clinical_date).map(v => `${v.patient_id}_${v.last_clinical_date}`));

      const defaultAcsId = user?.id || (await supabase.auth.getUser()).data.user?.id || '417afa81-df6d-406e-b605-86beec9da3f0';
      const toInsert: { patient_id: string; acs_id: string; date: string; status: 'pending'; checklist: any; observations: string; last_clinical_date: string }[] = [];

      // Check appointments
      if (atendimentos) {
        for (const a of atendimentos) {
          const key = `${a.patient_id}_${a.date}`;
          if (!visitsMap.has(key)) {
            visitsMap.add(key);
            toInsert.push({
              patient_id: a.patient_id,
              acs_id: defaultAcsId,
              date: formatLocalDate(addDays(parseLocalDate(a.date), 7)),
              status: 'pending',
              checklist: { dynamic: {} },
              observations: '',
              last_clinical_date: a.date
            });
          }
        }
      }

      // Check clinical events
      if (clinicalEvents) {
        for (const ev of clinicalEvents) {
          const key = `${ev.child_id}_${ev.date}`;
          if (!visitsMap.has(key)) {
            visitsMap.add(key);
            toInsert.push({
              patient_id: ev.child_id,
              acs_id: defaultAcsId,
              date: formatLocalDate(addDays(parseLocalDate(ev.date), 7)),
              status: 'pending',
              checklist: { dynamic: {} },
              observations: '',
              last_clinical_date: ev.date
            });
          }
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('home_visits').insert(toInsert);
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
    const exists = visits.find(v => v.patient_id === patientId && v.status === 'pending' && v.last_clinical_date === clinicalDate);
    if (exists) return;

    // Clean up older pending visits from previous cycles for this patient
    const olderPending = visits.filter(v => v.patient_id === patientId && v.status === 'pending');
    if (olderPending.length > 0) {
      for (const old of olderPending) {
        await supabase.from('home_visits').delete().eq('id', old.id);
      }
      setVisits(prev => prev.filter(v => !(v.patient_id === patientId && v.status === 'pending')));
    }

    const tempId = Math.random().toString();
    const parsedClinical = parseLocalDate(clinicalDate);
    const visitDate = formatLocalDate(addDays(parsedClinical, 7));
    const acsId = user?.id || (await supabase.auth.getUser()).data.user?.id || '417afa81-df6d-406e-b605-86beec9da3f0';

    const newVisit = {
      id: tempId,
      patient_id: patientId,
      acs_id: acsId,
      date: visitDate,
      status: 'pending' as const,
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

  const excluirVisita = async (visitId: string) => {
    setVisits(prev => prev.filter(v => v.id !== visitId));
    const { error } = await supabase.from('home_visits').delete().eq('id', visitId);
    if (error) {
      console.error('Error deleting visit:', error);
    }
  };

  return (
    <VisitContext.Provider value={{ visits, agendarVisita, concluirVisita, excluirVisita }}>
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
