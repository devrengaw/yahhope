import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface CampaignMilestone {
  id: string;
  campaign_id?: string;
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
  type?: 'monthly' | 'specific';
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  reset_day?: number;
  last_reset_at?: string;
  milestones: CampaignMilestone[];
  accept_pix?: boolean;
  accept_card?: boolean;
  created_at?: string;
}

export interface Donation {
  id: string;
  campaign_id?: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  payment_method: 'pix' | 'credit_card' | string;
  date: string;
  paid_at?: string;
}

interface CampaignProgressStats {
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  isMonthly: boolean;
  currentMonthTotal: number;
  totalHistorical: number;
}

interface FundraisingContextType {
  campaign: Campaign;
  campaigns: Campaign[];
  selectedCampaign: Campaign;
  activeCampaign: Campaign | null;
  donations: Donation[];
  allDonations: Donation[];
  isLoading: boolean;
  currentMonthName: string;
  selectCampaign: (id: string) => void;
  createCampaign: (data: {
    title: string;
    description: string;
    target_amount: number;
    type?: 'monthly' | 'specific';
    accept_pix?: boolean;
    accept_card?: boolean;
    start_date?: string;
    end_date?: string;
  }) => Promise<{ success: boolean; data?: Campaign; error?: any }>;
  updateCampaign: (updates: Partial<Campaign>, campaignId?: string) => Promise<{ success: boolean; error?: any }>;
  deleteCampaign: (id: string) => Promise<{ success: boolean; error?: any }>;
  setActiveCampaign: (id: string) => Promise<{ success: boolean; error?: any }>;
  resetCampaignMonth: (id: string) => Promise<{ success: boolean; error?: any }>;
  addMilestone: (milestone: Omit<CampaignMilestone, 'id'>, targetCampaignId?: string) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<CampaignMilestone>) => Promise<void>;
  removeMilestone: (id: string) => Promise<void>;
  createDonation: (donation: Omit<Donation, 'id' | 'status' | 'date'> & { campaign_id?: string }) => Promise<void>;
  approveDonation: (id: string) => Promise<void>;
  calculateCampaignProgress: (camp: Campaign) => CampaignProgressStats;
}

const FundraisingContext = createContext<FundraisingContextType | undefined>(undefined);

