import React, { createContext, useContext, useState } from 'react';

export type AtendimentoStatus = 'scheduled' | 'waiting' | 'in_progress' | 'completed';

export interface Atendimento {
  id: string;
  patient_id: string;
  patient_name: string;
  status: AtendimentoStatus;
}

interface AtendimentoContextType {
  atendimentos: Atendimento[];
  marcarPresenca: (id: string) => void;
  iniciarAtendimento: (id: string) => void;
  concluirAtendimento: (id: string) => void;
}

const AtendimentoContext = createContext<AtendimentoContextType | undefined>(undefined);

const mockAtendimentos: Atendimento[] = [
  { id: '1', patient_id: '1', patient_name: 'João Silva', status: 'completed' },
  { id: '2', patient_id: '2', patient_name: 'Ana Costa', status: 'waiting' },
  { id: '3', patient_id: '3', patient_name: 'Pedro Santos', status: 'scheduled' },
  { id: '4', patient_id: '4', patient_name: 'Maria Oliveira', status: 'scheduled' },
  { id: '5', patient_id: '5', patient_name: 'Lucas Mendes', status: 'scheduled' },
];

export function AtendimentoProvider({ children }: { children: React.ReactNode }) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(mockAtendimentos);

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
    <AtendimentoContext.Provider value={{ atendimentos, marcarPresenca, iniciarAtendimento, concluirAtendimento }}>
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
