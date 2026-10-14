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
  priority?: number;
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
  toggleCampaignActive: (id: string, active?: boolean) => Promise<{ success: boolean; error?: any }>;
  reorderCampaigns: (orderedIds: string[]) => Promise<{ success: boolean; error?: any }>;
  updateCampaignPriority: (id: string, newPriority: number) => Promise<{ success: boolean; error?: any }>;
  resetCampaignMonth: (id: string) => Promise<{ success: boolean; error?: any }>;
  addMilestone: (milestone: Omit<CampaignMilestone, 'id'>, targetCampaignId?: string) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<CampaignMilestone>) => Promise<void>;
  removeMilestone: (id: string) => Promise<void>;
  createDonation: (donation: Omit<Donation, 'id' | 'status' | 'date'> & { campaign_id?: string }) => Promise<void>;
  approveDonation: (id: string) => Promise<void>;
  deleteDonation: (id: string) => Promise<{ success: boolean; error?: any }>;
  clearTestDonationsAndResetRuler: () => Promise<{ success: boolean; error?: any }>;
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

  // Calcula o progresso dinâmico de qualquer campanha considerando suas doações reais e cotas de apadrinhamento
  const calculateCampaignProgress = useCallback((camp: Campaign): CampaignProgressStats => {
    const isMonthly = camp.type !== 'specific'; // Padrão é mensal

    // Identifica de forma precisa qual é o primeiro estágio ativo na régua (Fase 1)
    const firstActiveCamp = campaigns.find(c => c && c.is_active !== false) || campaigns[0];
    const isFirstActive = camp.id === firstActiveCamp?.id;

    // Filtra doações confirmadas pertencentes a esta campanha
    const campDonations = donations.filter(d => {
      if (d.status !== 'paid') return false;
      if (d.campaign_id) {
        return d.campaign_id === camp.id;
      }
      // Doações gerais e apadrinhamentos sem campanha explícita entram na primeira fase ativa (Casa Nutri)
      return isFirstActive;
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Filtra doações ocorridas no mês e ano atuais
    const monthDonations = campDonations.filter(d => {
      const rawDate = d.date || d.paid_at;
      if (!rawDate) return true;

      const match = rawDate.match(/^(\d{4})-(\d{2})/);
      if (match) {
        const dYear = parseInt(match[1], 10);
        const dMonth = parseInt(match[2], 10) - 1;
        return dYear === currentYear && dMonth === currentMonth;
      }

      const dObj = new Date(rawDate);
      if (isNaN(dObj.getTime())) return true;
      return dObj.getFullYear() === currentYear && dObj.getMonth() === currentMonth;
    });

    const currentMonthTotal = monthDonations.reduce((acc, d) => acc + Number(d.amount || 0), 0);
    const totalHistorical = campDonations.reduce((acc, d) => acc + Number(d.amount || 0), 0);

    // REGRA DE OURO DE PRECISÃO:
    // A soma das doações reais confirmadas (doação avulsa + apadrinhamentos) é a fonte primária da verdade.
    // Se houver doações cadastradas no mês ou histórico, o valor real é calculado a partir delas (ex: 50 + 90 = 140).
    const realDonationsTotal = currentMonthTotal > 0 ? currentMonthTotal : totalHistorical;
    const currentAmount = realDonationsTotal > 0 ? realDonationsTotal : Number(camp.current_amount || 0);

    const targetAmount = Math.max(camp.target_amount || 1, 1);
    const percentage = Math.min(Math.round((currentAmount / targetAmount) * 100), 100);

    return {
      currentAmount,
      targetAmount,
      percentage,
      isMonthly,
      currentMonthTotal: currentAmount,
      totalHistorical: totalHistorical > 0 ? totalHistorical : currentAmount
    };
  }, [donations, campaigns]);

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

      // 4. Buscar apadrinhamentos ativos (cotas de apadrinhamento financiam a nutrição e operação da Casa Nutri)
      const { data: sponsorshipsData } = await supabase
        .from('sponsorships')
        .select('*');

      const formattedDonations: Donation[] = (donationsData || []).map(d => {
        const rawStatus = (d.status || 'paid').toLowerCase().trim();
        const isPaid = rawStatus === 'paid' || rawStatus === 'completed' || rawStatus === 'confirmed' || rawStatus === 'pago';
        return {
          id: d.id,
          campaign_id: d.campaign_id,
          donor_name: d.donor_name || 'Doador YAH Hope',
          donor_email: d.donor_email || '',
          amount: Number(d.amount || 0),
          status: isPaid ? 'paid' : 'pending',
          payment_method: d.payment_method || 'pix',
          date: d.created_at || new Date().toISOString(),
          paid_at: d.paid_at || d.created_at || new Date().toISOString()
        };
      });

      // Adiciona as cotas de apadrinhamento ativas na arrecadação contínua da Casa Nutri
      if (sponsorshipsData && sponsorshipsData.length > 0) {
        sponsorshipsData.forEach(sp => {
          const st = (sp.status || 'active').toLowerCase().trim();
          const isActive = st === 'active' || st === 'paid' || st === 'ativo' || st === 'confirmed' || st === 'active_recurring';
          if (!isActive) return;

          const spAmount = Number(sp.monthly_amount || sp.amount || 90);
          formattedDonations.push({
            id: `sp_${sp.id}`,
            campaign_id: undefined, // Destinado à fase ativa da Casa Nutri
            donor_name: sp.donor_name || 'Padrinho YAH Hope',
            donor_email: sp.donor_email || '',
            amount: spAmount,
            status: 'paid',
            payment_method: sp.payment_method || 'credit_card',
            date: sp.last_sponsored_at || sp.created_at || new Date().toISOString(),
            paid_at: sp.last_sponsored_at || sp.created_at || new Date().toISOString()
          });
        });
      }

      setDonations(formattedDonations);

      if (campaignsData && campaignsData.length > 0) {
        const mappedCampaigns: Campaign[] = campaignsData.map((c, index) => {
          const campMilestones = (milestonesData || []).filter(m => m.campaign_id === c.id);
          
          // Verifica se há preferência salva no localStorage
          let localPix: boolean | undefined = undefined;
          let localCard: boolean | undefined = undefined;
          try {
            const raw = localStorage.getItem(`yahhope_campaign_settings_${c.id}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.accept_pix !== undefined) localPix = parsed.accept_pix;
              if (parsed.accept_card !== undefined) localCard = parsed.accept_card;
            }
          } catch {}

          // Prioridade: se o banco retornou true/false (não nulo), usa o banco.
          // Mas se no banco vier null/undefined OU se localStorage tiver uma preferência explicitamente salva e o banco vier nulo, usa localStorage.
          // Além disso, se localPix foi explicitamente salvo, ele serve de fallback e garantia.
          const effectivePix = (localPix !== undefined)
            ? localPix
            : (c.accept_pix !== undefined && c.accept_pix !== null ? c.accept_pix : true);

          const effectiveCard = (localCard !== undefined)
            ? localCard
            : (c.accept_card !== undefined && c.accept_card !== null ? c.accept_card : true);

          return {
            id: c.id,
            title: c.title,
            description: c.description || '',
            target_amount: Number(c.target_amount || 0),
            current_amount: Number(c.current_amount || 0),
            type: c.type || 'monthly',
            is_active: c.is_active !== false,
            priority: typeof c.priority === 'number' ? c.priority : (index + 1),
            start_date: c.start_date,
            end_date: c.end_date,
            reset_day: c.reset_day || 1,
            last_reset_at: c.last_reset_at,
            milestones: campMilestones,
            accept_pix: effectivePix,
            accept_card: effectiveCard,
            created_at: c.created_at
          };
        });

        // Ordena campanhas pela ordem de prioridade crescente
        mappedCampaigns.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsorships' }, () => {
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
        is_active: true, // Por padrão, novas campanhas já nascem ativas
        priority: campaigns.length + 1,
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
          delete payload.accept_pix;
          delete payload.accept_card;
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
      // 1. Sempre salva no localStorage para persistência garantida mesmo se a coluna no banco não existir
      try {
        const raw = localStorage.getItem(`yahhope_campaign_settings_${targetId}`);
        const existing = raw ? JSON.parse(raw) : {};
        if (updates.accept_pix !== undefined) existing.accept_pix = updates.accept_pix;
        if (updates.accept_card !== undefined) existing.accept_card = updates.accept_card;
        localStorage.setItem(`yahhope_campaign_settings_${targetId}`, JSON.stringify(existing));
      } catch (err) {
        console.warn('Erro ao salvar no localStorage:', err);
      }

      // 2. Atualiza o estado da memória imediatamente para refletir na interface
      setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, ...updates } : c));

      // Se for id default "1" (mock/sem banco), já retorna sucesso
      if (targetId === '1') {
        return { success: true };
      }

      // 3. Prepara o payload para o Supabase
      const payload: any = { ...updates };
      delete payload.milestones;
      delete payload.current_amount; // É calculado dinamicamente ou mantido pelo reset

      const { error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', targetId);

      if (!error) {
        return { success: true };
      } else {
        // Fallback para caso coluna nova não exista no Postgres (código 42703 ou mensagem "column")
        if (error.message && (error.message.includes('column') || error.code === '42703')) {
          delete payload.accept_pix;
          delete payload.accept_card;
          delete payload.type;
          delete payload.start_date;
          delete payload.end_date;
          delete payload.reset_day;
          delete payload.last_reset_at;

          const retry = await supabase.from('campaigns').update(payload).eq('id', targetId);
          if (!retry.error) {
            return { success: true };
          }
        }
        console.error('Error updating campaign in Supabase:', error);
        return { success: false, error };
      }
    } catch (err: any) {
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
      // Ativa a escolhida sem desativar as outras
      await supabase.from('campaigns').update({ is_active: true }).eq('id', id);

      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: true } : c));
      setSelectedCampaignId(id);
      return { success: true };
    } catch (err) {
      console.error('Error setting active campaign:', err);
      return { success: false, error: err };
    }
  };

  const toggleCampaignActive = async (id: string, active?: boolean) => {
    try {
      const camp = campaigns.find(c => c.id === id);
      const newActive = active !== undefined ? active : !(camp?.is_active ?? true);
      
      const { error } = await supabase.from('campaigns').update({ is_active: newActive }).eq('id', id);
      if (error && error.message && error.message.includes('column')) {
        // Ignora se coluna não existir no banco
      }
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: newActive } : c));
      return { success: true };
    } catch (err) {
      console.error('Error toggling campaign active:', err);
      return { success: false, error: err };
    }
  };

  const updateCampaignPriority = async (id: string, newPriority: number) => {
    try {
      await supabase.from('campaigns').update({ priority: newPriority }).eq('id', id);
      setCampaigns(prev => {
        const next = prev.map(c => c.id === id ? { ...c, priority: newPriority } : c);
        return next.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating campaign priority:', err);
      return { success: false, error: err };
    }
  };

  const reorderCampaigns = async (orderedIds: string[]) => {
    try {
      setCampaigns(prev => {
        const updated = [...prev];
        orderedIds.forEach((id, index) => {
          const camp = updated.find(c => c.id === id);
          if (camp) camp.priority = index + 1;
        });
        return updated.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      });

      for (let i = 0; i < orderedIds.length; i++) {
        supabase.from('campaigns').update({ priority: i + 1 }).eq('id', orderedIds[i]).then(() => {}).catch(() => {});
      }
      return { success: true };
    } catch (err) {
      console.error('Error reordering campaigns:', err);
      return { success: false, error: err };
    }
  };

  // Zerar régua manualmente para a campanha no mês atual
  const resetCampaignMonth = async (id: string) => {
    try {
      const camp = campaigns.find(c => c.id === id);
      if (camp && camp.type === 'specific') {
        return { 
          success: false, 
          error: { message: 'Campanhas específicas são acumulativas e não podem ser zeradas mensalmente.' } 
        };
      }

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
    const cId = donation.campaign_id || null;
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

  const deleteDonation = async (id: string) => {
    try {
      const donationToDelete = donations.find(d => d.id === id);

      // Se for apadrinhamento sincronizado (id prefixado com sp_)
      if (id.startsWith('sp_')) {
        const rawSpId = id.replace('sp_', '');
        const { error: spErr } = await supabase.from('sponsorships').delete().eq('id', rawSpId);
        if (spErr) {
          console.warn('Aviso ao deletar apadrinhamento:', spErr);
        }
      } else {
        const { error } = await supabase.from('donations').delete().eq('id', id);
        if (error) {
          console.warn('Aviso ao deletar doação no Supabase:', error);
        }
      }

      // Se a doação estava confirmada (status = paid), decrementa da campanha correspondente
      if (donationToDelete && donationToDelete.status === 'paid') {
        const targetCamp = donationToDelete.campaign_id
          ? campaigns.find(c => c.id === donationToDelete.campaign_id)
          : (activeCampaign || campaigns[0]);

        if (targetCamp) {
          const newAmount = Math.max(0, Number(targetCamp.current_amount || 0) - Number(donationToDelete.amount || 0));
          await supabase.from('campaigns').update({
            current_amount: newAmount
          }).eq('id', targetCamp.id);
        }
      }

      setDonations(prev => prev.filter(d => d.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao deletar doação:', err);
      return { success: false, error: err.message };
    }
  };

  // Limpa doações de teste e zera a arrecadação da régua para R$ 0,00
  const clearTestDonationsAndResetRuler = async () => {
    try {
      const nowIso = new Date().toISOString();

      // 1. Zera todas as campanhas no Supabase
      const { error: campErr } = await supabase
        .from('campaigns')
        .update({
          current_amount: 0,
          last_reset_at: nowIso
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (campErr) {
        console.warn('Tentativa com last_reset_at falhou, tentando apenas current_amount:', campErr);
        await supabase.from('campaigns').update({ current_amount: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // 2. Deleta as doações de teste da tabela donations
      const { error: donErr } = await supabase
        .from('donations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (donErr) {
        console.warn('Aviso ao limpar donations:', donErr);
      }

      // 3. Atualiza estado em memória imediatamente
      setDonations([]);
      setCampaigns(prev => prev.map(c => ({
        ...c,
        current_amount: 0,
        last_reset_at: nowIso
      })));

      await fetchCampaignData();
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao limpar doações de teste:', err);
      return { success: false, error: err };
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
      toggleCampaignActive,
      updateCampaignPriority,
      reorderCampaigns,
      resetCampaignMonth,
      addMilestone,
      updateMilestone,
      removeMilestone,
      createDonation,
      approveDonation,
      deleteDonation,
      clearTestDonationsAndResetRuler,
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