const defaultCampaign: Campaign = {
  id: '1',
  title: 'Campanha de Nutrição Infantil',
  description: 'Ajude-nos a combater a desnutrição infantil e transformar vidas.',
  target_amount: 20000,
  current_amount: 0,
  type: 'monthly',
  is_active: true,
  milestones: []
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function FundraisingProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([defaultCampaign]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('1');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonthName = useMemo(() => {
    const now = new Date();
    return `${MONTH_NAMES[now.getMonth()]} de ${now.getFullYear()}`;
  }, []);

  // Calcula o progresso dinâmico de qualquer campanha considerando se é Mensal ou Específica
  const calculateCampaignProgress = useCallback((camp: Campaign): CampaignProgressStats => {
    const isMonthly = camp.type !== 'specific'; // Padrão é mensal
    const campDonations = donations.filter(d => 
      (d.campaign_id === camp.id || (!d.campaign_id && camp.is_active)) && d.status === 'paid'
    );

    const totalHistorical = campDonations.reduce((acc, d) => acc + Number(d.amount || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Se houve reset manual neste mês, considera a partir da data de reset
    let effectiveStart = startOfMonth;
    if (camp.last_reset_at) {
      const resetDate = new Date(camp.last_reset_at);
      if (resetDate > startOfMonth) {
        effectiveStart = resetDate;
      }
    }

    const monthDonations = campDonations.filter(d => {
      const donationDate = new Date(d.paid_at || d.date);
      return donationDate >= effectiveStart;
    });

    const currentMonthTotal = monthDonations.reduce((acc, d) => acc + Number(d.amount || 0), 0);

    // Se for mensal, o valor corrente é o total do mês atual. Se for específica, é o histórico total.
    const currentAmount = isMonthly ? currentMonthTotal : totalHistorical;
    const targetAmount = Math.max(camp.target_amount || 1, 1);
    const percentage = Math.min(Math.round((currentAmount / targetAmount) * 100), 100);

    return {
      currentAmount,
      targetAmount,
      percentage,
      isMonthly,
      currentMonthTotal,
      totalHistorical
    };
  }, [donations]);

  // Carrega todas as campanhas, milestones e doações do Supabase
  const fetchCampaignData = async () => {
    try {
      // 1. Buscar todas as campanhas
      const { data: campaignsData, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campErr) {
        console.error('Error fetching campaigns:', campErr);
      }

      // 2. Buscar todos os milestones
      const { data: milestonesData } = await supabase
        .from('campaign_milestones')
        .select('*')
        .order('target_amount', { ascending: true });

      // 3. Buscar todas as doações
      const { data: donationsData } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      const formattedDonations: Donation[] = (donationsData || []).map(d => ({
        id: d.id,
        campaign_id: d.campaign_id,
        donor_name: d.donor_name,
        donor_email: d.donor_email || '',
        amount: Number(d.amount || 0),
        status: d.status,
        payment_method: d.payment_method,
        date: d.created_at,
        paid_at: d.paid_at
      }));

      setDonations(formattedDonations);

      if (campaignsData && campaignsData.length > 0) {
        const mappedCampaigns: Campaign[] = campaignsData.map(c => {
          const campMilestones = (milestonesData || []).filter(m => m.campaign_id === c.id);
          
          return {
            id: c.id,
            title: c.title,
            description: c.description || '',
            target_amount: Number(c.target_amount || 0),
            current_amount: Number(c.current_amount || 0),
            type: c.type || 'monthly',
            is_active: c.is_active ?? false,
            start_date: c.start_date,
            end_date: c.end_date,
            reset_day: c.reset_day || 1,
            last_reset_at: c.last_reset_at,
            milestones: campMilestones,
            accept_pix: c.accept_pix ?? true,
            accept_card: c.accept_card ?? true,
            created_at: c.created_at
          };
        });

        setCampaigns(mappedCampaigns);

        // Se a campanha selecionada não existir mais, seleciona a ativa ou a primeira
        setSelectedCampaignId(prev => {
          const exists = mappedCampaigns.some(c => c.id === prev);
          if (exists) return prev;
          const active = mappedCampaigns.find(c => c.is_active);
          return active ? active.id : mappedCampaigns[0].id;
        });
      }
    } catch (e) {
      console.error('Fetch campaign failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();

    // Inscrição em tempo real para campanhas e doações
    const channels = supabase.channel('fundraising-realtime-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        fetchCampaignData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        fetchCampaignData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_milestones' }, () => {
        fetchCampaignData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  // Identifica a campanha ativa e a selecionada
  const activeCampaign = useMemo(() => {
    return campaigns.find(c => c.is_active) || campaigns[0] || defaultCampaign;
  }, [campaigns]);

  const selectedCampaign = useMemo(() => {
    const found = campaigns.find(c => c.id === selectedCampaignId);
    const base = found || activeCampaign || defaultCampaign;
    // Vincula o current_amount calculado
    const stats = calculateCampaignProgress(base);
    return {
      ...base,
      current_amount: stats.currentAmount
    };
  }, [campaigns, selectedCampaignId, activeCampaign, calculateCampaignProgress]);

  // Lista de doações da campanha selecionada
  const campaignDonations = useMemo(() => {
    return donations.filter(d => d.campaign_id === selectedCampaign.id || (!d.campaign_id && selectedCampaign.is_active));
  }, [donations, selectedCampaign.id, selectedCampaign.is_active]);

  const selectCampaign = (id: string) => {
    setSelectedCampaignId(id);
  };

  const createCampaign = async (data: {
    title: string;
    description: string;
    target_amount: number;
    type?: 'monthly' | 'specific';
    accept_pix?: boolean;
    accept_card?: boolean;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const payload: any = {
        title: data.title,
        description: data.description,
        target_amount: data.target_amount,
        current_amount: 0,
        is_active: campaigns.length === 0, // se for a primeira, fica ativa
        accept_pix: data.accept_pix ?? true,
        accept_card: data.accept_card ?? true
      };

      // Adiciona campos novos se suportados
      if (data.type) payload.type = data.type;
      if (data.start_date) payload.start_date = data.start_date;
      if (data.end_date) payload.end_date = data.end_date;

      const { data: newCamp, error } = await supabase
        .from('campaigns')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Fallback caso colunas novas ainda não estejam criadas no banco
        if (error.message && (error.message.includes('column') || error.code === '42703')) {
          delete payload.type;
          delete payload.start_date;
          delete payload.end_date;
          const retry = await supabase.from('campaigns').insert(payload).select().single();
          if (retry.data) {
            await fetchCampaignData();
            setSelectedCampaignId(retry.data.id);
            return { success: true, data: retry.data };
          }
          return { success: false, error: retry.error };
        }
        return { success: false, error };
      }

      if (newCamp) {
        await fetchCampaignData();
        setSelectedCampaignId(newCamp.id);
        return { success: true, data: newCamp };
      }

      return { success: false, error: new Error('Falha ao criar campanha') };
    } catch (err) {
      console.error('Error creating campaign:', err);
      return { success: false, error: err };
    }
  };

  const updateCampaign = async (updates: Partial<Campaign>, campaignId?: string) => {
    const targetId = campaignId || selectedCampaign.id;
    try {
      const payload: any = { ...updates };
      delete payload.milestones;
      delete payload.current_amount; // É calculado dinamicamente ou mantido pelo reset

      const { error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', targetId);

      if (!error) {
        setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, ...updates } : c));
        return { success: true };
      } else {
        // Fallback para caso coluna nova não exista
        if (error.message && (error.message.includes('column') || error.code === '42703')) {
          delete payload.type;
          delete payload.start_date;
          delete payload.end_date;
          delete payload.reset_day;
          delete payload.last_reset_at;
          const retry = await supabase.from('campaigns').update(payload).eq('id', targetId);
          if (!retry.error) {
            setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, ...updates } : c));
            return { success: true };
          }
        }
        console.error('Error updating campaign:', error);
        return { success: false, error };
      }
    } catch (err) {
      console.error('Error in updateCampaign:', err);
      return { success: false, error: err };
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (!error) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        if (selectedCampaignId === id) {
          const remaining = campaigns.filter(c => c.id !== id);
          if (remaining.length > 0) {
            setSelectedCampaignId(remaining[0].id);
          }
        }
        return { success: true };
      }
      return { success: false, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const setActiveCampaign = async (id: string) => {
    try {
      // 1. Desativa todas
      await supabase.from('campaigns').update({ is_active: false }).neq('id', id);
      // 2. Ativa a escolhida
      await supabase.from('campaigns').update({ is_active: true }).eq('id', id);

      setCampaigns(prev => prev.map(c => ({
        ...c,
        is_active: c.id === id
      })));
      setSelectedCampaignId(id);
      return { success: true };
    } catch (err) {
      console.error('Error setting active campaign:', err);
      return { success: false, error: err };
    }
  };

  // Zerar régua manualmente para a campanha no mês atual
  const resetCampaignMonth = async (id: string) => {
    try {
      const nowIso = new Date().toISOString();
      const payload: any = {
        last_reset_at: nowIso,
        current_amount: 0
      };

      const { error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', id);

      if (error && error.message && error.message.includes('column')) {
        // Fallback apenas zerando current_amount
        await supabase.from('campaigns').update({ current_amount: 0 }).eq('id', id);
      }

      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, last_reset_at: nowIso, current_amount: 0 } : c));
      await fetchCampaignData();
      return { success: true };
    } catch (err) {
      console.error('Error resetting campaign month:', err);
      return { success: false, error: err };
    }
  };

  const addMilestone = async (milestone: Omit<CampaignMilestone, 'id'>, targetCampaignId?: string) => {
    const cId = targetCampaignId || selectedCampaign.id;
    const { data, error } = await supabase
      .from('campaign_milestones')
      .insert({
        campaign_id: cId,
        title: milestone.title,
        target_amount: milestone.target_amount,
        description: milestone.description
      })
      .select()
      .single();

    if (data && !error) {
      setCampaigns(prev => prev.map(c => {
        if (c.id === cId) {
          const updated = [...(c.milestones || []), data].sort((a, b) => a.target_amount - b.target_amount);
          return { ...c, milestones: updated };
        }
        return c;
      }));
    }
  };

  const updateMilestone = async (id: string, updates: Partial<CampaignMilestone>) => {
    await supabase
      .from('campaign_milestones')
      .update({
        title: updates.title,
        target_amount: updates.target_amount,
        description: updates.description
      })
      .eq('id', id);

    setCampaigns(prev => prev.map(c => ({
      ...c,
      milestones: (c.milestones || [])
        .map(m => m.id === id ? { ...m, ...updates } : m)
        .sort((a, b) => a.target_amount - b.target_amount)
    })));
  };

  const removeMilestone = async (id: string) => {
    await supabase.from('campaign_milestones').delete().eq('id', id);
    setCampaigns(prev => prev.map(c => ({
      ...c,
      milestones: (c.milestones || []).filter(m => m.id !== id)
    })));
  };

  const createDonation = async (donation: Omit<Donation, 'id' | 'status' | 'date'> & { campaign_id?: string }) => {
    const cId = donation.campaign_id || selectedCampaign.id;
    const { data } = await supabase.from('donations').insert({
      campaign_id: cId,
      donor_name: donation.donor_name,
      donor_email: donation.donor_email,
      amount: donation.amount,
      status: 'pending',
      payment_method: donation.payment_method
    }).select().single();

    if (data) {
      const newDonation: Donation = {
        id: data.id,
        campaign_id: data.campaign_id,
        donor_name: data.donor_name,
        donor_email: data.donor_email || '',
        amount: Number(data.amount),
        status: data.status,
        payment_method: data.payment_method,
        date: data.created_at,
        paid_at: data.paid_at
      };
      setDonations(prev => [newDonation, ...prev]);
    }
  };

  const approveDonation = async (id: string) => {
    const nowIso = new Date().toISOString();
    const { data } = await supabase.from('donations').update({
      status: 'paid',
      paid_at: nowIso
    }).eq('id', id).select().single();

    if (data) {
      setDonations(prev => prev.map(d => d.id === id ? { ...d, status: 'paid', paid_at: nowIso } : d));

      // Atualiza também no campaigns para compatibilidade com queries externas
      const targetCamp = campaigns.find(c => c.id === data.campaign_id) || selectedCampaign;
      if (targetCamp) {
        await supabase.from('campaigns').update({
          current_amount: Number(targetCamp.current_amount || 0) + Number(data.amount)
        }).eq('id', targetCamp.id);
      }
    }
  };

  return (
    <FundraisingContext.Provider value={{
      campaign: selectedCampaign,
      campaigns,
      selectedCampaign,
      activeCampaign,
      donations: campaignDonations,
      allDonations: donations,
      isLoading,
      currentMonthName,
      selectCampaign,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      setActiveCampaign,
      resetCampaignMonth,
      addMilestone,
      updateMilestone,
      removeMilestone,
      createDonation,
      approveDonation,
      calculateCampaignProgress
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
