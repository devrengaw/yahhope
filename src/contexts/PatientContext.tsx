import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, ClinicalEvent, mockPatients, mockEvents } from '../lib/mockData';

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

const STORAGE_KEY_PATIENTS = 'yah_hope_patients';
const STORAGE_KEY_EVENTS = 'yah_hope_events';

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PATIENTS);
    return saved ? JSON.parse(saved) : mockPatients;
  });

  const [events, setEvents] = useState<ClinicalEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
    return saved ? JSON.parse(saved) : mockEvents;
  });

  // Persist patients
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
  }, [patients]);

  // Persist events
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  }, [events]);

  const addPatient = (patient: Patient) => {
    setPatients(prev => [patient, ...prev]);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addEvent = (event: ClinicalEvent) => {
    setEvents(prev => [event, ...prev]);
  };

  const updateEvent = (id: string, updates: Partial<ClinicalEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    setEvents(prev => prev.filter(e => e.patient_id !== id));
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
