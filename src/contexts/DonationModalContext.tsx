import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface DonationModalOptions {
  title?: string;
  category?: string;
  imageUrl?: string;
  tagColor?: string;
  description?: string;
  link?: string;
}

interface DonationModalContextType {
  isOpen: boolean;
  options: DonationModalOptions | null;
  openDonationModal: (options?: DonationModalOptions) => void;
  closeDonationModal: () => void;
}

const DonationModalContext = createContext<DonationModalContextType | undefined>(undefined);

export function DonationModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DonationModalOptions | null>(null);
  const location = useLocation();

  // Fecha o modal automaticamente se o usuário navegar para outra página
  useEffect(() => {
    setIsOpen(false);
    setOptions(null);
  }, [location.pathname]);

  const openDonationModal = (opts?: DonationModalOptions) => {
    setOptions(opts || null);
    setIsOpen(true);
  };

  const closeDonationModal = () => {
    setIsOpen(false);
    setOptions(null);
  };

  return (
    <DonationModalContext.Provider value={{ isOpen, options, openDonationModal, closeDonationModal }}>
      {children}
    </DonationModalContext.Provider>
  );
}

export function useDonationModal() {
  const context = useContext(DonationModalContext);
  if (!context) {
    throw new Error('useDonationModal must be used within a DonationModalProvider');
  }
  return context;
}
