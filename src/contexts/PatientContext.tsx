import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, ClinicalEvent } from '../lib/mockData';
import { supabase } from '../lib/supabase';

interface PatientContextType {
  patients: Patient[];
  events: ClinicalEvent[];
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addEvent: (event: ClinicalEvent) => void;
  updateEvent: (id: string, updates: Partial<ClinicalEvent>) => void;
  deletePatient: (id: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [events, setEvents] = useState<ClinicalEvent[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: childrenData } = await supabase.from('children').select(`
        *,
        caregivers (name)
      `);
      
      const { data: eventsData } = await supabase.from('clinical_events').select('*');

      if (childrenData) {
        const formattedPatients: Patient[] = childrenData.map(c => {
          const guardian = c.caregivers && c.caregivers.length > 0 ? c.caregivers[0].name : 'Não informado';
          
          // Get latest nutritional status from events
          let status = 'Adequado';
          if (eventsData) {
            const childEvents = eventsData.filter(e => e.child_id === c.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (childEvents.length > 0 && childEvents[0].nutritional_status) {
              status = childEvents[0].nutritional_status;
            }
          }

          return {
            id: c.id,
            registration_number: c.registration_number || '',
            name: c.name,
            dob: c.dob,
            gender: c.gender as any,
            status: status as any,
            community: c.address || '',
            created_at: c.created_at,
            guardian_name: guardian,
            housing_type: '',
            sanitation: ''
          };
        });
        setPatients(formattedPatients);
      }

      if (eventsData) {
        const formattedEvents: ClinicalEvent[] = eventsData.map(e => ({
          id: e.id,
          patient_id: e.child_id,
          event_type: e.event_type as any,
          date: e.date,
          notes: e.notes || '',
          weight: e.weight,
          height: e.height,
          muac: e.muac,
          head_circumference: e.head_circumference,
          bmi: e.bmi,
          z_score_weight_height: e.z_score_weight_height,
          nutritional_status: e.nutritional_status,
          prescriptions: e.prescriptions || [],
          professional: e.professional_id || 'Profissional',
          return_date: e.return_date,
          kit_delivered: [],
          hospital_referral: false,
          is_discharge: false
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Error fetching patients', err);
    }
  };

  const addPatient = async (patient: Omit<Patient, 'id'> | Patient) => {
    // Generate an optimistic ID if none provided
    const tempId = (patient as Patient).id || Math.random().toString();
    
    // Optistic update
    const optimisticPatient: Patient = { ...patient, id: tempId } as Patient;
    setPatients(prev => [optimisticPatient, ...prev]);

    try {
      const { data: newChild } = await supabase.from('children').insert({
        registration_number: patient.registration_number,
        name: patient.name,
        dob: patient.dob,
        gender: patient.gender,
        address: patient.community,
        color: ''
      }).select().single();

      if (newChild) {
        if (patient.guardian_name) {
          await supabase.from('caregivers').insert({
            child_id: newChild.id,
            name: patient.guardian_name
          });
        }
        
        // Update state with real DB ID
        setPatients(prev => prev.map(p => p.id === tempId ? { ...p, id: newChild.id } : p));
      }
    } catch (e) {
      console.error('Add patient error', e);
      fetchData(); // rollback
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    
    if (id.length > 10) { // Valid UUID rough check
      await supabase.from('children').update({
        registration_number: updates.registration_number,
        name: updates.name,
        dob: updates.dob,
        gender: updates.gender,
        address: updates.community
      }).eq('id', id);
    }
  };

  const addEvent = async (event: ClinicalEvent) => {
    const tempId = event.id || Math.random().toString();
    setEvents(prev => [{ ...event, id: tempId }, ...prev]);

    if (event.patient_id.length > 10) {
      const { data: newEvent } = await supabase.from('clinical_events').insert({
        child_id: event.patient_id,
        event_type: event.event_type,
        date: event.date,
        notes: event.notes,
        weight: event.weight,
        height: event.height,
        muac: event.muac,
        head_circumference: event.head_circumference,
        bmi: event.bmi,
        z_score_weight_height: event.z_score_weight_height,
        nutritional_status: event.nutritional_status,
        prescriptions: event.prescriptions || null,
        return_date: event.return_date || null
      }).select().single();

      if (newEvent) {
        setEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: newEvent.id } : e));
      }
    }
  };

  const updateEvent = async (id: string, updates: Partial<ClinicalEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (id.length > 10) {
      await supabase.from('clinical_events').update({
        notes: updates.notes,
        weight: updates.weight,
        height: updates.height,
        nutritional_status: updates.nutritional_status
      }).eq('id', id);
    }
  };

  const deletePatient = async (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    setEvents(prev => prev.filter(e => e.patient_id !== id));
    if (id.length > 10) {
      await supabase.from('children').delete().eq('id', id);
    }
  };

  return (
    <PatientContext.Provider value={{ 
      patients, 
      events, 
      addPatient, 
      updatePatient, 
      addEvent, 
      updateEvent,
      deletePatient 
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
