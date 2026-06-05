import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CampaignMilestone {
  id: string;
  title: string;
  target_amount: number;
  description: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  milestones: CampaignMilestone[];
}

export interface Donation {
  id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  payment_method: 'pix' | 'credit_card';
  date: string;
}

interface FundraisingContextType {
  campaign: Campaign;
  donations: Donation[];
  updateCampaign: (updates: Partial<Campaign>) => void;
  addMilestone: (milestone: Omit<CampaignMilestone, 'id'>) => void;
  updateMilestone: (id: string, updates: Partial<CampaignMilestone>) => void;
  removeMilestone: (id: string) => void;
  createDonation: (donation: Omit<Donation, 'id' | 'status' | 'date'>) => void;
  approveDonation: (id: string) => void;
}

const FundraisingContext = createContext<FundraisingContextType | undefined>(undefined);

const STORAGE_KEY_CAMPAIGN = 'yah_hope_campaign';
const STORAGE_KEY_DONATIONS = 'yah_hope_donations';

const defaultCampaign: Campaign = {
  id: '1',
  title: 'Campanha de Nutrição Infantil',
  description: 'Ajude-nos a combater a desnutrição infantil e transformar vidas.',
  target_amount: 20000,
  current_amount: 0,
  milestones: []
};

export function FundraisingProvider({ children }: { children: React.ReactNode }) {
  const [campaign, setCampaign] = useState<Campaign>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CAMPAIGN);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Remove placeholder milestones if they exist
        if (parsed.milestones) {
          parsed.milestones = parsed.milestones.filter(
            (m: any) => !['m1', 'm2', 'm3', 'm4'].includes(m.id)
          );
        }
        return parsed;
      } catch (e) {
        return defaultCampaign;
      }
    }
    return defaultCampaign;
  });

  const [donations, setDonations] = useState<Donation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DONATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CAMPAIGN, JSON.stringify(campaign));
  }, [campaign]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(donations));
    
    // Recalculate current amount based on paid donations
    const paidAmount = donations.filter(d => d.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    if (paidAmount !== campaign.current_amount) {
      setCampaign(prev => ({ ...prev, current_amount: paidAmount }));
    }
  }, [donations]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_CAMPAIGN && e.newValue) {
        setCampaign(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEY_DONATIONS && e.newValue) {
        setDonations(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateCampaign = (updates: Partial<Campaign>) => {
    setCampaign(prev => ({ ...prev, ...updates }));
  };

  const addMilestone = (milestone: Omit<CampaignMilestone, 'id'>) => {
    const newMilestone = { ...milestone, id: Math.random().toString(36).substring(2, 9) };
    setCampaign(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone].sort((a, b) => a.target_amount - b.target_amount)
    }));
  };

  const updateMilestone = (id: string, updates: Partial<CampaignMilestone>) => {
    setCampaign(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => m.id === id ? { ...m, ...updates } : m).sort((a, b) => a.target_amount - b.target_amount)
    }));
  };

  const removeMilestone = (id: string) => {
    setCampaign(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
    }));
  };

  const createDonation = (donation: Omit<Donation, 'id' | 'status' | 'date'>) => {
    const newDonation: Donation = {
      ...donation,
      id: Math.random().toString(36).substring(2, 9),
      status: 'pending',
      date: new Date().toISOString()
    };
    setDonations(prev => [newDonation, ...prev]);
  };

  const approveDonation = (id: string) => {
    setDonations(prev => prev.map(d => d.id === id ? { ...d, status: 'paid' } : d));
  };

  return (
    <FundraisingContext.Provider value={{
      campaign,
      donations,
      updateCampaign,
      addMilestone,
      updateMilestone,
      removeMilestone,
      createDonation,
      approveDonation
    }}>
      {children}
    </FundraisingContext.Provider>
  );
}

export function useFundraising() {
  const context = useContext(FundraisingContext);
  if (context === undefined) {
    throw new Error('useFundraising must be used within a FundraisingProvider');
  }
  return context;
}
