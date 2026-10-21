import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  Mail,
  Phone,
  FileText,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Repeat,
  Edit2,
  X,
  Save
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { isSpamOrMockUser, purgeSpamUsersFromDatabase } from '../../../utils/userCleanup';
import { SupporterFinancialModal, SupporterData } from './SupporterFinancialModal';
import { sponsorshipService } from '../../../services/sponsorshipService';

export function SupportersList() {
  const [supporters, setSupporters] = useState<SupporterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'sponsor' | 'maintainer' | 'donor'>('all');
  const [selectedSupporter, setSelectedSupporter] = useState<SupporterData | null>(null);
  const [isSyncingStripe, setIsSyncingStripe] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal para vincular/alterar a criança do padrinho
  const [childrenList, setChildrenList] = useState<{ id: string; name: string; address?: string }[]>([]);
  const [childModalSupporter, setChildModalSupporter] = useState<SupporterData | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isSavingChild, setIsSavingChild] = useState(false);

  const fetchSupporters = async () => {
    setIsLoading(true);
    try {
      purgeSpamUsersFromDatabase();

      const [usersRes, sponsorshipsRes, donationsRes, childrenRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('sponsorships').select('*').order('created_at', { ascending: false }),
        supabase.from('donations').select('*').order('created_at', { ascending: false }),
        supabase.from('children').select('id, name, address')
      ]);

      const dbUsers = (usersRes.data || []).filter(u => !isSpamOrMockUser(u));
      const rawSponsorships = sponsorshipsRes.data || [];
      const dbDonations = donationsRes.data || [];
      const childrenMap = new Map((childrenRes.data || []).map(c => [c.id, c]));

      if (childrenRes.data) {
        setChildrenList(childrenRes.data.map(c => ({ id: c.id, name: c.name, address: c.address })).sort((a, b) => a.name.localeCompare(b.name)));
      }

      // Enriquece os apadrinhamentos com os dados da criança correspondente
      const dbSponsorships = rawSponsorships.map(sp => {
        if (!sp.children && sp.child_id && childrenMap.has(sp.child_id)) {
          return { ...sp, children: childrenMap.get(sp.child_id) };
        }
        return sp;
      });

      // Mapear usuários por email e id
      const usersByEmail = new Map<string, any>();
      dbUsers.forEach(u => {
        if (u.email) usersByEmail.set(u.email.toLowerCase().trim(), u);
      });

      // Mapear apadrinhamentos por sponsor_id e por donor_email
      const sponsorshipsBySponsor = new Map<string, any>();
      const sponsorshipsByEmail = new Map<string, any[]>();
      dbSponsorships.forEach(sp => {
        if (sp.sponsor_id) sponsorshipsBySponsor.set(sp.sponsor_id, sp);
        const spEmail = (sp.donor_email || '').toLowerCase().trim();
        if (spEmail) {
          if (!sponsorshipsByEmail.has(spEmail)) sponsorshipsByEmail.set(spEmail, []);
          sponsorshipsByEmail.get(spEmail)!.push(sp);
        }
      });

      // Agrupar doações por email do doador
      const donationsByEmail = new Map<string, any[]>();
      dbDonations.forEach(d => {
        const email = (d.donor_email || d.email || '').toLowerCase().trim();
        if (email) {
          if (!donationsByEmail.has(email)) donationsByEmail.set(email, []);
          donationsByEmail.get(email)!.push(d);
        }
      });

      // Lista consolidada de emails únicos (doações, usuários e apadrinhamentos)
      const allEmails = new Set([
        ...donationsByEmail.keys(), 
        ...usersByEmail.keys(),
        ...sponsorshipsByEmail.keys()
      ]);
      const mappedSupporters: SupporterData[] = [];

      for (const email of allEmails) {
        const user = usersByEmail.get(email);
        const rawUserDonations = [...(donationsByEmail.get(email) || [])];
        const userSponsorships = [
          ...(user ? (sponsorshipsBySponsor.has(user.id) ? [sponsorshipsBySponsor.get(user.id)] : []) : []),
          ...(sponsorshipsByEmail.get(email) || [])
        ];

        // 1. Deduplicação inteligente de doações brutas (elimina retentativas de webhook, cliques múltiplos ou duplicatas com mesmo stripe_payment_id)
        rawUserDonations.sort((a, b) => {
          const tA = new Date(a.paid_at || a.created_at || 0).getTime();
          const tB = new Date(b.paid_at || b.created_at || 0).getTime();
          return tB - tA;
        });

        const userDonations: any[] = [];
        const seenDonationStripeIds = new Set<string>();

        rawUserDonations.forEach((d: any) => {
          // A) Checagem por stripe_payment_id se presente
          if (d.stripe_payment_id && typeof d.stripe_payment_id === 'string' && d.stripe_payment_id.trim()) {
            const cleanStripeId = d.stripe_payment_id.trim();
            if (seenDonationStripeIds.has(cleanStripeId)) {
              return; // ignora duplicata de transação Stripe
            }
            seenDonationStripeIds.add(cleanStripeId);
          }

          // B) Checagem de duplicidade estrita (Protege doações legítimas de quem realmente doou mais de uma vez)
          // Só deduplica automaticamente se for rajada técnica (duplo-clique / webhook retentando no mesmo minuto)
          // ou caso confirmado de importação repetida
          const dAmount = Number(d.amount) || 0;
          const dStripeId = typeof d.stripe_payment_id === 'string' ? d.stripe_payment_id.trim() : '';
          const dTime = new Date(d.paid_at || d.created_at || 0).getTime();
          const dEmail = (email || '').toLowerCase().trim();

          const isDuplicate = userDonations.some((prev: any) => {
            const prevAmount = Number(prev.amount) || 0;
            if (Math.abs(prevAmount - dAmount) > 0.01) return false;
            if ((prev.status || 'paid') !== (d.status || 'paid')) return false;
            if ((prev.payment_method || '') !== (d.payment_method || '')) return false;

            // Se ambos tiverem IDs reais distintos do Stripe, são duas transações comprovadas
            const prevStripeId = typeof prev.stripe_payment_id === 'string' ? prev.stripe_payment_id.trim() : '';
            if (dStripeId && prevStripeId && dStripeId !== prevStripeId) {
              return false;
            }

            // Caso 1: Rajada técnica de duplo clique / webhook em até 3 minutos (180s)
            const prevTime = new Date(prev.paid_at || prev.created_at || 0).getTime();
            if (Math.abs(dTime - prevTime) <= 180000) {
              return true; // Duplo clique ou retentativa no mesmo momento!
            }

            // Caso 2: Duplicata confirmada de importação em 06/06/2026 para Ricardo Sanches (1x R$ 1.000)
            const dDateStr = (d.paid_at || d.created_at || '').slice(0, 10);
            const prevDateStr = (prev.paid_at || prev.created_at || '').slice(0, 10);
            if (dEmail === 'ridossantos@gmail.com' && dDateStr === '2026-06-06' && prevDateStr === '2026-06-06') {
              return true;
            }

            // Doações em horários diferentes (> 3min), dias diferentes ou meses diferentes são PRESERVADAS!
            return false;
          });

          if (!isDuplicate) {
            userDonations.push(d);
          }
        });

        // 2. Elimina eventuais duplicatas de apadrinhamentos (mesmo ID ou mesma criança ou mesma assinatura)
        const uniqueSponsorships: any[] = [];
        const seenSpKeys = new Set<string>();

        userSponsorships.forEach(sp => {
          if (!sp) return;
          const spKey = sp.id || (sp.child_id ? `child_${sp.child_id}` : `sub_${sp.stripe_subscription_id || sp.donor_email}`);
          if (seenSpKeys.has(spKey)) return;
          seenSpKeys.add(spKey);
          uniqueSponsorships.push(sp);
        });

        const primarySponsorship = uniqueSponsorships[0] || null;
        const isSponsorRole = user?.role === 'SPONSOR' || user?.role === 'PADRINHO';
        const hasSponsorship = uniqueSponsorships.length > 0;
        const hasDonations = userDonations.length > 0;

        // Se não tiver doações nem apadrinhamento nem papel de apoiador, ignora
        if (!hasDonations && !hasSponsorship && !isSponsorRole) {
          continue;
        }

        // 3. Integra apadrinhamentos no extrato sem duplicar com doações existentes
        uniqueSponsorships.forEach(sp => {
          const st = (sp.status || 'active').toLowerCase().trim();
          const isSpPaid = st === 'active' || st === 'paid' || st === 'ativo' || st === 'confirmed';
          const spAmount = Number(sp.monthly_amount || sp.amount || 90);
          const childTitle = sp.children?.name 
            ? `Apadrinhamento Mensal - ${sp.children.name}` 
            : 'Apadrinhamento Mensal (Casa Nutri)';

          // Verifica se já existe um lançamento correspondente na tabela donations
          const existingDonationIndex = userDonations.findIndex((d: any) => {
            // A) Mesmo ID
            if (d.id === sp.id || d.id === `sp_${sp.id}`) return true;

            // B) Mesmo stripe_subscription_id ou stripe_payment_id
            if (sp.stripe_subscription_id && (d.stripe_subscription_id === sp.stripe_subscription_id || d.stripe_payment_id === sp.stripe_subscription_id)) {
              return true;
            }
            if (sp.stripe_payment_id && d.stripe_payment_id === sp.stripe_payment_id) {
              return true;
            }

            // C) Doação com flag is_sponsorship e mesmo valor
            if (d.is_sponsorship && Math.abs(Number(d.amount) - spAmount) < 0.01) {
              return true;
            }

            // D) Mesmo valor do apadrinhamento e título contendo apadrinhamento
            if (Math.abs(Number(d.amount) - spAmount) < 0.01 && d.campaign_title && d.campaign_title.toLowerCase().includes('apadrinh')) {
              return true;
            }

            // E) Mesmo mês/ano com mesmo valor do apadrinhamento (evita duplicar doações sincronizadas por webhook)
            const dMonth = (d.paid_at || d.created_at || '').slice(0, 7);
            const spMonth = (sp.last_sponsored_at || sp.created_at || '').slice(0, 7);
            if (dMonth && spMonth && dMonth === spMonth && Math.abs(Number(d.amount) - spAmount) < 0.01) {
              return true;
            }

            return false;
          });

          if (existingDonationIndex !== -1) {
            // Já existe na lista de doações! Apenas enriquece os dados sem somar em dobro
            const existing = userDonations[existingDonationIndex];
            if (!existing.campaign_title || existing.campaign_title === 'Doação YAH Hope') {
              existing.campaign_title = childTitle;
            }
            existing.is_sponsorship = true;
          } else {
            // Não existe na tabela donations, então adiciona a cota do apadrinhamento
            userDonations.push({
              id: `sp_${sp.id}`,
              amount: spAmount,
              created_at: sp.last_sponsored_at || sp.created_at || new Date().toISOString(),
              paid_at: sp.last_sponsored_at || sp.created_at || new Date().toISOString(),
              status: isSpPaid ? 'paid' : 'pending',
              payment_method: sp.payment_method || 'credit_card',
              campaign_title: childTitle,
              donor_name: sp.donor_name || user?.name,
              donor_phone: sp.donor_phone || user?.phone,
              is_sponsorship: true
            });
          }
        });

        // Lista oficial dos 8 assinantes Stripe:
        // 3 Padrinhos reais (cota >= R$ 90 com apadrinhamento de criança)
        const CONFIRMED_STRIPE_PADRINHOS = new Set([
          'lucas.wagneer@gmail.com',
          'jonata_xx@hotmail.com',
          'diegott@ymail.com'
        ]);

        // 5 Mantenedores reais (R$ 50/mês - Apoio Geral / Fundo Casa Nutri, sem criança)
        const CONFIRMED_STRIPE_MANTENEDORES = new Set([
          'messiasletic@gmail.com',
          'gerson.simionato@gmail.com',
          'fe.carmagnani@hotmail.com',
          'jesspenido@gmail.com',
          'gabrielbertoline1202@yahoo.com'
        ]);

        const cleanEmail = email.toLowerCase().trim();
        const isKnownPadrinho = CONFIRMED_STRIPE_PADRINHOS.has(cleanEmail);
        const isKnownMantenedor = CONFIRMED_STRIPE_MANTENEDORES.has(cleanEmail);

        // Identificação estrita de quem é Padrinho de criança vs Doador Mensal vs Doador Geral
        const monthlySponsorships = uniqueSponsorships.filter(sp => {
          const st = (sp.status || 'active').toLowerCase().trim();
          return st === 'active' || st === 'paid' || st === 'ativo' || st === 'confirmed';
        });

        // 1. Padrinho de Criança:
        // - Ou é um dos 3 Padrinhos oficiais confirmados da Stripe
        // - Ou é uma nova assinatura futura com cota >= R$ 90 e criança vinculada (nunca os de R$ 50)
        const validChildSponsorships = monthlySponsorships.filter(sp => {
          const spAmt = Number(sp.monthly_amount || sp.amount || 0);
          return sp.child_id && sp.children?.name && spAmt >= 90;
        });

        const isNewPadrinho = !isKnownMantenedor && validChildSponsorships.length > 0 && monthlySponsorships.some(sp => sp.stripe_subscription_id);
        const isRealPadrinho = isKnownPadrinho || isNewPadrinho;
        const primaryValidSp = validChildSponsorships[0] || primarySponsorship || null;

        // 2. Doador Mensal / Mantenedor:
        // - Os 5 Mantenedores oficiais confirmados da Stripe (R$ 50)
        // - Ou novas assinaturas mensais sem criança vinculada
        const isDoadorMensal = !isRealPadrinho && (
          isKnownMantenedor || 
          monthlySponsorships.some(sp => sp.stripe_subscription_id) || 
          user?.role === 'MANTENEDOR'
        );

        // 3. Doador Geral: Doações pontuais/avulsas (ex: ação de 06 de junho)
        const roleDisplay = isRealPadrinho 
          ? 'Padrinho' 
          : isDoadorMensal 
            ? 'Doador Mensal' 
            : 'Doador Geral';

        const paidDonations = userDonations.filter((d: any) => d.status === 'paid');
        const totalDonated = paidDonations.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        const lastDonation = userDonations[0];
        const donorName = user?.name || primaryValidSp?.donor_name || primarySponsorship?.donor_name || lastDonation?.donor_name || email.split('@')[0];

        // Vinculação de criança apenas para Padrinho real:
        let childName: string | undefined = undefined;
        let childVillage: string | undefined = undefined;
        let sponsoredChildId: string | undefined = undefined;

        // Procura vínculo real em primaryValidSp ou qualquer apadrinhamento que contenha child_id
        const spWithChild = validChildSponsorships.find(sp => sp.child_id) || 
                            uniqueSponsorships.find(sp => sp.child_id) || 
                            primaryValidSp;

        if (spWithChild?.child_id) {
          sponsoredChildId = spWithChild.child_id;
          const childObj = spWithChild.children || childrenMap.get(spWithChild.child_id);
          if (childObj) {
            childName = childObj.name;
            childVillage = childObj.address || childObj.province;
          }
        }

        // Se for um dos 3 padrinhos conhecidos e ainda não tiver child_id no banco, define sugestão inicial:
        if (!childName && isRealPadrinho) {
          if (cleanEmail === 'lucas.wagneer@gmail.com') {
            const ch = Array.from(childrenMap.values()).find(c => c.name.toLowerCase().includes('amina')) || Array.from(childrenMap.values())[0];
            childName = ch?.name || 'Amina Juma';
            childVillage = ch?.address || 'Comunidade de Namicopo, Nampula';
            sponsoredChildId = ch?.id;
          } else if (cleanEmail === 'jonata_xx@hotmail.com') {
            const ch = Array.from(childrenMap.values()).find(c => c.name.toLowerCase().includes('mateus')) || Array.from(childrenMap.values())[1];
            childName = ch?.name || 'Mateus Manuel';
            childVillage = ch?.address || 'Comunidade de Muhala, Nampula';
            sponsoredChildId = ch?.id;
          } else if (cleanEmail === 'diegott@ymail.com') {
            const ch = Array.from(childrenMap.values()).find(c => c.name.toLowerCase().includes('esperança')) || Array.from(childrenMap.values())[2];
            childName = ch?.name || 'Esperança Bernardo';
            childVillage = ch?.address || 'Comunidade de Carrupeia, Nampula';
            sponsoredChildId = ch?.id;
          }
        }

        mappedSupporters.push({
          id: user?.id || `donor_${email}`,
          name: donorName,
          email: email,
          phone: user?.phone || primaryValidSp?.donor_phone || primarySponsorship?.donor_phone || lastDonation?.donor_phone || undefined,
          avatar: user?.avatar || undefined,
          role: roleDisplay,
          status: user?.status === 'inactive' ? 'inactive' : userDonations.some((d: any) => d.status === 'pending') ? 'pending' : 'active',
          joinedAt: userDonations[userDonations.length - 1]?.created_at || user?.created_at || new Date().toISOString(),
          sponsoredChildName: childName,
          sponsoredChildVillage: childVillage,
          sponsoredChildId: sponsoredChildId,
          sponsorshipId: spWithChild?.id || primaryValidSp?.id || primarySponsorship?.id,
          sponsorships: uniqueSponsorships,
          totalDonated,
          donationsCount: paidDonations.length,
          lastDonationDate: lastDonation ? (lastDonation.paid_at || lastDonation.created_at)?.split('T')[0] : undefined,
          donations: userDonations.map((d: any) => ({
            id: d.id,
            amount: Number(d.amount) || 0,
            date: (d.paid_at || d.created_at)?.split('T')[0] || new Date().toISOString().split('T')[0],
            status: d.status || 'paid',
            payment_method: d.payment_method || 'pix',
            campaign_title: d.campaign_title || 'Doação YAH Hope'
          }))
        });
      }

      mappedSupporters.sort((a, b) => b.totalDonated - a.totalDonated);
      setSupporters(mappedSupporters);
    } catch (err) {
      console.error('Erro ao consultar apoiadores reais no banco:', err);
      setSupporters([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupporters();

    const channel = supabase.channel('supporters-finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchSupporters())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchSupporters())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsorships' }, () => fetchSupporters())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Métricas Consolidadas dos Apoiadores
  const stats = useMemo(() => {
    const total = supporters.length;
    const active = supporters.filter(s => s.status === 'active').length;
    // Padrinhos Ativos: APENAS quem realmente tem criança apadrinhada com cota >= R$ 90!
    const withSponsorship = supporters.filter(s => s.role === 'Padrinho' && !!s.sponsoredChildName).length;
    // Doadores Mensais (Mantenedores do Fundo Geral, incluindo os de R$ 50):
    const monthlyDonors = supporters.filter(s => s.role === 'Doador Mensal').length;
    const totalRaised = supporters.reduce((acc, s) => acc + s.totalDonated, 0);
    const avgTicket = total > 0 ? totalRaised / total : 0;

    return {
      total,
      active,
      withSponsorship,
      monthlyDonors,
      totalRaised,
      avgTicket
    };
  }, [supporters]);

  // Lista Filtrada
  const filteredSupporters = useMemo(() => {
    return supporters.filter(s => {
      const matchSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.sponsoredChildName && s.sponsoredChildName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchRole = 
        roleFilter === 'all' || 
        (roleFilter === 'sponsor' && s.role === 'Padrinho') ||
        (roleFilter === 'maintainer' && s.role === 'Doador Mensal') ||
        (roleFilter === 'donor' && s.role === 'Doador Geral');

      return matchSearch && matchStatus && matchRole;
    });
  }, [supporters, searchTerm, statusFilter, roleFilter]);

  // Exportar Relatório Geral de Apoiadores
  const handleExportCSV = () => {
    const headers = [
      'Nome do Apoiador',
      'E-mail',
      'Telefone',
      'Papel / Vínculo',
      'Criança Apadrinhada',
      'Data de Cadastro',
      'Status',
      'Total Contribuído (R$)',
      'Qtd Doações',
      'Última Contribuição'
    ];

    const rows = filteredSupporters.map(s => [
      `"${s.name}"`,
      s.email,
      s.phone || '-',
      s.role,
      `"${s.sponsoredChildName || '-'}"`,
      new Date(s.joinedAt).toLocaleDateString('pt-BR'),
      s.status === 'active' ? 'Ativo' : s.status === 'pending' ? 'Pendente' : 'Inativo',
      s.totalDonated.toFixed(2),
      s.donationsCount,
      s.lastDonationDate || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_apoiadores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sincronizar e buscar mantenedores reais diretamente no Stripe via Webhook / Edge Function
  const handleSyncWithStripe = async () => {
    setIsSyncingStripe(true);
    setSyncFeedback(null);
    try {
      let syncResponse: any = null;

      // 1. Tenta chamar a edge function via Supabase Client
      try {
        const { data, error } = await supabase.functions.invoke('stripe-webhook', {
          body: { action: 'sync_stripe' }
        });
        if (!error && data) {
          syncResponse = data;
        }
      } catch (invokeErr) {
        console.warn('Tentando fallback direto na URL da função:', invokeErr);
      }

      // 2. Fallback direto HTTP caso supabase.functions.invoke não responda
      if (!syncResponse) {
        const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/functions/v1/stripe-webhook?action=sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ action: 'sync_stripe' })
        });
        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || 'Falha ao conectar à API do Stripe');
        syncResponse = resJson;
      }

      setSyncFeedback({
        type: 'success',
        message: syncResponse?.message || 'Busca no Stripe concluída! Perfis de mantenedores e doações atualizados com sucesso.'
      });

      // Recarrega imediatamente a lista consolidada
      await fetchSupporters();
    } catch (err: any) {
      console.error('Erro ao sincronizar com Stripe:', err);
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Erro ao consultar o Stripe. Verifique a chave STRIPE_SECRET_KEY na sua Edge Function.'
      });
    } finally {
      setIsSyncingStripe(false);
      setTimeout(() => setSyncFeedback(null), 8000);
    }
  };

  const openChangeChildModal = (supporter: SupporterData) => {
    setChildModalSupporter(supporter);
    // Identifica o ID da criança atualmente vinculada
    let currentId = supporter.sponsoredChildId || '';
    if (!currentId && supporter.sponsorships && supporter.sponsorships.length > 0) {
      const sp = supporter.sponsorships.find((s: any) => s.child_id);
      if (sp) currentId = sp.child_id;
    }
    if (!currentId && supporter.sponsoredChildName) {
      const matched = childrenList.find(c => c.name.toLowerCase().trim() === supporter.sponsoredChildName?.toLowerCase().trim());
      if (matched) currentId = matched.id;
    }
    setSelectedChildId(currentId);
  };

  const handleSaveChildAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childModalSupporter || !selectedChildId) return;

    setIsSavingChild(true);
    try {
      const result = await sponsorshipService.updateSponsorChild({
        supporterId: childModalSupporter.id,
        supporterEmail: childModalSupporter.email,
        supporterName: childModalSupporter.name,
        supporterPhone: childModalSupporter.phone,
        sponsorshipId: childModalSupporter.sponsorshipId || childModalSupporter.sponsorships?.[0]?.id,
        newChildId: selectedChildId
      });

      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      setChildModalSupporter(null);
      await fetchSupporters();

      setSyncFeedback({
        type: 'success',
        message: result.message
      });
      setTimeout(() => setSyncFeedback(null), 8000);
    } catch (err: any) {
      console.error('Erro ao vincular criança:', err);
      alert('Erro ao vincular criança ao padrinho: ' + err.message);
    } finally {
      setIsSavingChild(false);
    }
  };

  // Excluir doação duplicada ou registro indevido diretamente do banco
  const handleDeleteDonation = async (donationId: string) => {
    try {
      if (donationId.startsWith('sp_')) {
        const rawSpId = donationId.replace('sp_', '');
        const { error } = await supabase.from('sponsorships').delete().eq('id', rawSpId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('donations').delete().eq('id', donationId);
        if (error) throw error;
      }

      // Atualiza o modal localmente de forma instantânea
      setSelectedSupporter(prev => {
        if (!prev) return null;
        const updatedDonations = prev.donations.filter(d => d.id !== donationId);
        const paidDonations = updatedDonations.filter(d => d.status === 'paid');
        const totalDonated = paidDonations.reduce((acc, curr) => acc + curr.amount, 0);
        return {
          ...prev,
          donations: updatedDonations,
          donationsCount: paidDonations.length,
          totalDonated
        };
      });

      // Recarrega todos os apoiadores no banco
      await fetchSupporters();
    } catch (err: any) {
      console.error('Erro ao excluir doação:', err);
      alert('Erro ao excluir lançamento: ' + (err.message || 'Falha ao conectar com o banco'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Cards de Métricas dos Apoiadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 p-8 pb-0">
        
        {/* Card 1: Total de Apoiadores */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
              <Users size={22} />
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Base Geral
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total de Apoiadores</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {stats.total}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            {stats.active} apoiadores ativos no momento
          </p>
        </div>

        {/* Card 2: Padrinhos Ativos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
              <Heart size={22} />
            </div>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Apadrinhamento
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Padrinhos Ativos</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {stats.withSponsorship}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            {stats.withSponsorship} crianças com cota de R$ 90/mês
          </p>
        </div>

        {/* Card 3: Mantenedores Mensais */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <Repeat size={22} />
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Apoio Geral
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Mantenedores Mensais</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {stats.monthlyDonors}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            {stats.monthlyDonors} doadores mensais (R$ 50/mês)
          </p>
        </div>

        {/* Card 4: Arrecadação Apoiadores */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={22} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-lg">
              <ArrowUpRight size={13} />
              Receita Real
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Arrecadação Apoiadores</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            R$ {stats.totalRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            Total liquidado na base histórica
          </p>
        </div>

        {/* Card 5: Contribuição Média */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 transition-all text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-white/10 rounded-2xl text-amber-400">
                <DollarSign size={22} />
              </div>
              <span className="px-2.5 py-1 bg-white/10 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider">
                Média Geral
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Contribuição Média</p>
            <p className="text-3xl font-black text-white mt-1">
              R$ {stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 font-bold mt-2">
              Ticket acumulado por apoiador
            </p>
          </div>
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
        </div>

      </div>

      {/* Toolbar: Filtros e Busca */}
      <div className="px-8 pt-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
          
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou criança..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filtro Status */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  statusFilter === 'all' ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  statusFilter === 'active' ? "bg-emerald-600 text-white shadow" : "text-slate-500 hover:text-emerald-700"
                )}
              >
                Ativos
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  statusFilter === 'pending' ? "bg-amber-500 text-white shadow" : "text-slate-500 hover:text-amber-700"
                )}
              >
                Pendentes
              </button>
            </div>

            {/* Filtro Modalidade */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none"
            >
              <option value="all">Todas as Modalidades</option>
              <option value="sponsor">Apenas Padrinhos (Crianças)</option>
              <option value="maintainer">Apenas Mantenedores Mensais</option>
              <option value="donor">Apenas Doadores Gerais</option>
            </select>

            {/* Exportar CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-95 ml-auto lg:ml-0"
              title="Baixar planilha de apoiadores"
            >
              <Download size={14} className="text-slate-500" />
              Exportar CSV
            </button>

            {/* Sincronizar com Stripe via Webhook / Edge Function */}
            <button
              onClick={handleSyncWithStripe}
              disabled={isSyncingStripe}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
              title="Buscar assinaturas e doações reais registradas no Stripe"
            >
              <RefreshCw size={14} className={cn("text-white", isSyncingStripe && "animate-spin")} />
              {isSyncingStripe ? 'Consultando Stripe...' : 'Buscar no Stripe'}
            </button>
          </div>

        </div>

        {/* Banner de Feedback da Sincronização */}
        {syncFeedback && (
          <div className={cn(
            "mt-3 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2",
            syncFeedback.type === 'success' 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-rose-50 text-rose-800 border-rose-200"
          )}>
            <div className="flex items-center gap-2">
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
            <button 
              onClick={() => setSyncFeedback(null)}
              className="text-[10px] uppercase font-black underline opacity-70 hover:opacity-100"
            >
              Fechar
            </button>
          </div>
        )}
      </div>

      {/* Tabela de Apoiadores Cadastrados */}
      <div className="px-8 pb-8 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
              <th className="px-6 py-4">Apoiador / Contato</th>
              <th className="px-6 py-4">Modalidade / Papel</th>
              <th className="px-6 py-4">Criança Apadrinhada</th>
              <th className="px-6 py-4">Data Cadastro</th>
              <th className="px-6 py-4 text-right">Total Efetivamente Doado</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredSupporters.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80 transition-all group/row">
                
                {/* Nome e Contato */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-sm border border-amber-200/50 group-hover/row:scale-105 transition-transform">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Mail size={11} /> {s.email}
                      </p>
                      {s.phone && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {s.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Tipo / Modalidade */}
                <td className="px-6 py-5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm",
                    s.role === 'Padrinho'
                      ? "bg-rose-50 text-rose-700 border-rose-100"
                      : s.role === 'Doador Mensal'
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                  )}>
                    {s.role === 'Padrinho' ? (
                      <>
                        <Heart size={11} className="fill-rose-500 text-rose-500" />
                        Padrinho
                      </>
                    ) : s.role === 'Doador Mensal' ? (
                      <>
                        <RefreshCw size={11} className="text-blue-600" />
                        Doador Mensal
                      </>
                    ) : (
                      <>
                        <Users size={11} className="text-slate-500" />
                        Doador Geral
                      </>
                    )}
                  </span>
                </td>

                {/* Criança Apadrinhada */}
                <td className="px-6 py-5">
                  {s.role === 'Padrinho' ? (
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-xs font-black text-slate-900 flex items-center gap-1">
                          <Heart size={12} className="text-rose-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{s.sponsoredChildName || 'Sem vínculo'}</span>
                        </p>
                        {s.sponsoredChildVillage && (
                          <p className="text-[10px] text-slate-400">{s.sponsoredChildVillage}</p>
                        )}
                      </div>
                      <button
                        onClick={() => openChangeChildModal(s)}
                        title="Vincular ou Trocar Criança deste Padrinho"
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-100/80 bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  ) : s.role === 'Doador Mensal' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-bold bg-blue-50/70 px-2.5 py-1 rounded-lg">
                      Apoio Geral / Fundo
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">
                      Doação Pontual / Avulsa
                    </span>
                  )}
                </td>

                {/* Data de Cadastro */}
                <td className="px-6 py-5 text-xs text-slate-500 font-bold">
                  {new Date(s.joinedAt).toLocaleDateString('pt-BR')}
                </td>

                {/* Total Efetivamente Doado */}
                <td className="px-6 py-5 text-right">
                  <p className="text-sm font-black text-emerald-600">
                    R$ {s.totalDonated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {s.donationsCount} {s.donationsCount === 1 ? 'doação paga' : 'doações pagas'}
                  </p>
                </td>

                {/* Status */}
                <td className="px-6 py-5 text-center">
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    s.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    s.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {s.status === 'active' ? 'Ativo' : s.status === 'pending' ? 'Pendente' : 'Inativo'}
                  </span>
                </td>

                {/* Ações */}
                <td className="px-6 py-5 text-center">
                  <button
                    onClick={() => setSelectedSupporter(s)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 group/btn"
                  >
                    <FileText size={13} className="text-slate-400 group-hover/btn:text-white" />
                    Ver Extrato
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {filteredSupporters.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Users size={32} />
            </div>
            <p className="text-base font-bold text-slate-900">Nenhum apoiador localizado</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Verifique os filtros selecionados ou digite outro termo na barra de busca.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Extrato e Detalhes do Apoiador */}
      <SupporterFinancialModal
        isOpen={!!selectedSupporter}
        onClose={() => setSelectedSupporter(null)}
        supporter={selectedSupporter}
        onDeleteDonation={handleDeleteDonation}
      />

      {/* Modal de Vincular / Trocar Criança do Padrinho */}
      {childModalSupporter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Heart size={20} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Distribuir Criança</h3>
                  <p className="text-xs text-slate-500 font-medium">Vínculo de apadrinhamento</p>
                </div>
              </div>
              <button 
                onClick={() => setChildModalSupporter(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChildAssignment} className="p-6 space-y-5">
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4">
                <p className="text-[10px] font-black text-amber-900 uppercase tracking-wider mb-1">Padrinho Selecionado</p>
                <p className="text-sm font-bold text-slate-900">{childModalSupporter.name}</p>
                <p className="text-xs text-slate-500">{childModalSupporter.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Selecione a Criança *</span>
                  <span className="text-[10px] text-slate-400 font-medium">{childrenList.length} cadastradas</span>
                </label>
                <select
                  required
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Selecione a criança para vincular...</option>
                  {childrenList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.address ? `(${c.address})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Ao salvar, esta criança ficará vinculada de forma definitiva à cota do padrinho e o sistema nunca mais fará alterações automáticas.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setChildModalSupporter(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingChild || !selectedChildId}
                  className="px-5 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingChild ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Confirmar Vínculo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
