import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

const defaultCampaign: Campaign = {
  id: '1',
  title: 'Campanha de Nutrição Infantil',
  description: 'Ajude-nos a combater a desnutrição infantil e transformar vidas.',
  target_amount: 20000,
  current_amount: 0,
  milestones: []
};

export function FundraisingProvider({ children }: { children: React.ReactNode }) {
  const [campaign, setCampaign] = useState<Campaign>(defaultCampaign);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from Supabase
  const fetchCampaignData = async () => {
    try {
      // 1. Fetch active campaign
      const { data: campaignData, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (campErr && campErr.code !== 'PGRST116') {
        console.error('Error fetching campaign:', campErr);
      }

      if (campaignData) {
        // Fetch its milestones
        const { data: milestonesData } = await supabase
          .from('campaign_milestones')
          .select('*')
          .eq('campaign_id', campaignData.id)
          .order('target_amount', { ascending: true });

        setCampaign({
          id: campaignData.id,
          title: campaignData.title,
          description: campaignData.description || '',
          target_amount: campaignData.target_amount,
          current_amount: campaignData.current_amount || 0,
          milestones: milestonesData || []
        });

        // Fetch recent donations for this campaign
        const { data: donationsData } = await supabase
          .from('donations')
          .select('*')
          .eq('campaign_id', campaignData.id)
          .order('created_at', { ascending: false });

        if (donationsData) {
          const formattedDonations = donationsData.map(d => ({
            id: d.id,
            donor_name: d.donor_name,
            donor_email: d.donor_email || '',
            amount: d.amount,
            status: d.status,
            payment_method: d.payment_method,
            date: d.created_at
          }));
          setDonations(formattedDonations);
        }
      }
    } catch (e) {
      console.error('Fetch campaign failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();

    // Set up Realtime subscriptions for the 24/7 display page
    const channels = supabase.channel('fundraising-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, (payload) => {
        // Update campaign if current_amount or anything changed
        if (payload.new && (payload.new as any).is_active !== false) {
          setCampaign(prev => ({
            ...prev,
            current_amount: (payload.new as any).current_amount,
            target_amount: (payload.new as any).target_amount,
            title: (payload.new as any).title
          }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload) => {
        // Fetch new donations if anything changes in donations
        fetchCampaignData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  const updateCampaign = async (updates: Partial<Campaign>) => {
    if (campaign.id !== '1') {
      const { error } = await supabase
        .from('campaigns')
        .update({
          title: updates.title,
          description: updates.description,
          target_amount: updates.target_amount,
          current_amount: updates.current_amount
        })
        .eq('id', campaign.id);
        
      if (!error) {
        setCampaign(prev => ({ ...prev, ...updates }));
      }
    } else {
      setCampaign(prev => ({ ...prev, ...updates }));
    }
  };

  const addMilestone = async (milestone: Omit<CampaignMilestone, 'id'>) => {
    if (campaign.id !== '1') {
      const { data, error } = await supabase
        .from('campaign_milestones')
        .insert({
          campaign_id: campaign.id,
          title: milestone.title,
          target_amount: milestone.target_amount,
          description: milestone.description
        })
        .select()
        .single();
        
      if (data && !error) {
        setCampaign(prev => ({
          ...prev,
          milestones: [...prev.milestones, data].sort((a, b) => a.target_amount - b.target_amount)
        }));
      }
    } else {
      // fallback for empty DB
      const newM = { ...milestone, id: Math.random().toString() };
      setCampaign(prev => ({
        ...prev,
        milestones: [...prev.milestones, newM].sort((a, b) => a.target_amount - b.target_amount)
      }));
    }
  };

  const updateMilestone = async (id: string, updates: Partial<CampaignMilestone>) => {
    if (campaign.id !== '1') {
      await supabase
        .from('campaign_milestones')
        .update({
          title: updates.title,
          target_amount: updates.target_amount,
          description: updates.description
        })
        .eq('id', id);
        
      setCampaign(prev => ({
        ...prev,
        milestones: prev.milestones.map(m => m.id === id ? { ...m, ...updates } : m).sort((a, b) => a.target_amount - b.target_amount)
      }));
    }
  };

  const removeMilestone = async (id: string) => {
    if (campaign.id !== '1') {
      await supabase.from('campaign_milestones').delete().eq('id', id);
      setCampaign(prev => ({
        ...prev,
        milestones: prev.milestones.filter(m => m.id !== id)
      }));
    }
  };

  const createDonation = async (donation: Omit<Donation, 'id' | 'status' | 'date'>) => {
    if (campaign.id !== '1') {
      const { data } = await supabase.from('donations').insert({
        campaign_id: campaign.id,
        donor_name: donation.donor_name,
        donor_email: donation.donor_email,
        amount: donation.amount,
        status: 'pending',
        payment_method: donation.payment_method
      }).select().single();
      
      if (data) {
        const newDonation: Donation = {
          id: data.id,
          donor_name: data.donor_name,
          donor_email: data.donor_email || '',
          amount: data.amount,
          status: data.status,
          payment_method: data.payment_method,
          date: data.created_at
        };
        setDonations(prev => [newDonation, ...prev]);
      }
    }
  };

  const approveDonation = async (id: string) => {
    if (campaign.id !== '1') {
      // Mark as paid
      const { data } = await supabase.from('donations').update({
        status: 'paid',
        paid_at: new Date().toISOString()
      }).eq('id', id).select().single();
      
      if (data) {
        setDonations(prev => prev.map(d => d.id === id ? { ...d, status: 'paid' } : d));
        
        // Update campaign amount
        await supabase.from('campaigns').update({
          current_amount: campaign.current_amount + data.amount
        }).eq('id', campaign.id);
      }
    }
  };

  if (isLoading && false) { // Skip loading block visually for now
    return null;
  }

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
