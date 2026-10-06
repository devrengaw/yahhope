import React, { createContext, useContext, useState, useEffect } from 'react';
import { HomeVisit } from '../lib/mockData';
import { formatLocalDate, parseLocalDate } from '../lib/utils';
import { addDays, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface VisitContextType {
  visits: HomeVisit[];
  agendarVisita: (patientId: string, clinicalDate: string) => Promise<boolean>;
  concluirVisita: (visitId: string, observations: string, checklist: any) => Promise<void>;
  excluirVisita: (visitId: string) => Promise<void>;
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
      // 1. Clinical events are the clinical source of truth
      const { data: clinicalEvents } = await supabase
        .from('clinical_events')
        .select('child_id, date')
        .not('event_type', 'in', '("acs_visit","observation")')
        .order('date', { ascending: false });

      if (!clinicalEvents || clinicalEvents.length === 0) return;

      // 2. Fetch all existing visits (both completed and pending)
      const { data: visitsData } = await supabase.from('home_visits').select('*');
      const allVisits = (visitsData || []) as HomeVisit[];

      const defaultAcsId = user?.id || (await supabase.auth.getUser()).data.user?.id || '417afa81-df6d-406e-b605-86beec9da3f0';
      const toInsert: { patient_id: string; acs_id: string; date: string; status: 'pending'; checklist: any; observations: string; last_clinical_date: string }[] = [];
      const staleVisitIds: string[] = [];

      // Group clinical events by child to find each child's latest attendance
      const latestEventByChild = new Map<string, string>();
      for (const ev of clinicalEvents) {
        if (!latestEventByChild.has(ev.child_id)) {
          latestEventByChild.set(ev.child_id, ev.date);
        }
      }

      // Group existing pending visits by patient
      const pendingByChild = new Map<string, HomeVisit[]>();
      for (const v of allVisits) {
        if (v.status === 'pending') {
          const list = pendingByChild.get(v.patient_id) || [];
          list.push(v);
          pendingByChild.set(v.patient_id, list);
        }
      }

      // 3. For each child, preserve their pending visit and clean up only duplicates or completed
      const today = new Date();
      latestEventByChild.forEach((lastClinDate, childId) => {
        const childPending = pendingByChild.get(childId) || [];
        const clinDateParsed = parseLocalDate(lastClinDate);
        const daysSinceConsultation = differenceInDays(today, clinDateParsed);

        // Check if the latest attendance has already been visited by ACS
        const alreadyVisited = allVisits.some(v => {
          if (v.patient_id !== childId || v.status !== 'completed') return false;
          if (v.last_clinical_date === lastClinDate) return true;
          const diff = differenceInDays(parseLocalDate(v.date), clinDateParsed);
          return diff >= 1 && diff <= 13;
        });

        if (alreadyVisited) {
          // If already completed for this consultation, remove any lingering pending visits matching this consultation
          childPending
            .filter(v => v.last_clinical_date === lastClinDate)
            .forEach(v => staleVisitIds.push(v.id));
        } else {
          // Keep at most 1 pending visit per child (clean up duplicate pending visits)
          if (childPending.length > 1) {
            childPending.sort((a, b) => b.date.localeCompare(a.date));
            for (let i = 1; i < childPending.length; i++) {
              staleVisitIds.push(childPending[i].id);
            }
          } else if (childPending.length === 0 && daysSinceConsultation >= 0 && daysSinceConsultation <= 30) {
            // Auto-queue visit for recent consultations (within 30 days) that have no visit yet
            toInsert.push({
              patient_id: childId,
              acs_id: defaultAcsId,
              date: formatLocalDate(addDays(clinDateParsed, 7)),
              status: 'pending',
              checklist: { dynamic: {} },
              observations: '',
              last_clinical_date: lastClinDate
            });
          }
        }
      });

      // Execute deletes of duplicate/completed lingering visits
      if (staleVisitIds.length > 0) {
        await supabase.from('home_visits').delete().in('id', staleVisitIds);
      }

      // Execute inserts for missing visits
      if (toInsert.length > 0) {
        const { error } = await supabase.from('home_visits').insert(toInsert);
        if (error) {
          console.error('Error syncing missed visits:', error);
        }
      }

      if (staleVisitIds.length > 0 || toInsert.length > 0) {
        fetchVisits();
      }
    } catch (err) {
      console.error('Failed to sync completed atendimentos:', err);
    }
  };

  const fetchVisits = async () => {
    const { data } = await supabase.from('home_visits').select('*').order('date', { ascending: false });
    if (data) setVisits(data as HomeVisit[]);
  };

  const agendarVisita = async (patientId: string, clinicalDate: string): Promise<boolean> => {
    const exists = visits.find(v => v.patient_id === patientId && v.status === 'pending' && v.last_clinical_date === clinicalDate);
    if (exists) return true;

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
      return true;
    } else if (error) {
      console.error('Error scheduling visit:', error);
      setVisits(prev => prev.filter(v => v.id !== tempId));
      alert(`Erro ao salvar na fila de visitas: ${error.message}`);
      return false;
    }
    return true;
  };

  const concluirVisita = async (visitId: string, observations: string, checklist: any) => {
    const targetVisit = visits.find(v => v.id === visitId);
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

    // Clean up any other pending visits for the same patient and consultation cycle
    if (targetVisit?.patient_id) {
      const duplicates = visits.filter(v => 
        v.id !== visitId && 
        v.patient_id === targetVisit.patient_id && 
        v.status === 'pending' && 
        (
          (targetVisit.last_clinical_date && v.last_clinical_date === targetVisit.last_clinical_date) ||
          (targetVisit.last_clinical_date && Math.abs(differenceInDays(parseLocalDate(v.date), parseLocalDate(targetVisit.last_clinical_date))) <= 13)
        )
      );

      if (duplicates.length > 0) {
        for (const dup of duplicates) {
          await supabase.from('home_visits').delete().eq('id', dup.id);
        }
        setVisits(prev => prev.filter(v => !duplicates.some(d => d.id === v.id)));
      }
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
