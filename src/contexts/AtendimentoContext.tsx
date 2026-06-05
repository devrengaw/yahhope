import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatLocalDate } from '../lib/utils';

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

const STORAGE_KEY = 'yah_hope_atendimentos';

export function AtendimentoProvider({ children }: { children: React.ReactNode }) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atendimentos));
  }, [atendimentos]);
  
  const adicionarNaFila = (patientId: string, patientName: string) => {
    const today = formatLocalDate(new Date());
    // Check if patient already in queue for today (not completed)
    const exists = atendimentos.find(a => a.patient_id === patientId && a.date === today && a.status !== 'completed');
    if (exists) return;

    const newAtendimento: Atendimento = {
      id: Math.random().toString(36).substring(2, 9),
      patient_id: patientId,
      patient_name: patientName,
      status: 'waiting',
      date: today
    };

    setAtendimentos(prev => [...prev, newAtendimento]);
  };

  const agendarAtendimento = (patientId: string, patientName: string, date: string) => {
    // Check if patient already scheduled for that date
    const exists = atendimentos.find(a => a.patient_id === patientId && a.date === date);
    if (exists) return;

    const newAtendimento: Atendimento = {
      id: Math.random().toString(36).substring(2, 9),
      patient_id: patientId,
      patient_name: patientName,
      status: 'scheduled',
      date: date
    };

    setAtendimentos(prev => [...prev, newAtendimento]);
  };

  const marcarPresenca = (id: string) => {
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'waiting' } : a));
  };

  const iniciarAtendimento = (id: string) => {
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'in_progress' } : a));
  };

  const concluirAtendimento = (id: string) => {
    setAtendimentos(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
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
