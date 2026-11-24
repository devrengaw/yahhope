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
  Save,
  Copy,
  Check,
  MessageCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import {
  isSpamOrMockUser,
  purgeSpamUsersFromDatabase,
  isEmailPrefixOrHandle,
  isSameDonorNameAndHandle
} from '../../../utils/userCleanup';
import { SupporterFinancialModal, SupporterData } from './SupporterFinancialModal';
import { evaluateSponsorshipValidity, sponsorshipService, MAX_INACTIVE_DAYS_BEFORE_CHURN } from '../../../services/sponsorshipService';

export function SupportersList() {
  const [supporters, setSupporters] = useState<SupporterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'sponsor' | 'maintainer' | 'donor' | 'churned'>('all');
  const [selectedSupporter, setSelectedSupporter] = useState<SupporterData | null>(null);
  const [isSyncingStripe, setIsSyncingStripe] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal para vincular/alterar a criança do padrinho
  const [childrenList, setChildrenList] = useState<{ id: string; name: string; address?: string }[]>([]);
  const [childModalSupporter, setChildModalSupporter] = useState<SupporterData | null>(null);
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
  const [copyingInviteFor, setCopyingInviteFor] = useState<string | null>(null);
  const [copiedInviteFor, setCopiedInviteFor] = useState<string | null>(null);
  const [openingWhatsAppFor, setOpeningWhatsAppFor] = useState<string | null>(null);
  const [unsubscribedEmails, setUnsubscribedEmails] = useState<Set<string>>(new Set());
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [isDistributingChildren, setIsDistributingChildren] = useState(false);

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
      const childrenMap = new Map<string, any>((childrenRes.data || []).map(c => [c.id, c]));

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

      // Carrega e-mails que cancelaram recebimento para exibir tag de ajuste
      const { data: unsubData } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('status', 'unsubscribed');
      setUnsubscribedEmails(new Set(
        (unsubData || []).map((u: any) => (u.email || '').toLowerCase().trim()).filter(Boolean)
      ));

      // Mapear usuários por email e id
      const usersByEmail = new Map<string, any>();
      dbUsers.forEach(u => {
        if (u.email) usersByEmail.set(u.email.toLowerCase().trim(), u);
      });

      // Mapear apadrinhamentos por sponsor_id (array para suportar múltiplas cotas) e por donor_email
      const sponsorshipsBySponsor = new Map<string, any[]>();
      const sponsorshipsByEmail = new Map<string, any[]>();
      dbSponsorships.forEach(sp => {
        if (sp.sponsor_id) {
          if (!sponsorshipsBySponsor.has(sp.sponsor_id)) sponsorshipsBySponsor.set(sp.sponsor_id, []);
          sponsorshipsBySponsor.get(sp.sponsor_id)!.push(sp);
        }
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
          ...(user ? (sponsorshipsBySponsor.get(user.id) || []) : []),
          ...(sponsorshipsByEmail.get(email) || [])
        ];

        // 1. Deduplicação inteligente de doações brutas (elimina retentativas de webhook, cliques múltiplos ou duplicatas com mesmo stripe_payment_id / pi_ vs ch_)
        rawUserDonations.sort((a, b) => {
          const aIsHandle = isEmailPrefixOrHandle(a.donor_name) ? 1 : 0;
          const bIsHandle = isEmailPrefixOrHandle(b.donor_name) ? 1 : 0;
          if (aIsHandle !== bIsHandle) return aIsHandle - bIsHandle;
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
          // ou caso confirmado de sync duplicado (pi_ vs ch_ ou nome completo vs prefixo de e-mail no mesmo dia)
          const dAmount = Number(d.amount) || 0;
          const dStripeId = typeof d.stripe_payment_id === 'string' ? d.stripe_payment_id.trim() : '';
          const dTime = new Date(d.paid_at || d.created_at || 0).getTime();
          const dEmail = (email || '').toLowerCase().trim();
          const dDateStr = (d.paid_at || d.created_at || '').slice(0, 10);

          const isDuplicate = userDonations.some((prev: any) => {
            const prevAmount = Number(prev.amount) || 0;
            if (Math.abs(prevAmount - dAmount) > 0.01) return false;
            if ((prev.status || 'paid') !== (d.status || 'paid')) return false;

            const prevDateStr = (prev.paid_at || prev.created_at || '').slice(0, 10);
            const prevStripeId = typeof prev.stripe_payment_id === 'string' ? prev.stripe_payment_id.trim() : '';

            // Mesmo dia e mesmo valor para o mesmo doador onde um veio com Nome Completo (pi_) e outro com prefixo de e-mail (ch_)
            if (dDateStr && prevDateStr && dDateStr === prevDateStr) {
              if (isSameDonorNameAndHandle(prev.donor_name, d.donor_name)) {
                return true;
              }
              const oneIsPiOtherIsCh =
                (dStripeId.startsWith('pi_') && prevStripeId.startsWith('ch_')) ||
                (dStripeId.startsWith('ch_') && prevStripeId.startsWith('pi_'));
              if (oneIsPiOtherIsCh) {
                return true;
              }
            }

            if ((prev.payment_method || '') !== (d.payment_method || '')) return false;

            // Se ambos tiverem IDs reais distintos do Stripe (ex: duas cobranças pi_ diferentes), são duas transações comprovadas
            if (dStripeId && prevStripeId && dStripeId !== prevStripeId) {
              return false;
            }

            // Caso 1: Rajada técnica de duplo clique / webhook em até 3 minutos (180s)
            const prevTime = new Date(prev.paid_at || prev.created_at || 0).getTime();
            if (Math.abs(dTime - prevTime) <= 180000) {
              return true; // Duplo clique ou retentativa no mesmo momento!
            }

            // Caso 2: Duplicata confirmada de importação em 06/06/2026 para Ricardo Sanches (1x R$ 1.000)
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

        userDonations.sort((a: any, b: any) => {
          const tA = new Date(a.paid_at || a.created_at || 0).getTime();
          const tB = new Date(b.paid_at || b.created_at || 0).getTime();
          return tB - tA;
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
          // REGRA DE OURO: Cada cota de criança tem valor mínimo de R$ 90,00 (nunca R$ 30)
          const rawAmt = Number(sp.monthly_amount || sp.amount);
          const spAmount = (sp.child_id || isSponsorRole)
            ? Math.max(90, (!isNaN(rawAmt) && rawAmt > 0) ? rawAmt : 90)
            : ((!isNaN(rawAmt) && rawAmt > 0) ? rawAmt : 90);
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
            // ou pacote PIX (crianças * meses * 90) no mesmo mês
            const dMonth = (d.paid_at || d.created_at || '').slice(0, 7);
            const spMonth = (sp.last_sponsored_at || sp.created_at || '').slice(0, 7);
            if (dMonth && spMonth && dMonth === spMonth) {
              if (Math.abs(Number(d.amount) - spAmount) < 0.01) {
                return true;
              }
              const isPixSp = String(sp.payment_method || '').toLowerCase().includes('pix') || Number(sp.plan_months || 0) > 1;
              const isPixDon = String(d.payment_method || '').toLowerCase().includes('pix');
              if (isPixSp && isPixDon && Number(d.amount) >= spAmount) {
                return true;
              }
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

        const paidDonations = userDonations.filter((d: any) => d.status === 'paid');
        const latestPaidDonationIso = paidDonations.reduce<string | undefined>((latest, d) => {
          const dt = d.paid_at || d.created_at;
          if (!dt) return latest;
          if (!latest || new Date(dt).getTime() > new Date(latest).getTime()) return dt;
          return latest;
        }, undefined);

        // Verifica se há doação paga recente (<= 60 dias)
        const hasRecentPaidDonation = Boolean(
          latestPaidDonationIso &&
          Math.floor((Date.now() - new Date(latestPaidDonationIso).getTime()) / (1000 * 60 * 60 * 24)) <= MAX_INACTIVE_DAYS_BEFORE_CHURN
        );

        // Identificação estrita de quem é Padrinho de criança vs Doador Mensal vs Doador Geral
        // Alinhado com sponsorshipService.getMetrics(): verifica status ativo (ou reativado por doação recente) E vigência (evaluateSponsorshipValidity)
        const monthlySponsorships = uniqueSponsorships.filter(sp => {
          const st = (sp.status || 'active').toLowerCase().trim();
          const isExplicitlyCanceled = st === 'canceled' || st === 'cancelled' || st === 'replaced' || st === 'graduated' || st === 'discharged';
          if (isExplicitlyCanceled) return false;
          const isStatusActive = st === 'active' || st === 'paid' || st === 'ativo' || st === 'confirmed' || ((st === 'inactive' || st === 'expired') && hasRecentPaidDonation);
          if (!isStatusActive) return false;
          const validity = evaluateSponsorshipValidity(sp, email, latestPaidDonationIso);
          if (!validity.isExpired && (st === 'inactive' || st === 'expired') && hasRecentPaidDonation && sp.id) {
            // Auto-cura no banco se o registro de apadrinhamento estava inactive mas houve doação paga recente
            supabase.from('sponsorships').update({ status: 'active', last_sponsored_at: latestPaidDonationIso }).eq('id', sp.id).then(() => {});
          }
          return !validity.isExpired;
        });

        // Se o usuário estava com status 'inactive' na tabela users mas realizou uma doação paga recente (<= 60 dias), reativa automaticamente
        if (user?.status === 'inactive' && hasRecentPaidDonation && user?.id) {
          supabase.from('users').update({ status: 'active' }).eq('id', user.id).then(() => {});
        }

        // Verifica quantos dias se passaram desde a última contribuição (doação paga ou apadrinhamento)
        const allContribTimestamps = [
          latestPaidDonationIso,
          ...uniqueSponsorships.map((sp: any) => sp.last_sponsored_at || sp.started_at || sp.created_at)
        ]
          .filter(Boolean)
          .map(d => new Date(d as string).getTime())
          .filter(t => !isNaN(t));

        const latestContributionMs = allContribTimestamps.length > 0 ? Math.max(...allContribTimestamps) : 0;
        const daysSinceLastContribution = latestContributionMs > 0
          ? Math.max(0, Math.floor((Date.now() - latestContributionMs) / (1000 * 60 * 60 * 24)))
          : 999;

        // Se possui pacote trimestral/semestral/anual ainda vigente no futuro, não está inadimplente
        const hasActiveFuturePackage = monthlySponsorships.some(sp => {
          const val = evaluateSponsorshipValidity(sp, email, latestPaidDonationIso);
          return !val.isExpired && val.expiresAt && new Date(val.expiresAt).getTime() > Date.now();
        });

        const isOverTwoMonthsWithoutContributing =
          !hasActiveFuturePackage && daysSinceLastContribution > MAX_INACTIVE_DAYS_BEFORE_CHURN;

        // Calcula o valor mensal comprometido (apadrinhamento ou recorrência ativa)
        // REGRA DE OURO:
        // - Cada cota de apadrinhamento de criança é no mínimo R$ 90,00/mês.
        // - Em pacotes PIX (crianças * meses * 90), cada registro em sponsorships representa 1 criança escolhida (R$ 90/mês equivalente),
        //   NÃO entrando na regra dos R$ 90,00 sobre o valor total do pacote!
        const hasPixSponsorship = monthlySponsorships.some(
          sp => String(sp.payment_method || '').toLowerCase().includes('pix') || Number(sp.plan_months || 0) > 1
        );
        const spAmounts = monthlySponsorships.map(sp => {
          const isPixSp = String(sp.payment_method || '').toLowerCase().includes('pix') || Number(sp.plan_months || 0) > 1;
          const raw = Number(sp.monthly_amount || sp.amount || 0);
          if (isPixSp) {
            return 90;
          }
          return sp.child_id ? Math.max(90, raw) : raw;
        });
        const maxSpAmt = spAmounts.length > 0 ? Math.max(...spAmounts) : 0;
        const totalSpAmt = spAmounts.reduce((a, b) => a + b, 0);
        const effectiveMonthlyAmount = hasPixSponsorship ? totalSpAmt : Math.max(maxSpAmt, totalSpAmt);

        const hasExplicitSponsorship =
          uniqueSponsorships.some(sp => Boolean(sp.child_id)) ||
          userDonations.some(d => d.is_sponsorship || (d.campaign_title && d.campaign_title.toLowerCase().includes('apadrinh')));

        const isExplicitMaintainer =
          isKnownMantenedor || (user?.role === 'MANTENEDOR' && !hasExplicitSponsorship && !isKnownPadrinho);

        // Histórico: já foi ou era candidato a Padrinho ou Mantenedor
        const wasEverPadrinho = !isExplicitMaintainer && (
          isKnownPadrinho ||
          user?.role === 'SPONSOR' ||
          user?.role === 'PADRINHO' ||
          effectiveMonthlyAmount >= 90 ||
          uniqueSponsorships.some(sp => sp.child_id || Number(sp.monthly_amount || 0) >= 90) ||
          hasExplicitSponsorship
        );

        const wasEverMaintainer = !wasEverPadrinho && (
          isKnownMantenedor ||
          user?.role === 'MANTENEDOR' ||
          uniqueSponsorships.some(sp => sp.stripe_subscription_id || Number(sp.monthly_amount || 0) > 0) ||
          userDonations.some(d => d.stripe_subscription_id || d.recurrence === 'monthly')
        );

        const hasInactiveSponsorshipOnly =
          uniqueSponsorships.length > 0 &&
          monthlySponsorships.length === 0;

        const isUserInactiveWithoutRecentDonation =
          user?.status === 'inactive' && !hasRecentPaidDonation && !hasActiveFuturePackage;

        // REGRA SOLICITADA: Padrinhos/Mantenedores que estão há mais de 2 meses sem contribuir
        // saem da lista ativa de Padrinhos/Mantenedores, ficam na lista de quem já contribuiu (Doador Geral)
        // e entram na lista de "Deixaram de Contribuir" para contato.
        const isChurned =
          (wasEverPadrinho || wasEverMaintainer) &&
          (isOverTwoMonthsWithoutContributing || hasInactiveSponsorshipOnly || isUserInactiveWithoutRecentDonation);

        const formerRole: 'Ex-Padrinho' | 'Ex-Mantenedor' | undefined = isChurned
          ? (wasEverPadrinho ? 'Ex-Padrinho' : 'Ex-Mantenedor')
          : undefined;

        const isCandidateForPadrinho = !isChurned && wasEverPadrinho;

        // Coleta todas as crianças vinculadas para este padrinho (apenas se ativo e em dia <= 2 meses)
        const assignedChildrenList: Array<{ id: string; name: string; village?: string; photo_url?: string }> = [];
        const seenChildIds = new Set<string>();

        if (!isChurned) {
          monthlySponsorships.forEach(sp => {
            if (sp.child_id && !seenChildIds.has(sp.child_id)) {
              const ch = sp.children || childrenMap.get(sp.child_id);
              if (ch) {
                seenChildIds.add(sp.child_id);
                assignedChildrenList.push({
                  id: sp.child_id,
                  name: ch.name,
                  village: ch.address || ch.province || 'Casa Nutri',
                  photo_url: ch.photo_url
                });
              }
            }
          });
        }

        const isRealPadrinho = !isChurned && (assignedChildrenList.length > 0 || isCandidateForPadrinho);
        const isDoadorMensal = !isChurned && !isRealPadrinho && wasEverMaintainer;

        // Quem deixou de contribuir há > 2 meses sai de Padrinho/Doador Mensal e fica como Doador Geral (Já Contribuíram)
        const roleDisplay = isRealPadrinho 
          ? 'Padrinho' 
          : isDoadorMensal 
            ? 'Doador Mensal' 
            : 'Doador Geral';

        const totalDonated = paidDonations.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        const lastDonation = userDonations[0];

        // Calcula o valor da contribuição mensal ativa do padrinho / mantenedor
        // Em apadrinhamento via PIX (pacote de meses), NÃO usa o valor total do pagamento PIX como valor mensal!
        const latestPaidAmt = Number(paidDonations[0]?.amount || 0);
        const latestPaidIsPix = String(paidDonations[0]?.payment_method || '').toLowerCase().includes('pix');
        const computedMonthlyAmount = isRealPadrinho
          ? (hasPixSponsorship || latestPaidIsPix)
            ? Math.max(90, effectiveMonthlyAmount || (assignedChildrenList.length * 90) || 90)
            : Math.max(90, effectiveMonthlyAmount || (assignedChildrenList.length * 90) || (latestPaidAmt >= 90 ? latestPaidAmt : 90))
          : isDoadorMensal
            ? (effectiveMonthlyAmount > 0 ? effectiveMonthlyAmount : (latestPaidAmt > 0 ? latestPaidAmt : 50))
            : 0;
        const candidateNames = [
          user?.name,
          ...uniqueSponsorships.map((s: any) => s.donor_name),
          ...userDonations.map((d: any) => d.donor_name)
        ].filter(Boolean);
        const fullProperName = candidateNames.find((n: string) => !isEmailPrefixOrHandle(n));
        const donorName = fullProperName || candidateNames[0] || email.split('@')[0];

        const primaryChild = assignedChildrenList[0] || null;
        const childName = assignedChildrenList.map(c => c.name).join(', ') || undefined;
        const childVillage = primaryChild?.village;
        const sponsoredChildId = primaryChild?.id;

        const computedStatus =
          isChurned || isUserInactiveWithoutRecentDonation || hasInactiveSponsorshipOnly
            ? 'inactive'
            : paidDonations.length > 0 || monthlySponsorships.length > 0
              ? 'active'
              : userDonations.some((d: any) => d.status === 'pending')
                ? 'pending'
                : 'active';

        mappedSupporters.push({
          id: user?.id || `donor_${email}`,
          name: donorName,
          email: email,
          phone: user?.phone || uniqueSponsorships[0]?.donor_phone || lastDonation?.donor_phone || undefined,
          avatar: user?.avatar || undefined,
          role: roleDisplay,
          status: computedStatus,
          joinedAt: userDonations[userDonations.length - 1]?.created_at || user?.created_at || new Date().toISOString(),
          sponsoredChildName: childName,
          sponsoredChildVillage: childVillage,
          sponsoredChildId: sponsoredChildId,
          sponsoredChildren: assignedChildrenList,
          sponsorshipId: uniqueSponsorships[0]?.id,
          sponsorships: uniqueSponsorships,
          totalDonated,
          monthlyAmount: computedMonthlyAmount,
          donationsCount: paidDonations.length,
          lastDonationDate: lastDonation ? (lastDonation.paid_at || lastDonation.created_at)?.split('T')[0] : undefined,
          isChurned,
          formerRole,
          daysSinceLastContribution: latestContributionMs > 0 ? daysSinceLastContribution : undefined,
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
    // Padrinhos Ativos: Apoiadores que sustentam cotas de apadrinhamento de crianças (≥ R$ 90)
    const withSponsorship = supporters.filter(s => s.role === 'Padrinho').length;
    const totalSponsoredChildren = supporters
      .filter(s => s.role === 'Padrinho')
      .reduce((acc, s) => acc + (s.sponsoredChildren?.length || (s.sponsoredChildName ? 1 : 0)), 0);
    // Doadores Mensais (Mantenedores do Fundo Geral / Nutrição - ex: R$ 50/mês):
    const monthlyDonors = supporters.filter(s => s.role === 'Doador Mensal').length;
    const generalDonors = supporters.filter(s => s.role === 'Doador Geral').length;
    const churnedDonors = supporters.filter(s => Boolean(s.isChurned)).length;
    const totalRaised = supporters.reduce((acc, s) => acc + s.totalDonated, 0);
    const avgTicket = total > 0 ? totalRaised / total : 0;

    return {
      total,
      active,
      withSponsorship,
      totalSponsoredChildren,
      monthlyDonors,
      generalDonors,
      churnedDonors,
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
        (roleFilter === 'donor' && s.role === 'Doador Geral') ||
        (roleFilter === 'churned' && Boolean(s.isChurned));

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

  const handleAutoDistributeChildren = async () => {
    setIsDistributingChildren(true);
    setSyncFeedback(null);
    try {
      const waitingSupporters = supporters
        .filter(s => s.role === 'Padrinho' && !s.sponsoredChildId && (!s.sponsoredChildren || s.sponsoredChildren.length === 0))
        .map(s => {
          const activeUnassigned = (s.sponsorships || []).find((sp: any) => {
            const st = String(sp.status || 'active').toLowerCase().trim();
            return !sp.child_id && (st === 'active' || st === 'paid' || st === 'ativo' || st === 'confirmed');
          });
          return {
            id: s.id,
            email: s.email,
            name: s.name,
            phone: s.phone,
            sponsorshipId: activeUnassigned?.id || s.sponsorshipId
          };
        });

      const { linkedCount } = await sponsorshipService.autoLinkPendingSponsors(waitingSupporters);
      await fetchSupporters();

      if (linkedCount > 0) {
        setSyncFeedback({
          type: 'success',
          message: `${linkedCount} ${linkedCount === 1 ? 'padrinho aguardando vínculo foi conectado' : 'padrinhos aguardando vínculo foram conectados'} automaticamente de forma igualitária (sem alterar quem já tinha criança)!`
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: 'Nenhum novo vínculo realizado. Verifique se há padrinhos "Aguardando vínculo" e se existem crianças com vagas disponíveis dentro do limite configurado.'
        });
      }
    } catch (err: any) {
      console.error('Erro ao distribuir crianças:', err);
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Erro ao distribuir crianças automaticamente.'
      });
    } finally {
      setIsDistributingChildren(false);
      setTimeout(() => setSyncFeedback(null), 8000);
    }
  };

  const openChangeChildModal = (supporter: SupporterData) => {
    setChildModalSupporter(supporter);
    // Só pré-seleciona uma criança se o padrinho realmente já tiver vínculo ativo exibido na tabela
    let currentId = supporter.sponsoredChildId || '';
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
      // Prioriza a linha ativa sem criança vinculada (Aguardando vínculo) se houver
      const activeUnassigned = (childModalSupporter.sponsorships || []).find((s: any) => {
        const st = String(s.status || 'active').toLowerCase().trim();
        return !s.child_id && (st === 'active' || st === 'paid' || st === 'ativo' || st === 'confirmed');
      });
      const targetSponsorshipId = activeUnassigned?.id || childModalSupporter.sponsorshipId || childModalSupporter.sponsorships?.[0]?.id;

      const result = await sponsorshipService.updateSponsorChild({
        supporterId: childModalSupporter.id,
        supporterEmail: childModalSupporter.email,
        supporterName: childModalSupporter.name,
        supporterPhone: childModalSupporter.phone,
        sponsorshipId: targetSponsorshipId,
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

  const handleSendManualSponsorEmail = async (supporter: SupporterData) => {
    if (!supporter.email) return;
    const childLabel = supporter.sponsoredChildName || 'a criança vinculada';
    const confirmed = window.confirm(
      `Enviar manualmente o e-mail de boas-vindas de Padrinho para:\n\n` +
      `• Padrinho: ${supporter.name} (${supporter.email})\n` +
      `• Criança(s): ${childLabel}\n\n` +
      `O texto configurado em Comunicação > E-mails ("Apadrinhador") será utilizado.`
    );
    if (!confirmed) return;

    setSendingEmailFor(supporter.email);
    try {
      const res = await sponsorshipService.sendManualSponsorshipEmail(supporter.email, supporter.name);
      if (!res.success) {
        setSyncFeedback({
          type: 'error',
          message: res.error || 'Não foi possível enviar o e-mail.'
        });
      } else {
        setSyncFeedback({
          type: 'success',
          message: `E-mail de apadrinhamento enviado com sucesso para ${supporter.email} (${res.childrenCount} ${res.childrenCount === 1 ? 'criança' : 'crianças'}).`
        });
      }
      setTimeout(() => setSyncFeedback(null), 8000);
    } finally {
      setSendingEmailFor(null);
    }
  };

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallback abaixo
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const getFallbackChildrenNames = (supporter: SupporterData): string[] => {
    if (supporter.sponsoredChildren && supporter.sponsoredChildren.length > 0) {
      return supporter.sponsoredChildren.map(c => c.name).filter(Boolean);
    }
    if (supporter.sponsoredChildName && supporter.sponsoredChildName !== 'Aguardando vínculo') {
      return [supporter.sponsoredChildName];
    }
    return [];
  };

  const handleCopySponsorInvite = async (supporter: SupporterData) => {
    if (!supporter.email) return;
    setCopyingInviteFor(supporter.email);
    try {
      const invite = await sponsorshipService.buildSponsorInviteMessage(
        supporter.email,
        supporter.name,
        {
          phone: supporter.phone,
          fallbackChildrenNames: getFallbackChildrenNames(supporter)
        }
      );
      const copied = await copyTextToClipboard(invite.text);
      if (copied) {
        setCopiedInviteFor(supporter.email);
        setSyncFeedback({
          type: 'success',
          message: `Texto e link do convite de ${supporter.name} copiados! Cole no WhatsApp para enviar.`
        });
        setTimeout(() => setCopiedInviteFor(prev => (prev === supporter.email ? null : prev)), 2500);
      } else {
        setSyncFeedback({
          type: 'error',
          message: 'Não foi possível copiar automaticamente. Abra o Extrato para copiar o texto.'
        });
      }
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Erro ao gerar o texto do convite.'
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    } finally {
      setCopyingInviteFor(null);
    }
  };

  const handleSendSponsorWhatsApp = async (supporter: SupporterData) => {
    if (!supporter.email) return;
    setOpeningWhatsAppFor(supporter.email);
    try {
      const invite = await sponsorshipService.buildSponsorInviteMessage(
        supporter.email,
        supporter.name,
        {
          phone: supporter.phone,
          fallbackChildrenNames: getFallbackChildrenNames(supporter)
        }
      );
      window.open(invite.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Erro ao preparar mensagem do WhatsApp.'
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    } finally {
      setOpeningWhatsAppFor(null);
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
        <div 
          onClick={() => setRoleFilter('all')}
          className={cn(
            "bg-white p-6 rounded-3xl border transition-all cursor-pointer group hover:scale-[1.02] shadow-xl",
            roleFilter === 'all' 
              ? "border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10" 
              : "border-slate-100 shadow-slate-200/40 hover:border-amber-200"
          )}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
              <Users size={22} />
            </div>
            <span className={cn(
              "px-2.5 py-1 font-black text-[10px] rounded-lg uppercase tracking-wider transition-colors",
              roleFilter === 'all' ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"
            )}>
              {roleFilter === 'all' ? 'Filtro Ativo' : 'Base Geral'}
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
        <div 
          onClick={() => setRoleFilter(prev => prev === 'sponsor' ? 'all' : 'sponsor')}
          className={cn(
            "bg-white p-6 rounded-3xl border transition-all cursor-pointer group hover:scale-[1.02] shadow-xl",
            roleFilter === 'sponsor' 
              ? "border-rose-500 ring-2 ring-rose-500/20 shadow-rose-500/10" 
              : "border-slate-100 shadow-slate-200/40 hover:border-rose-200"
          )}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
              <Heart size={22} fill={roleFilter === 'sponsor' ? "currentColor" : "none"} />
            </div>
            <span className={cn(
              "px-2.5 py-1 font-black text-[10px] rounded-lg uppercase tracking-wider transition-colors",
              roleFilter === 'sponsor' ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700"
            )}>
              {roleFilter === 'sponsor' ? 'Filtro Ativo' : 'Apadrinhamento'}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Padrinhos Ativos</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {stats.withSponsorship}
          </p>
          <p className="text-[11px] text-slate-500 font-bold mt-2 flex items-center gap-1">
            <Heart size={11} className="text-rose-500 shrink-0 fill-rose-500" />
            <span>{stats.totalSponsoredChildren} {stats.totalSponsoredChildren === 1 ? 'criança acolhida' : 'crianças acolhidas'} (cotas ≥ R$ 90)</span>
          </p>
        </div>

        {/* Card 3: Mantenedores Mensais */}
        <div 
          onClick={() => setRoleFilter(prev => prev === 'maintainer' ? 'all' : 'maintainer')}
          className={cn(
            "bg-white p-6 rounded-3xl border transition-all cursor-pointer group hover:scale-[1.02] shadow-xl",
            roleFilter === 'maintainer' 
              ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/10" 
              : "border-slate-100 shadow-slate-200/40 hover:border-blue-200"
          )}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <Repeat size={22} />
            </div>
            <span className={cn(
              "px-2.5 py-1 font-black text-[10px] rounded-lg uppercase tracking-wider transition-colors",
              roleFilter === 'maintainer' ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-700"
            )}>
              {roleFilter === 'maintainer' ? 'Filtro Ativo' : 'Apoio Geral'}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Mantenedores Mensais</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {stats.monthlyDonors}
          </p>
          <p className="text-[11px] text-slate-500 font-bold mt-2">
            {stats.monthlyDonors} doadores mensais recorrentes (Fundo Geral)
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

            {/* Filtros Rápidos por Modalidade: Padrinhos vs Mantenedores vs Doadores */}
            <div className="flex flex-wrap items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm gap-1">
              <button
                onClick={() => setRoleFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  roleFilter === 'all' 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
                title="Mostrar todos os apoiadores"
              >
                <span>Todos</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-md font-black",
                  roleFilter === 'all' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  {stats.total}
                </span>
              </button>

              <button
                onClick={() => setRoleFilter('sponsor')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  roleFilter === 'sponsor' 
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30" 
                    : "text-rose-700 hover:bg-rose-50"
                )}
                title="Filtrar apenas Padrinhos (com crianças apadrinhadas)"
              >
                <Heart size={12} fill={roleFilter === 'sponsor' ? "currentColor" : "none"} />
                <span>Padrinhos</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-md font-black",
                  roleFilter === 'sponsor' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
                )}>
                  {stats.withSponsorship}
                </span>
              </button>

              <button
                onClick={() => setRoleFilter('maintainer')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  roleFilter === 'maintainer' 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30" 
                    : "text-blue-700 hover:bg-blue-50"
                )}
                title="Filtrar apenas Mantenedores Mensais (apoio geral recorrente)"
              >
                <Repeat size={12} />
                <span>Mantenedores</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-md font-black",
                  roleFilter === 'maintainer' ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                )}>
                  {stats.monthlyDonors}
                </span>
              </button>

              <button
                onClick={() => setRoleFilter('donor')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  roleFilter === 'donor' 
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30" 
                    : "text-amber-800 hover:bg-amber-50"
                )}
                title="Filtrar todos aqueles que já contribuíram (doadores gerais e ex-padrinhos)"
              >
                <DollarSign size={12} />
                <span>Já Contribuíram</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-md font-black",
                  roleFilter === 'donor' ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                )}>
                  {stats.generalDonors}
                </span>
              </button>

              <button
                onClick={() => setRoleFilter('churned')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  roleFilter === 'churned' 
                    ? "bg-orange-700 text-white shadow-sm shadow-orange-700/30" 
                    : "text-orange-800 hover:bg-orange-50"
                )}
                title="Lista de padrinhos/mantenedores há mais de 2 meses sem contribuir para entrarmos em contato"
              >
                <AlertCircle size={12} />
                <span>Deixaram de Contribuir (Contato)</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-md font-black",
                  roleFilter === 'churned' ? "bg-white/20 text-white" : "bg-orange-100 text-orange-800"
                )}>
                  {stats.churnedDonors}
                </span>
              </button>
            </div>

            {/* Distribuir Crianças Automaticamente para Padrinhos Aguardando Vínculo */}
            <button
              onClick={handleAutoDistributeChildren}
              disabled={isDistributingChildren}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Distribuir crianças disponíveis igualmente entre os padrinhos que estão Aguardando vínculo (sem alterar quem já tem criança)"
            >
              <Heart size={14} className={cn("text-white fill-white", isDistributingChildren && "animate-pulse")} />
              {isDistributingChildren ? 'Distribuindo...' : 'Distribuir Crianças Automaticamente'}
            </button>

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
              <th className="px-6 py-4 text-right">Contribuição Mensal</th>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                        {(unsubscribedEmails.has((s.email || '').toLowerCase().trim()) || s.name.includes('[DESCADASTRADO]')) && (
                          <span
                            title="Este contato cancelou o recebimento de e-mails — ajuste necessário"
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black uppercase tracking-wider"
                          >
                            DESCADASTRADO
                          </span>
                        )}
                      </div>
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
                  <div className="flex flex-col items-start gap-1">
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
                          Já Contribuiu
                        </>
                      )}
                    </span>

                    {s.isChurned && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-black">
                          <AlertCircle size={10} />
                          {s.formerRole || 'Ex-Padrinho'} • {s.daysSinceLastContribution ? `${s.daysSinceLastContribution}d sem contribuir` : '> 2 meses sem doar'}
                        </span>
                        {s.phone && (
                          <a
                            href={`https://wa.me/${s.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition-colors"
                            title="Entrar em contato via WhatsApp"
                          >
                            <Phone size={10} /> WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* Criança Apadrinhada */}
                <td className="px-6 py-5">
                  {s.role === 'Padrinho' ? (
                    <div className="flex items-center gap-2">
                      <div className="space-y-1">
                        {s.sponsoredChildren && s.sponsoredChildren.length > 1 ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 font-black text-[10px] flex items-center gap-1 shadow-xs">
                                <Heart size={10} className="fill-rose-500 text-rose-500" />
                                {s.sponsoredChildren.length} crianças apadrinhadas
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {s.sponsoredChildren.map((c, i) => (
                                <span key={c.id || i} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div>
                            <p className="text-xs font-black text-slate-900 flex items-center gap-1">
                              <Heart size={12} className="text-rose-500 shrink-0 fill-rose-500" />
                              <span className="truncate max-w-[150px]">{s.sponsoredChildName || 'Aguardando vínculo'}</span>
                            </p>
                            {s.sponsoredChildVillage && (
                              <p className="text-[10px] text-slate-400">{s.sponsoredChildVillage}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openChangeChildModal(s)}
                        title="Vincular ou Trocar Criança deste Padrinho"
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-100/80 bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-auto"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  ) : s.role === 'Doador Mensal' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-bold bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-xl">
                      <Repeat size={11} className="text-blue-500" />
                      Apoio Geral / Nutrição
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

                {/* Contribuição Mensal */}
                <td className="px-6 py-5 text-right">
                  {(s.monthlyAmount || 0) > 0 ? (
                    <>
                      <p className="text-sm font-black text-slate-900">
                        R$ {(s.monthlyAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <span className="text-[11px] font-bold text-slate-400">/mês</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {(() => {
                          if (s.role !== 'Padrinho') return 'Recorrente mensal';
                          const pixSp = (s.sponsorships || []).find(
                            (sp: any) => String(sp.payment_method || '').toLowerCase().includes('pix') || Number(sp.plan_months || 0) > 1
                          );
                          if (pixSp) {
                            const chosenChildrenCount = Math.max(1, s.sponsoredChildren?.length || (s.sponsorships || []).filter((sp: any) => String(sp.status || 'active').toLowerCase() === 'active').length || 1);
                            const months = Number(pixSp.plan_months || 0);
                            return `${chosenChildrenCount} ${chosenChildrenCount === 1 ? 'criança' : 'crianças'}${months > 1 ? ` • PIX ${months}m` : ' • PIX'}`;
                          }
                          const quotas = Math.max(1, Math.floor((s.monthlyAmount || 90) / 90));
                          return `${quotas} ${quotas === 1 ? 'cota ativa' : 'cotas ativas'}`;
                        })()}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-slate-400">—</p>
                      <p className="text-[10px] text-slate-400">Avulso / Inativo</p>
                    </>
                  )}
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
                  <div className="inline-flex flex-wrap items-center justify-center gap-1.5">
                    {s.role === 'Padrinho' && s.email && (
                      <>
                        <button
                          onClick={() => handleSendManualSponsorEmail(s)}
                          disabled={sendingEmailFor === s.email}
                          title="Enviar manualmente o e-mail de padrinho com a(s) criança(s) vinculada(s)"
                          className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 border border-amber-200/80 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Mail size={13} className={sendingEmailFor === s.email ? 'animate-pulse' : ''} />
                          {sendingEmailFor === s.email ? 'Enviando...' : 'Enviar E-mail'}
                        </button>
                        <button
                          onClick={() => handleCopySponsorInvite(s)}
                          disabled={copyingInviteFor === s.email}
                          title="Copiar texto e link do e-mail convite para enviar pelo WhatsApp"
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-2 border text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer",
                            copiedInviteFor === s.email
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-50 hover:bg-slate-800 hover:text-white text-slate-700 border-slate-200"
                          )}
                        >
                          {copiedInviteFor === s.email ? <Check size={13} /> : <Copy size={13} />}
                          {copiedInviteFor === s.email ? 'Copiado!' : copyingInviteFor === s.email ? 'Copiando...' : 'Copiar Convite'}
                        </button>
                        <button
                          onClick={() => handleSendSponsorWhatsApp(s)}
                          disabled={openingWhatsAppFor === s.email}
                          title={s.phone ? `Abrir WhatsApp (${s.phone}) com texto e link do convite` : 'Abrir WhatsApp com texto e link do convite'}
                          className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200/80 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <MessageCircle size={13} className={openingWhatsAppFor === s.email ? 'animate-pulse' : ''} />
                          {openingWhatsAppFor === s.email ? 'Abrindo...' : 'WhatsApp'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedSupporter(s)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 group/btn cursor-pointer"
                    >
                      <FileText size={13} className="text-slate-400 group-hover/btn:text-white" />
                      Ver Extrato
                    </button>
                  </div>
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
