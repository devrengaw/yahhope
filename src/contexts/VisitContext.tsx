import React, { createContext, useContext, useState, useEffect } from 'react';
import { HomeVisit } from '../lib/mockData';
import { formatLocalDate, parseLocalDate } from '../lib/utils';
import { addDays, differenceInDays } from 'date-fns';
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

      // Find the latest attendance wave date across the clinic
      const latestWaveDate = clinicalEvents[0].date;

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

      // 3. For each child that attended the latest wave:
      latestEventByChild.forEach((lastClinDate, childId) => {
        const childPending = pendingByChild.get(childId) || [];

        // If the child did not attend the latest attendance wave, any pending visit is from an obsolete past cycle
        if (lastClinDate !== latestWaveDate) {
          childPending.forEach(v => staleVisitIds.push(v.id));
          return;
        }

        // Check if the latest attendance has already been visited by ACS
        const alreadyVisited = allVisits.some(v => {
          if (v.patient_id !== childId || v.status !== 'completed') return false;
          if (v.last_clinical_date === lastClinDate) return true;
          const diff = differenceInDays(parseLocalDate(v.date), parseLocalDate(lastClinDate));
          return diff >= 1 && diff <= 13;
        });

        if (alreadyVisited) {
          // Already completed, so remove any lingering pending visits for this child
          childPending.forEach(v => staleVisitIds.push(v.id));
        } else {
          // Keep only 1 pending visit matching this latest consultation; delete any others/duplicates
          const matchingPending = childPending.filter(v => v.last_clinical_date === lastClinDate);
          const otherPending = childPending.filter(v => v.last_clinical_date !== lastClinDate);
          otherPending.forEach(v => staleVisitIds.push(v.id));

          if (matchingPending.length > 1) {
            for (let i = 1; i < matchingPending.length; i++) {
              staleVisitIds.push(matchingPending[i].id);
            }
          } else if (matchingPending.length === 0) {
            toInsert.push({
              patient_id: childId,
              acs_id: defaultAcsId,
              date: formatLocalDate(addDays(parseLocalDate(lastClinDate), 7)),
              status: 'pending',
              checklist: { dynamic: {} },
              observations: '',
              last_clinical_date: lastClinDate
            });
          }
        }
      });

      // Also clean up pending visits for children who have no clinical events at all
      pendingByChild.forEach((pVisits, childId) => {
        if (!latestEventByChild.has(childId)) {
          pVisits.forEach(v => staleVisitIds.push(v.id));
        }
      });

      // Execute deletes of stale/superseded visits
      if (staleVisitIds.length > 0) {
        await supabase.from('home_visits').delete().in('id', staleVisitIds);
      }

      // Execute inserts for missing visits of latest wave
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
