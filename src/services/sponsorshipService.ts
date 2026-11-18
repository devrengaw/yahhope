import { supabase } from '../lib/supabase';
import { fetchAndSyncOrgSettings } from './organizationSettingsService';
import { isGibberishBotName } from '../utils/userCleanup';

export type PixPackageMonths = 3 | 6 | 12;

export interface ChildSponsorshipDetail {
  id: string;
  sponsorshipId?: string;
  name: string;
  dob?: string;
  ageText?: string;
  gender?: string;
  community?: string;
  photo_url?: string;
  story?: string;
  nutritional_status?: string;
  sponsorsCount: number;
  maxSponsors: number;
  isFull: boolean;
  // Metadados do plano / pacote de apadrinhamento (Cartão Mensal vs Pacote PIX 3, 6, 12 meses)
  paymentMethod?: string;
  planMonths?: number;
  packageAmount?: number;
  startedAt?: string;
  expiresAt?: string | null;
  daysRemaining?: number | null;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  isGraduated?: boolean;
  graduatedAt?: string | null;
  sponsors: Array<{
    id: string;
    name: string;
    email: string;
    monthly_amount: number;
    payment_method?: string;
    plan_months?: number;
    package_amount?: number;
    expires_at?: string | null;
    created_at: string;
  }>;
}

export interface PendingSponsorshipRenewal {
  sponsorshipId: string;
  childId: string;
  childName: string;
  childPhoto?: string;
  childCommunity?: string;
  childAgeText?: string;
  planMonths: number;
  packageAmount: number;
  monthlyAmount: number;
  paymentMethod: string;
  startedAt: string;
  expiresAt: string;
  daysRemaining: number; // <= 0 se vencido, 1..15 se prestes a vencer
  isExpired: boolean;
}

export interface SupporterGeneralSupport {
  active: boolean;
  monthlyAmount: number;
  paymentMethod: string;
  updatedAt?: string;
}

export interface SupporterCommitmentSummary {
  generalMonthlySupport: SupporterGeneralSupport;
  childSponsorships: {
    count: number;
    quotaCost: number;
    totalMonthly: number;
    children: ChildSponsorshipDetail[];
  };
  totalMonthlyCommitment: number;
}

export interface PendingSponsorInfo {
  id: string;
  name: string;
  email: string;
  monthly_amount: number;
  payment_method: string;
  created_at?: string;
}

export interface SponsorshipMetrics {
  totalChildren: number;
  quotaCost: number;
  maxSponsorsPerChild: number;
  totalSlots: number;
  filledSlots: number;
  availableSlots: number;
  isFullySponsored: boolean;
  occupancyRate: number;
  monthlySponsorshipRevenue: number;
  children: ChildSponsorshipDetail[];
  pendingSponsors?: PendingSponsorInfo[];
}

export interface AssignSponsorPayload {
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  quotasCount?: number;
  amountPerQuota?: number;
  amount?: number;
  paymentMethod?: string;
  planMonths?: number; // 1 = mensal cartão, 3/6/12 = pacote PIX
  renewChildId?: string; // caso esteja renovando o apadrinhamento de uma criança específica
  sponsorUserId?: string;
}

export interface AssignSponsorResult {
  success: boolean;
  assignedChildren: ChildSponsorshipDetail[];
  pendingAssignmentCount?: number;
  totalAmount: number;
  planMonths?: number;
  expiresAt?: string | null;
  message?: string;
  error?: string;
}

/**
 * Calcula a data de expiração do pacote de apadrinhamento (ex: 3, 6 ou 12 meses).
 * Se baseDate for informada e ainda estiver no futuro, soma os meses a partir dela (renovação antecipada).
 */
export function calculatePackageExpirationDate(months: number, baseDate?: string | Date | null): string {
  const now = new Date();
  const parsedBase = baseDate ? new Date(baseDate) : null;
  const effectiveStart = parsedBase && !isNaN(parsedBase.getTime()) && parsedBase > now ? new Date(parsedBase) : now;
  const target = new Date(effectiveStart);
  target.setMonth(target.getMonth() + months);
  return target.toISOString();
}

/**
 * Lê metadados locais de pacote PIX (fallback caso as colunas ainda não existam no banco)
 */
function getLocalPixPackageMeta(email?: string, childId?: string): { planMonths?: number; packageAmount?: number; startedAt?: string; expiresAt?: string; renewalDeclined?: boolean } | null {
  if (!email) return null;
  try {
    const clean = email.toLowerCase().trim();
    const raw = localStorage.getItem(`yah_pix_package_meta_${clean}`);
    if (!raw) return null;
    const map = JSON.parse(raw);
    if (childId && map[childId]) return map[childId];
    return map._default || null;
  } catch {
    return null;
  }
}

function saveLocalPixPackageMeta(email: string, childId: string, meta: { planMonths: number; packageAmount: number; startedAt: string; expiresAt: string | null; renewalDeclined?: boolean }) {
  if (!email) return;
  try {
    const clean = email.toLowerCase().trim();
    const key = `yah_pix_package_meta_${clean}`;
    const existingRaw = localStorage.getItem(key);
    const map = existingRaw ? JSON.parse(existingRaw) : {};
    map[childId] = meta;
    map._default = meta;
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
}

/**
 * Avalia a vigência de um registro de apadrinhamento.
 * Pacotes PIX de 3, 6 e 12 meses permanecem ativos durante todo o período contratado
 * (não perdem acesso na virada de cada mês) e só expiram ao final do prazo contratado.
 */
export const MAX_INACTIVE_DAYS_BEFORE_CHURN = 60; // 2 meses sem contribuir

export function evaluateSponsorshipValidity(sp: any, fallbackEmail?: string, latestDonationIso?: string): {
  planMonths: number;
  packageAmount: number;
  startedAt: string;
  expiresAt: string | null;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
  renewalDeclined: boolean;
  daysSinceLastContribution: number;
} {
  const email = (sp?.donor_email || fallbackEmail || '').toLowerCase().trim();
  const localMeta = getLocalPixPackageMeta(email, sp?.child_id);

  const isPix = String(sp?.payment_method || '').toLowerCase().includes('pix');
  const rawPlanMonths = Number(sp?.plan_months || localMeta?.planMonths || 0);
  const planMonths = rawPlanMonths > 0 ? rawPlanMonths : (isPix ? 3 : 1);

  const monthlyAmt = Math.max(90, Number(sp?.monthly_amount || 90));
  const packageAmount = Number(sp?.package_amount || localMeta?.packageAmount || (monthlyAmt * planMonths));
  const startedAt = sp?.started_at || localMeta?.startedAt || sp?.last_sponsored_at || sp?.created_at || new Date().toISOString();

  // Calcula quantos dias se passaram desde a última contribuição conhecida deste padrinho
  const candidateDates = [
    sp?.last_sponsored_at,
    sp?.started_at,
    sp?.created_at,
    localMeta?.startedAt,
    latestDonationIso
  ]
    .filter(Boolean)
    .map(d => new Date(d).getTime())
    .filter(t => !isNaN(t));

  const latestContributionMs = candidateDates.length > 0 ? Math.max(...candidateDates) : Date.now();
  const daysSinceLastContribution = Math.max(0, Math.floor((Date.now() - latestContributionMs) / (1000 * 60 * 60 * 24)));
  const isOverdueTwoMonths = daysSinceLastContribution > MAX_INACTIVE_DAYS_BEFORE_CHURN;

  let expiresAt: string | null = sp?.expires_at || localMeta?.expiresAt || null;
  if (!expiresAt && (planMonths > 1 || isPix) && (sp?.started_at || sp?.last_sponsored_at || sp?.created_at)) {
    const startObj = new Date(startedAt);
    if (!isNaN(startObj.getTime())) {
      const calcExp = new Date(startObj);
      calcExp.setMonth(calcExp.getMonth() + planMonths);
      expiresAt = calcExp.toISOString();
    }
  }

  const renewalDeclined = Boolean(sp?.renewal_declined || localMeta?.renewalDeclined || String(sp?.status || '').toLowerCase() === 'expired');

  if (!expiresAt) {
    return {
      planMonths,
      packageAmount,
      startedAt,
      expiresAt: null,
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: renewalDeclined || isOverdueTwoMonths,
      renewalDeclined,
      daysSinceLastContribution
    };
  }

  const expDate = new Date(expiresAt);
  if (isNaN(expDate.getTime())) {
    return {
      planMonths,
      packageAmount,
      startedAt,
      expiresAt: null,
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: renewalDeclined || isOverdueTwoMonths,
      renewalDeclined,
      daysSinceLastContribution
    };
  }

  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  // Se o pacote futuro ainda está vigente (diffMs > 0), permanece ativo;
  // Se o pacote original venceu, mas a pessoa fez uma nova contribuição há <= 2 meses (!isOverdueTwoMonths), continua ativa!
  const isExpired = (diffMs <= 0 && isOverdueTwoMonths) || renewalDeclined;
  const isExpiringSoon = !isExpired && diffMs > 0 && daysRemaining <= 15;

  return {
    planMonths,
    packageAmount,
    startedAt,
    expiresAt,
    daysRemaining,
    isExpiringSoon,
    isExpired,
    renewalDeclined,
    daysSinceLastContribution
  };
}

/**
 * Calcula idade formatada em texto a partir do dob
 */
export function calculateChildAge(dobString?: string): string {
  if (!dobString) return 'Idade em acompanhamento';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 'Idade em acompanhamento';
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export const FALLBACK_CHILDREN = [
  {
    id: 'c1010101-0001-0001-0001-000000000001',
    name: 'Amina Juma',
    dob: '2022-04-12',
    gender: 'F',
    address: 'Comunidade de Namicopo, Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=600',
    story: 'Amina recebe papas terapêuticas e acompanhamento pediátrico quinzenal na Casa Nutri, recuperando a saúde e o sorriso com vitalidade.'
  },
  {
    id: 'c1010101-0001-0001-0001-000000000002',
    name: 'Mateus Manuel',
    dob: '2023-01-18',
    gender: 'M',
    address: 'Comunidade de Muhala, Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=600',
    story: 'Mateus é acompanhado pela nossa equipe multidisciplinar. Seu apadrinhamento garante suplementação vitamínica e leite fortificado na Casa Nutri.'
  },
  {
    id: 'c1010101-0001-0001-0001-000000000003',
    name: 'Esperança Bernardo',
    dob: '2021-09-05',
    gender: 'F',
    address: 'Comunidade de Carrupeia, Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600',
    story: 'Esperança superou o quadro crítico de desnutrição na Casa Nutri. Hoje apresenta ganho de peso constante e participa de atividades infantis.'
  },
  {
    id: 'c1010101-0001-0001-0001-000000000004',
    name: 'Inácio António',
    dob: '2022-11-20',
    gender: 'M',
    address: 'Aldeia de Natikiri, Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&q=80&w=600',
    story: 'Inácio recebe alimentação terapêutica diária e exames médicos regulares na Casa Nutri, transformando a fragilidade em esperança viva.'
  }
];

export const sponsorshipService = {
  /**
   * Obtém métricas consolidadas de quotização e ocupação de todas as crianças
   */
  async getMetrics(): Promise<SponsorshipMetrics> {
    const settings = await fetchAndSyncOrgSettings();
    const quotaCost = Number(settings.sponsorship_quota_cost) || 90;
    const maxSponsorsPerChild = Number(settings.max_sponsors_per_child) || 2;

    try {
      // 1. Busca crianças elegíveis no banco
      const { data: childrenData, error: childError } = await supabase
        .from('children')
        .select('*')
        .order('name', { ascending: true });

      if (childError) {
        console.warn('Aviso ao consultar children no Supabase, usando catálogo local:', childError.message);
      }

      // 2. Busca apadrinhamentos, doações (para checar inatividade > 2 meses) e altas clínicas
      const [spRes, dischargeRes, donationsRes] = await Promise.all([
        supabase.from('sponsorships').select('*'),
        supabase.from('clinical_events').select('child_id, is_discharge, nutritional_status, notes').or('is_discharge.eq.true,nutritional_status.eq.Alta,nutritional_status.eq.Encerrado'),
        supabase.from('donations').select('donor_email, paid_at, created_at, status')
      ]);

      const sponsorshipsData = spRes.data;
      if (spRes.error) {
        console.warn('Aviso ao consultar sponsorships:', spRes.error.message);
      }

      // Mapeia a data da última doação paga por e-mail
      const latestDonationByEmail = new Map<string, string>();
      (donationsRes.data || []).forEach((d: any) => {
        const dSt = String(d.status || 'paid').toLowerCase().trim();
        if (dSt === 'failed' || dSt === 'canceled' || dSt === 'cancelled') return;
        const em = (d.donor_email || '').toLowerCase().trim();
        const dt = d.paid_at || d.created_at;
        if (!em || !dt) return;
        const prev = latestDonationByEmail.get(em);
        if (!prev || new Date(dt).getTime() > new Date(prev).getTime()) {
          latestDonationByEmail.set(em, dt);
        }
      });

      const dischargedChildIds = new Set<string>();
      (dischargeRes.data || []).forEach((ev: any) => {
        const isHospDischarge = ev.notes && String(ev.notes).includes('[ALTA HOSPITALAR]');
        if (!isHospDischarge && (ev.is_discharge || ev.nutritional_status === 'Alta' || ev.nutritional_status === 'Encerrado')) {
          if (ev.child_id) dischargedChildIds.add(String(ev.child_id).trim().toLowerCase());
        }
      });

      const allChildren = (childrenData || []).filter((c: any) => {
        const spSt = String(c.sponsorship_status || 'active').toLowerCase().trim();
        if (spSt === 'graduated' || spSt === 'paused' || spSt === 'discharged') return false;
        if (dischargedChildIds.has(String(c.id).trim().toLowerCase())) return false;
        return true;
      });
      const allSponsorships = sponsorshipsData || [];

      // Mapeia padrinhos por child_id (resiliente a variações de status, case de ID e vigência de pacote PIX)
      // e também coleta padrinhos ativos com valor >= quotaCost que estão "Aguardando vínculo" (child_id IS NULL)
      const sponsorsByChild = new Map<string, any[]>();
      const pendingSponsors: PendingSponsorInfo[] = [];

      allSponsorships.forEach(sp => {
        // Ignora status explicitamente cancelados, substituídos ou com alta (graduated/discharged)
        // Se um apadrinhamento estava marcado como 'inactive' ou 'expired', mas o padrinho fez uma doação recente (<= 60 dias),
        // evaluateSponsorshipValidity logo abaixo identificará que !validity.isExpired e reativará a vaga!
        const st = String(sp.status || 'active').toLowerCase().trim();
        if (st === 'canceled' || st === 'cancelled' || st === 'replaced' || st === 'graduated' || st === 'discharged') {
          return;
        }

        // Verifica se o pacote PIX já venceu, se a renovação foi recusada ou se está há mais de 2 meses sem contribuir
        const cleanSpEmail = (sp.donor_email || sp.users?.email || '').toLowerCase().trim();
        const latestDonIso = latestDonationByEmail.get(cleanSpEmail);
        const hasRecentPaidDonation = Boolean(
          latestDonIso &&
          Math.floor((Date.now() - new Date(latestDonIso).getTime()) / (1000 * 60 * 60 * 24)) <= MAX_INACTIVE_DAYS_BEFORE_CHURN
        );

        if ((st === 'inactive' || st === 'expired') && !hasRecentPaidDonation) {
          return;
        }

        const validity = evaluateSponsorshipValidity(sp, cleanSpEmail, latestDonIso);
        if (validity.isExpired) {
          return;
        }

        // Auto-cura silenciosa no banco caso o registro estivesse 'inactive'/'expired' mas houve pagamento recente
        if ((st === 'inactive' || st === 'expired') && hasRecentPaidDonation && sp.id) {
          supabase
            .from('sponsorships')
            .update({ status: 'active', last_sponsored_at: latestDonIso })
            .eq('id', sp.id)
            .then(() => {});
        }

        const sponsorName = sp.donor_name || sp.users?.name || sp.donor_email?.split('@')[0] || 'Padrinho';
        const sponsorEmail = sp.donor_email || sp.users?.email || '';
        const rawAmt = Number(sp.monthly_amount);

        if (!sp.child_id) {
          // Só entra na fila de "Aguardando vínculo" se tiver valor de cota de apadrinhamento (>= quotaCost)
          if (!isNaN(rawAmt) && rawAmt >= quotaCost) {
            pendingSponsors.push({
              id: sp.id,
              name: sponsorName,
              email: sponsorEmail,
              monthly_amount: rawAmt,
              payment_method: sp.payment_method || 'credit_card',
              created_at: sp.created_at
            });
          }
          return;
        }

        const cleanChildId = String(sp.child_id).trim().toLowerCase();
        if (!sponsorsByChild.has(cleanChildId)) {
          sponsorsByChild.set(cleanChildId, []);
        }
        
        // REGRA DE OURO: O valor mínimo de apadrinhamento por cota é R$ 90,00 (nunca R$ 30)
        const effectiveAmt = (!isNaN(rawAmt) && rawAmt >= quotaCost) ? rawAmt : quotaCost;

        sponsorsByChild.get(cleanChildId)!.push({
          id: sp.id,
          name: sponsorName,
          email: sponsorEmail,
          monthly_amount: effectiveAmt,
          payment_method: sp.payment_method || 'credit_card',
          plan_months: validity.planMonths,
          package_amount: validity.packageAmount,
          expires_at: validity.expiresAt,
          created_at: sp.created_at
        });
      });

      // Monta lista de crianças com detalhes de apadrinhamento
      const childrenDetails: ChildSponsorshipDetail[] = allChildren.map(c => {
        const cleanId = String(c.id).trim().toLowerCase();
        // Busca direta pelo ID limpo ou pelo nome se houver vínculo nominal
        let sponsors = sponsorsByChild.get(cleanId) || [];
        if (sponsors.length === 0 && c.name) {
          // Fallback por nome se ID diferir por formatação
          const matchedKey = Array.from(sponsorsByChild.keys()).find(k => k === cleanId);
          if (matchedKey) sponsors = sponsorsByChild.get(matchedKey) || [];
        }
        const sponsorsCount = sponsors.length;
        const isFull = sponsorsCount >= maxSponsorsPerChild;

        return {
          id: c.id,
          name: c.name,
          dob: c.dob,
          ageText: calculateChildAge(c.dob),
          gender: c.gender,
          community: c.address || c.province || 'Casa Nutri - Nampula',
          photo_url: c.photo_url || '',
          story: c.story || `Acompanhado com amor pela equipe clínica da Casa Nutri em Moçambique, recebendo suplementação e alimentação balanceada.`,
          sponsorsCount,
          maxSponsors: maxSponsorsPerChild,
          isFull,
          sponsors
        };
      });

      const totalChildren = childrenDetails.length;
      const totalSlots = totalChildren * maxSponsorsPerChild;
      const filledSlots = childrenDetails.reduce((acc, c) => acc + c.sponsorsCount, 0);
      const availableSlots = Math.max(0, totalSlots - filledSlots);
      const isFullySponsored = totalChildren > 0 && availableSlots === 0;
      const occupancyRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
      const monthlySponsorshipRevenue = filledSlots * quotaCost;

      return {
        totalChildren,
        quotaCost,
        maxSponsorsPerChild,
        totalSlots,
        filledSlots,
        availableSlots,
        isFullySponsored,
        occupancyRate,
        monthlySponsorshipRevenue,
        children: childrenDetails,
        pendingSponsors
      };
    } catch (err) {
      console.error('Erro ao calcular métricas de apadrinhamento:', err);
      // Fallback gracioso
      return {
        totalChildren: 0,
        quotaCost,
        maxSponsorsPerChild,
        totalSlots: 0,
        filledSlots: 0,
        availableSlots: 0,
        isFullySponsored: false,
        occupancyRate: 0,
        monthlySponsorshipRevenue: 0,
        children: []
      };
    }
  },

  /**
   * Algoritmo Least-Sponsored Round-Robin:
   * Distribui cotas de apadrinhamento priorizando as crianças com menor número de padrinhos,
   * garantindo que todas recebam apoio de forma homogênea.
   * REGRA: Doação ou apadrinhamento com valor > R$ 90,00 recebe MAIS DE UMA criança!
   */
  async assignChildrenToSponsor(payload: AssignSponsorPayload): Promise<AssignSponsorResult> {
    const {
      donorName,
      donorEmail,
      donorPhone,
      quotasCount,
      paymentMethod = 'credit_card',
      renewChildId,
      sponsorUserId
    } = payload;

    const isPix = String(paymentMethod).toLowerCase().includes('pix');
    const planMonths = payload.planMonths && payload.planMonths > 0
      ? payload.planMonths
      : (isPix ? 3 : 1);

    const metrics = await this.getMetrics();
    const quotaCost = Math.max(90, payload.amountPerQuota || metrics.quotaCost || 90);
    const maxSponsors = metrics.maxSponsorsPerChild;

    // REGRA DE OURO:
    // - Se for Cartão Mensal (planMonths = 1): R$ 90 = 1 criança, R$ 180 = 2 crianças...
    // - Se for Pacote PIX (planMonths = 3, 6 ou 12): o valor pago é (cotas * R$ 90 * planMonths).
    //   Portanto, o equivalente mensal é (totalSupplied / planMonths), evitando alocar 3/6/12 crianças
    //   quando a pessoa está pagando 3/6/12 meses de 1 criança!
    const totalSupplied = payload.amount || (payload.amountPerQuota && payload.amountPerQuota >= 90 ? payload.amountPerQuota * planMonths : 0);
    const monthlyEquivalent = planMonths > 1 && totalSupplied >= 90 * planMonths
      ? totalSupplied / planMonths
      : totalSupplied;

    let effectiveQuotas = quotasCount || 1;
    if (quotasCount && quotasCount >= 1) {
      effectiveQuotas = quotasCount;
    } else if (monthlyEquivalent >= 90) {
      effectiveQuotas = Math.max(1, Math.floor(monthlyEquivalent / 90));
    }

    // 1. Filtra crianças elegíveis (respeitando rigorosamente o teto maxSponsors, exceto renovação da própria criança)
    const availableChildren = metrics.children.filter(c => c.sponsorsCount < maxSponsors || c.id === renewChildId);

    // 2. Ordena priorizando a criança em renovação (se houver) e depois menor número de padrinhos ativos (Least-Sponsored)
    availableChildren.sort((a, b) => {
      if (renewChildId) {
        if (a.id === renewChildId) return -1;
        if (b.id === renewChildId) return 1;
      }
      if (a.sponsorsCount !== b.sponsorsCount) {
        return a.sponsorsCount - b.sponsorsCount;
      }
      return a.name.localeCompare(b.name);
    });

    // 3. Seleciona as N crianças disponíveis (se não houver crianças livres, as cotas restantes ficam como "Aguardando vínculo")
    const countToAssign = Math.min(effectiveQuotas, availableChildren.length);
    const pendingAssignmentCount = Math.max(0, effectiveQuotas - countToAssign);
    const selectedChildren = availableChildren.slice(0, countToAssign);
    const totalAmount = totalSupplied > 0 ? totalSupplied : effectiveQuotas * quotaCost * planMonths;
    const perChildPackageAmount = quotaCost * planMonths;

    const cleanEmail = donorEmail.toLowerCase().trim();
    const nowIso = new Date().toISOString();
    let finalExpiresAt: string | null = planMonths > 1 || isPix
      ? calculatePackageExpirationDate(planMonths)
      : null;

    try {
      // 4. Cria ou atualiza os registros em 'sponsorships'
      for (const child of selectedChildren) {
        let queryExisting = supabase
          .from('sponsorships')
          .select('*')
          .ilike('donor_email', cleanEmail);
        
        if (sponsorUserId) {
          queryExisting = queryExisting.or(`sponsor_id.eq.${sponsorUserId},donor_email.ilike.${cleanEmail}`);
        }
        const { data: existingRows } = await queryExisting;

        // Verifica se já existe linha para esta mesma criança (inclusive expirada/em renovação)
        const existingSameChild = (existingRows || []).find(r => r.child_id === child.id);
        const unassigned = (existingRows || []).find(r => !r.child_id && r.status !== 'canceled');

        const targetRowToUpdate = existingSameChild || unassigned;
        const computedExpiresAt = planMonths > 1 || isPix
          ? calculatePackageExpirationDate(planMonths, existingSameChild?.expires_at)
          : null;
        finalExpiresAt = computedExpiresAt;

        // Salva metadados no cache local para resiliência imediata
        saveLocalPixPackageMeta(cleanEmail, child.id, {
          planMonths,
          packageAmount: perChildPackageAmount,
          startedAt: nowIso,
          expiresAt: computedExpiresAt,
          renewalDeclined: false
        });

        // Remove da lista local de renovações recusadas caso estivesse lá
        try {
          const decKey = `yah_declined_renewals_${cleanEmail}`;
          const decRaw = localStorage.getItem(decKey);
          if (decRaw) {
            const decArr: string[] = JSON.parse(decRaw);
            localStorage.setItem(decKey, JSON.stringify(decArr.filter(id => id !== child.id && id !== targetRowToUpdate?.id)));
          }
        } catch {}

        if (targetRowToUpdate) {
          const fullUpdate: any = {
            child_id: child.id,
            donor_name: donorName,
            donor_email: cleanEmail,
            donor_phone: donorPhone || null,
            monthly_amount: quotaCost,
            payment_method: paymentMethod,
            status: 'active',
            last_sponsored_at: nowIso,
            sponsor_id: sponsorUserId || targetRowToUpdate.sponsor_id || null,
            plan_months: planMonths,
            package_amount: perChildPackageAmount,
            started_at: nowIso,
            expires_at: computedExpiresAt,
            renewal_declined: false
          };

          const { error: upErr } = await supabase
            .from('sponsorships')
            .update(fullUpdate)
            .eq('id', targetRowToUpdate.id);

          if (upErr) {
            // Fallback se as colunas de pacote ainda não tiverem sido migradas no banco
            await supabase
              .from('sponsorships')
              .update({
                child_id: child.id,
                donor_name: donorName,
                donor_email: cleanEmail,
                donor_phone: donorPhone || null,
                monthly_amount: quotaCost,
                payment_method: paymentMethod,
                status: 'active',
                last_sponsored_at: nowIso,
                sponsor_id: sponsorUserId || targetRowToUpdate.sponsor_id || null
              })
              .eq('id', targetRowToUpdate.id);
          }
          continue;
        }

        const fullSponsorshipRecord: any = {
          child_id: child.id,
          sponsor_id: sponsorUserId || null,
          donor_name: donorName,
          donor_email: cleanEmail,
          donor_phone: donorPhone || null,
          monthly_amount: quotaCost,
          quotas_count: 1,
          status: 'active',
          payment_method: paymentMethod,
          last_sponsored_at: nowIso,
          plan_months: planMonths,
          package_amount: perChildPackageAmount,
          started_at: nowIso,
          expires_at: computedExpiresAt,
          renewal_declined: false
        };

        const { error: spInsertErr } = await supabase
          .from('sponsorships')
          .insert([fullSponsorshipRecord]);

        if (spInsertErr) {
          // Fallback caso as colunas novas ainda não existam no banco
          const baseSponsorshipRecord: any = {
            child_id: child.id,
            sponsor_id: sponsorUserId || null,
            donor_name: donorName,
            donor_email: cleanEmail,
            donor_phone: donorPhone || null,
            monthly_amount: quotaCost,
            quotas_count: 1,
            status: 'active',
            payment_method: paymentMethod,
            last_sponsored_at: nowIso
          };
          await supabase.from('sponsorships').insert([baseSponsorshipRecord]);
        }
      }

      // 4b. Se houver cotas excedentes sem criança disponível no teto atual, registra como "Aguardando vínculo" (child_id: null)
      for (let p = 0; p < pendingAssignmentCount; p++) {
        const pendingRecord: any = {
          child_id: null,
          sponsor_id: sponsorUserId || null,
          donor_name: donorName,
          donor_email: cleanEmail,
          donor_phone: donorPhone || null,
          monthly_amount: quotaCost,
          quotas_count: 1,
          status: 'active',
          payment_method: paymentMethod,
          last_sponsored_at: nowIso,
          plan_months: planMonths,
          package_amount: perChildPackageAmount,
          started_at: nowIso,
          expires_at: finalExpiresAt,
          renewal_declined: false
        };
        const { error: pErr } = await supabase.from('sponsorships').insert([pendingRecord]);
        if (pErr) {
          await supabase.from('sponsorships').insert([{
            child_id: null,
            sponsor_id: sponsorUserId || null,
            donor_name: donorName,
            donor_email: cleanEmail,
            donor_phone: donorPhone || null,
            monthly_amount: quotaCost,
            quotas_count: 1,
            status: 'active',
            payment_method: paymentMethod,
            last_sponsored_at: nowIso
          }]);
        }
      }

      // Enriquecer selectedChildren com metadados do pacote
      const enrichedChildren: ChildSponsorshipDetail[] = selectedChildren.map(c => ({
        ...c,
        paymentMethod,
        planMonths,
        packageAmount: perChildPackageAmount,
        startedAt: nowIso,
        expiresAt: finalExpiresAt,
        daysRemaining: finalExpiresAt ? Math.ceil((new Date(finalExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
        isExpiringSoon: false,
        isExpired: false
      }));

      // 5. Registra no Módulo Financeiro Global (apenas para apoiadores legítimos)
      if (!isGibberishBotName(donorName)) {
        const suffixPending = countToAssign === 0 ? ' - Aguardando vínculo' : '';
        const txDescription = planMonths > 1 || isPix
          ? `Apadrinhamento PIX - Pacote ${planMonths} Meses (${effectiveQuotas} ${effectiveQuotas === 1 ? 'cota' : 'cotas'}${suffixPending}) - ${donorName}`
          : `Apadrinhamento Mensal (${effectiveQuotas} ${effectiveQuotas === 1 ? 'cota' : 'cotas'}${suffixPending}) - ${donorName}`;

        await supabase.from('finance_transactions').insert({
          description: txDescription,
          amount: totalAmount,
          type: 'income',
          category_id: 'cat_sponsorship',
          status: 'completed',
          account: isPix ? 'Pix Apadrinhamento' : 'Cartão de Crédito',
          recurrence: planMonths > 1 || isPix ? 'none' : 'monthly',
          date: nowIso.split('T')[0]
        });
      }

      // 7. Persiste no cache local do padrinho de forma estrita
      try {
        const cacheKey = `yah_sponsored_children_${cleanEmail}`;
        localStorage.setItem(cacheKey, JSON.stringify(enrichedChildren));
      } catch (cacheErr) {
        console.warn('Erro ao salvar apadrinhamento no cache:', cacheErr);
      }

      // 8. Verifica se o padrinho já possui cadastro ativo na plataforma
      const isRegistered = await this.isUserRegistered(cleanEmail);

      // 9. Dispara o E-mail de Apresentação da(s) Criança(s) Apadrinhada(s) e Acesso ao Portal (inclusive para PIX)
      await this.sendSponsorshipWelcomeEmail(cleanEmail, donorName, enrichedChildren, totalAmount, isRegistered, false, {
        paymentMethod,
        planMonths,
        expiresAt: finalExpiresAt
      });

      let finalMessage: string;
      if (enrichedChildren.length === 0) {
        finalMessage = 'Parabéns! Sua contribuição de apadrinhamento foi confirmada com sucesso. Obrigado por transformar vidas!';
      } else if (planMonths > 1) {
        finalMessage = `Parabéns! Você apadrinhou ${enrichedChildren.length} ${enrichedChildren.length === 1 ? 'criança' : 'crianças'} pelo pacote de ${planMonths} meses!`;
      } else {
        finalMessage = `Parabéns! Você apadrinhou ${enrichedChildren.length} ${enrichedChildren.length === 1 ? 'criança' : 'crianças'}. Enviamos o perfil completo por e-mail!`;
      }

      return {
        success: true,
        assignedChildren: enrichedChildren,
        pendingAssignmentCount,
        totalAmount,
        planMonths,
        expiresAt: finalExpiresAt,
        message: finalMessage
      };
    } catch (err: any) {
      console.error('Erro ao efetivar apadrinhamento:', err);
      return {
        success: false,
        assignedChildren: selectedChildren,
        totalAmount,
        planMonths,
        expiresAt: finalExpiresAt,
        error: err.message || 'Erro ao processar apadrinhamento'
      };
    }
  },

  /**
   * Vincula automaticamente padrinhos que estão na fila "Aguardando vínculo"
   * sempre que houver crianças com vagas abertas dentro de maxSponsorsPerChild.
   * Nunca altera os padrinhos que já possuem criança vinculada.
   */
  async autoLinkPendingSponsors(
    extraWaitingSupporters?: Array<{ id?: string; email: string; name?: string; phone?: string; sponsorshipId?: string }>
  ): Promise<{ linkedCount: number }> {
    try {
      const metrics = await this.getMetrics();
      if (metrics.availableSlots <= 0) {
        return { linkedCount: 0 };
      }

      // E-mails que já possuem criança vinculada ativa (NÃO devem ser alterados)
      const alreadyLinkedEmails = new Set<string>();
      metrics.children.forEach(c => {
        c.sponsors.forEach(s => {
          const em = (s.email || '').toLowerCase().trim();
          if (em) alreadyLinkedEmails.add(em);
        });
      });

      // Cópia mutável das crianças com vagas abertas (Least-Sponsored primeiro)
      const openChildren = metrics.children
        .filter(c => c.sponsorsCount < metrics.maxSponsorsPerChild)
        .map(c => ({ ...c, sponsorEmails: new Set(c.sponsors.map(s => (s.email || '').toLowerCase().trim()).filter(Boolean)) }))
        .sort((a, b) => a.sponsorsCount - b.sponsorsCount || a.name.localeCompare(b.name));

      if (openChildren.length === 0) {
        return { linkedCount: 0 };
      }

      // Monta fila consolidada: 1) linhas de sponsorships sem child_id; 2) padrinhos aguardando vínculo da Base de Apoiadores / users
      const queue: Array<{ sponsorshipId?: string; userId?: string; name: string; email: string; phone?: string; monthly_amount: number; created_at?: string }> = [];
      const queuedEmails = new Set<string>();

      (metrics.pendingSponsors || []).forEach(ps => {
        const em = (ps.email || '').toLowerCase().trim();
        queue.push({
          sponsorshipId: ps.id,
          name: ps.name,
          email: em,
          monthly_amount: ps.monthly_amount || metrics.quotaCost,
          created_at: ps.created_at
        });
        if (em) queuedEmails.add(em);
      });

      if (extraWaitingSupporters && extraWaitingSupporters.length > 0) {
        extraWaitingSupporters.forEach(ws => {
          const em = (ws.email || '').toLowerCase().trim();
          if (!em || alreadyLinkedEmails.has(em) || queuedEmails.has(em)) return;
          queuedEmails.add(em);
          queue.push({
            sponsorshipId: ws.sponsorshipId,
            userId: ws.id && !ws.id.startsWith('donor_') ? ws.id : undefined,
            name: ws.name || em.split('@')[0],
            email: em,
            phone: ws.phone,
            monthly_amount: metrics.quotaCost
          });
        });
      } else {
        // Caso chamado da aba Quotização sem extraWaitingSupporters, busca também users com role SPONSOR/PADRINHO sem criança vinculada
        const { data: sponsorUsers } = await supabase
          .from('users')
          .select('id, name, email, phone, status, created_at')
          .in('role', ['SPONSOR', 'PADRINHO']);

        (sponsorUsers || []).forEach((u: any) => {
          if (u.status === 'inactive') return;
          const em = (u.email || '').toLowerCase().trim();
          if (!em || alreadyLinkedEmails.has(em) || queuedEmails.has(em)) return;
          queuedEmails.add(em);
          queue.push({
            userId: u.id,
            name: u.name || em.split('@')[0],
            email: em,
            phone: u.phone || undefined,
            monthly_amount: metrics.quotaCost,
            created_at: u.created_at
          });
        });
      }

      if (queue.length === 0) {
        return { linkedCount: 0 };
      }

      // Ordena pendentes do mais antigo para o mais novo (FIFO)
      queue.sort((a, b) =>
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );

      let linkedCount = 0;
      for (const pending of queue) {
        const cleanEmail = (pending.email || '').toLowerCase().trim();
        // Escolhe a criança com menor número de padrinhos que ainda não atingiu o teto e ainda não é apadrinhada por este e-mail
        openChildren.sort((a, b) => a.sponsorsCount - b.sponsorsCount || a.name.localeCompare(b.name));
        const target = openChildren.find(
          c => c.sponsorsCount < metrics.maxSponsorsPerChild && (!cleanEmail || !c.sponsorEmails.has(cleanEmail))
        );
        if (!target) continue;

        let saved = false;
        if (pending.sponsorshipId) {
          const { data: updated, error } = await supabase
            .from('sponsorships')
            .update({
              child_id: target.id,
              status: 'active',
              last_sponsored_at: new Date().toISOString()
            })
            .eq('id', pending.sponsorshipId)
            .select();

          if (!error && updated && updated.length > 0) {
            saved = true;
          }
        }

        if (!saved) {
          const { error: insErr } = await supabase
            .from('sponsorships')
            .insert([{
              child_id: target.id,
              sponsor_id: pending.userId || null,
              donor_name: pending.name,
              donor_email: cleanEmail || null,
              donor_phone: pending.phone || null,
              monthly_amount: pending.monthly_amount || metrics.quotaCost,
              quotas_count: 1,
              status: 'active',
              payment_method: 'credit_card',
              last_sponsored_at: new Date().toISOString()
            }]);

          if (!insErr) {
            saved = true;
          }
        }

        if (saved) {
          target.sponsorsCount += 1;
          if (cleanEmail) target.sponsorEmails.add(cleanEmail);
          linkedCount += 1;
        }
      }

      return { linkedCount };
    } catch (err) {
      console.warn('Erro ao vincular padrinhos pendentes automaticamente:', err);
      return { linkedCount: 0 };
    }
  },

  /**
   * Processa a Alta do programa de nutrição de uma criança:
   * - A criança sai do programa ativo (sponsorship_status = 'graduated')
   * - O vínculo anterior do(s) padrinho(s) passa para 'graduated' (mantendo o histórico da criança para o padrinho)
   * - Entra automaticamente outra criança disponível (respeitando maxSponsorsPerChild) no apadrinhamento de cada padrinho,
   *   ou fica em "Aguardando na fila" (child_id: null) se não houver vaga no momento.
   */
  async handleChildDischarge(childId: string): Promise<{ transitionedCount: number }> {
    if (!childId) return { transitionedCount: 0 };
    try {
      // 1. Marca a criança como graduada (se a coluna existir no banco)
      try {
        await supabase
          .from('children')
          .update({ sponsorship_status: 'graduated' })
          .eq('id', childId);
      } catch {}

      // 2. Busca apadrinhamentos ativos dessa criança
      const { data: activeRows, error: fetchErr } = await supabase
        .from('sponsorships')
        .select('*')
        .eq('child_id', childId)
        .eq('status', 'active');

      if (fetchErr || !activeRows || activeRows.length === 0) {
        return { transitionedCount: 0 };
      }

      // 3. Obtém métricas atualizadas (a criança recém-graduada já não entra como elegível)
      const metrics = await this.getMetrics();
      const openChildren = metrics.children
        .filter(c => c.id !== childId && c.sponsorsCount < metrics.maxSponsorsPerChild)
        .map(c => ({
          ...c,
          sponsorEmails: new Set(c.sponsors.map(s => (s.email || '').toLowerCase().trim()).filter(Boolean))
        }));

      let transitionedCount = 0;

      for (const oldSp of activeRows) {
        // Marca o vínculo anterior como 'graduated' (mantém o histórico da criança para o padrinho)
        await supabase
          .from('sponsorships')
          .update({ status: 'graduated' })
          .eq('id', oldSp.id);

        const cleanEmail = (oldSp.donor_email || '').toLowerCase().trim();
        openChildren.sort((a, b) => a.sponsorsCount - b.sponsorsCount || a.name.localeCompare(b.name));
        const nextChild = openChildren.find(
          c => c.sponsorsCount < metrics.maxSponsorsPerChild && (!cleanEmail || !c.sponsorEmails.has(cleanEmail))
        );

        const newRecord: any = {
          child_id: nextChild ? nextChild.id : null,
          sponsor_id: oldSp.sponsor_id || null,
          donor_name: oldSp.donor_name || null,
          donor_email: oldSp.donor_email || null,
          donor_phone: oldSp.donor_phone || null,
          monthly_amount: oldSp.monthly_amount || metrics.quotaCost,
          quotas_count: 1,
          status: 'active',
          payment_method: oldSp.payment_method || 'credit_card',
          last_sponsored_at: new Date().toISOString(),
          stripe_subscription_id: oldSp.stripe_subscription_id || null,
          stripe_customer_id: oldSp.stripe_customer_id || null,
          plan_months: oldSp.plan_months || null,
          package_amount: oldSp.package_amount || null,
          started_at: oldSp.started_at || null,
          expires_at: oldSp.expires_at || null,
          renewal_declined: false
        };

        const { error: insErr } = await supabase.from('sponsorships').insert([newRecord]);
        if (insErr) {
          await supabase.from('sponsorships').insert([{
            child_id: nextChild ? nextChild.id : null,
            sponsor_id: oldSp.sponsor_id || null,
            donor_name: oldSp.donor_name || null,
            donor_email: oldSp.donor_email || null,
            donor_phone: oldSp.donor_phone || null,
            monthly_amount: oldSp.monthly_amount || metrics.quotaCost,
            quotas_count: 1,
            status: 'active',
            payment_method: oldSp.payment_method || 'credit_card',
            last_sponsored_at: new Date().toISOString()
          }]);
        }

        if (nextChild) {
          nextChild.sponsorsCount += 1;
          if (cleanEmail) nextChild.sponsorEmails.add(cleanEmail);
        }
        transitionedCount += 1;
      }

      return { transitionedCount };
    } catch (err) {
      console.warn('Erro ao processar alta da criança nos apadrinhamentos:', err);
      return { transitionedCount: 0 };
    }
  },

  /**
   * Verifica se um e-mail já possui conta cadastrada no Supabase
   */
  async isUserRegistered(email: string): Promise<boolean> {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return false;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', cleanEmail)
        .limit(1)
        .maybeSingle();

      if (error || !data) return false;
      return Boolean(data.id);
    } catch (e) {
      return false;
    }
  },

  /**
   * Dispara o e-mail oficial de agradecimento e apresentação da(s) criança(s) apadrinhada(s).
   * Se já cadastrado: inclui botão direto para o Portal do Mantenedor.
   * Se não cadastrado: inclui link de ativação/cadastro de senha no site.
   */
  async sendSponsorshipWelcomeEmail(
    email: string,
    name: string,
    children: ChildSponsorshipDetail[],
    monthlyAmount: number,
    isRegistered?: boolean,
    forceSend: boolean = false,
    options?: { paymentMethod?: string; planMonths?: number; expiresAt?: string | null }
  ): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    if (isRegistered === undefined) {
      isRegistered = await this.isUserRegistered(cleanEmail);
    }

    const appOrigin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://yahhope.org';

    const count = children.length;
    const isMultiple = count > 1;

    // Constrói cards de apresentação de cada criança
    const childrenCardsHtml = children.map((c, index) => {
      const photoSrc = c.photo_url && c.photo_url.trim().length > 0 
        ? c.photo_url 
        : 'https://www.yahhope.com/logo-black.png';

      const genderBadge = c.gender === 'F' ? 'Menina' : 'Menino';

      return `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="background-color: #0f172a; padding: 12px 20px; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #F49853;">
              ${isMultiple ? `Criança Apadrinhada #${index + 1}` : 'Seu Novo Afilhado(a)'}
            </span>
            <span style="font-size: 11px; background-color: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 12px; font-weight: 600;">
              Casa Nutri • Moçambique
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; padding: 20px;">
            <tr>
              <td style="width: 130px; vertical-align: top; padding: 20px 0 20px 20px;">
                <img 
                  src="${photoSrc}" 
                  alt="${c.name}" 
                  style="width: 115px; height: 115px; object-fit: cover; border-radius: 16px; border: 3px solid #F49853; display: block;" 
                />
              </td>
              <td style="vertical-align: top; padding: 20px 20px 20px 16px;">
                <div style="display: inline-block; background-color: #fff7ed; color: #ea580c; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 10px; border-radius: 20px; margin-bottom: 6px;">
                  ${genderBadge} • ${c.ageText}
                </div>
                <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
                  ${c.name}
                </h3>
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; font-weight: 600;">
                  📍 ${c.community || 'Casa Nutri - Nampula'}
                </p>
                <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.55;">
                  ${c.story || 'Acompanhada com muito amor e carinho pela equipe clínica da Casa Nutri em Moçambique, recebendo fórmula terapêutica, alimentação balanceada e exames regulares.'}
                </p>
              </td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 12px 20px; font-size: 12px; color: #475569;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #475569;">🍲 <strong>Nutrição Terapêutica:</strong> Alimentação balanceada diária</td>
                <td style="text-align: right; color: #10b981; font-weight: 700;">✓ Acompanhamento Ativo</td>
              </tr>
            </table>
          </div>
        </div>
      `;
    }).join('');

    // Seção de Ação (CTA) condicionada se o usuário já é cadastrado ou não
    let actionCtaHtml = '';
    if (isRegistered) {
      actionCtaHtml = `
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 22px; margin: 28px 0; text-align: center;">
          <p style="margin: 0 0 6px 0; color: #065f46; font-size: 16px; font-weight: 900;">
            ✨ Seu Acesso de Padrinho Já Está Ativo!
          </p>
          <p style="margin: 0 0 18px 0; color: #047857; font-size: 13px; line-height: 1.5;">
            Identificamos que você já possui cadastro na nossa plataforma. Sua(s) criança(s) apadrinhada(s) já foram vinculadas automaticamente ao seu perfil de mantenedor!
          </p>
          <a href="${appOrigin}/portal/sponsorship" style="background-color: #F49853; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(244,152,83,0.35);">
            Acessar Minhas Crianças no Portal →
          </a>
        </div>
      `;
    } else {
      actionCtaHtml = `
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 22px; margin: 28px 0; text-align: center;">
          <p style="margin: 0 0 6px 0; color: #9a3412; font-size: 16px; font-weight: 900;">
            🔐 Crie sua Senha de Acesso ao Portal
          </p>
          <p style="margin: 0 0 18px 0; color: #c2410c; font-size: 13px; line-height: 1.5;">
            Como este é o seu primeiro apoio, clique no botão abaixo para criar sua senha de acesso e liberar o Portal do Mantenedor. Seu e-mail (<strong>${cleanEmail}</strong>) já foi pré-aprovado!
          </p>
          <a href="${appOrigin}/login?tab=register&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(name)}" style="background-color: #F49853; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(244,152,83,0.35);">
            Ativar Minha Conta de Padrinho →
          </a>
          <p style="margin: 12px 0 0 0; color: #9a3412; font-size: 11px;">
            Acesso exclusivo para mantenedores e padrinhos da YAH Hope.
          </p>
        </div>
      `;
    }

    // Busca o template configurado em Comunicação > E-mails ('new_sponsor')
    let templateData: any = null;
    try {
      const { data: tpl } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', 'new_sponsor')
        .maybeSingle();
      templateData = tpl;
    } catch (e) {
      console.warn('Aviso ao buscar template new_sponsor:', e);
    }

    const isPix = String(options?.paymentMethod || '').toLowerCase().includes('pix');
    const planMonths = options?.planMonths || 1;
    const expiresAtStr = options?.expiresAt
      ? new Date(options.expiresAt).toLocaleDateString('pt-BR')
      : null;

    if (templateData && templateData.is_active === false && !forceSend && !isPix) {
      console.log('Envio de e-mail de padrinho ignorado: template new_sponsor está desativado.');
      return;
    }

    const pixPackageInfoHtml = isPix && planMonths > 1
      ? `
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 14px; padding: 16px; margin: 18px 0; font-size: 13px; color: #9a3412;">
          <strong>Pacote PIX de ${planMonths} Meses Registrado</strong><br/>
          Valor do pacote: <strong>R$ ${monthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          ${expiresAtStr ? ` • Vigente até <strong>${expiresAtStr}</strong>` : ''}
        </div>
      `
      : '';

    const childrenNames = children.map(c => c.name).filter(Boolean).join(', ');
    const defaultSubject = 'Bem-vindo à família YAH Hope! 🧡 Finalize seu cadastro';
    const defaultPreheader = 'Seu apoio como padrinho e mantenedor transforma vidas.';
    const defaultHeading = 'Obrigado por se tornar um padrinho!';
    const defaultBody = `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>Estamos muito felizes em receber você como mantenedor e apadrinhador! Seu apoio será fundamental para garantir alimentação, desenvolvimento e cuidado diário para as crianças.</p><p><br></p><p>Para acompanhar as fotos da criança atendida, novidades e relatórios de transparência, finalize o seu cadastro no portal criando sua senha:</p><p><br></p><p>Com profunda gratidão,<br>Equipe YAH Hope</p>`;

    const emailSubject = (templateData?.subject || defaultSubject)
      .replace(/{{nome_doador}}/gi, name || 'Amigo(a)')
      .replace(/{{nome}}/gi, name || 'Amigo(a)')
      .replace(/{{nome_crianca}}/gi, childrenNames || 'sua criança apadrinhada');

    const emailHeading = (templateData?.heading || defaultHeading)
      .replace(/{{nome_doador}}/gi, name || 'Amigo(a)')
      .replace(/{{nome}}/gi, name || 'Amigo(a)')
      .replace(/{{nome_crianca}}/gi, childrenNames || 'sua criança apadrinhada');

    const emailPreheader = templateData?.preheader || defaultPreheader;

    const rawBody = (templateData?.body || defaultBody)
      .replace(/{{nome_doador}}/gi, name || 'Amigo(a)')
      .replace(/{{nome}}/gi, name || 'Amigo(a)')
      .replace(/{{email}}/gi, cleanEmail)
      .replace(/{{nome_crianca}}/gi, childrenNames || 'sua criança apadrinhada');

    const htmlBody = `${rawBody}${pixPackageInfoHtml}${childrenCardsHtml ? `<div style="margin-top: 24px;">${childrenCardsHtml}</div>` : ''}`;

    const hasCta = true;
    const ctaText = isRegistered
      ? (templateData?.cta_text || 'Acessar Minhas Crianças no Portal')
      : (templateData?.cta_text || 'Finalizar Cadastro de Padrinho');
    const baseCtaUrl = isRegistered
      ? `${appOrigin}/portal/sponsorship`
      : (templateData?.cta_url || `${appOrigin}/finalizar-cadastro`);
    const sep = baseCtaUrl.includes('?') ? '&' : '?';
    const ctaUrl = (baseCtaUrl.includes('cadastro') || baseCtaUrl.includes('finalizar') || baseCtaUrl.includes('portal') || baseCtaUrl.includes('set-password'))
      ? `${baseCtaUrl}${sep}email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(name)}`
      : baseCtaUrl;

    // Envia o e-mail transacional de apadrinhamento diretamente para o padrinho (NUNCA aciona send-accountability)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) {
        if (forceSend) throw new Error('Configuração do Supabase não encontrada.');
        return;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/send-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify({
          isTransactional: true,
          to: cleanEmail,
          recipientName: name,
          subject: emailSubject,
          heading: emailHeading,
          preheader: emailPreheader,
          body_html: htmlBody,
          has_cta: hasCta,
          cta_text: ctaText,
          cta_url: ctaUrl,
          sender_name: 'YAH Hope',
          sender_email: 'contato@yahhope.com',
          dispatchSource: forceSend ? 'manual' : 'automatico',
          dispatchTitle: forceSend
            ? `[Manual] Boas-vindas Padrinho (${name})`
            : isPix
              ? `[Automático PIX ${planMonths}m] Boas-vindas Padrinho (${name})`
              : `[Automático] Boas-vindas Padrinho (${name})`
        })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.error || errBody?.message || `Erro HTTP ${res.status}`;
        if (forceSend) throw new Error(msg);
        console.warn('Aviso ao enviar e-mail de apadrinhamento via edge function:', msg);
      }
    } catch (e) {
      if (forceSend) throw e;
      console.warn('Fallback de e-mail de apadrinhamento:', e);
    }
  },

  /**
   * Envia e-mail de boas-vindas e acesso ao portal para Mantenedor Geral (ex: via PIX).
   */
  async sendMaintainerAccessEmail(
    email: string,
    name: string,
    monthlyAmount: number,
    paymentMethod: string = 'pix'
  ): Promise<void> {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    const isRegistered = await this.isUserRegistered(cleanEmail);
    const appOrigin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://yahhope.org';

    const ctaUrl = isRegistered
      ? `${appOrigin}/portal/dashboard`
      : `${appOrigin}/finalizar-cadastro?email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(name || 'Mantenedor')}`;
    const ctaText = isRegistered ? 'Acessar Portal do Mantenedor' : 'Finalizar Cadastro e Criar Senha';

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) return;

      await fetch(`${supabaseUrl}/functions/v1/send-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify({
          isTransactional: true,
          to: cleanEmail,
          recipientName: name || 'Mantenedor YAH Hope',
          subject: 'Bem-vindo à família YAH Hope! 🧡 Seu acesso ao Portal do Mantenedor',
          heading: 'Obrigado por se tornar um mantenedor!',
          preheader: 'Seu apoio mensal sustenta a Casa Nutri e transforma vidas.',
          body_html: `
            <p>Olá <strong>${name || 'Amigo(a)'}</strong>,</p>
            <p>Estamos muito felizes em receber você como mantenedor da YAH Hope (R$ ${monthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via ${paymentMethod.toUpperCase()})!</p>
            <p>No Portal do Mantenedor você acompanha as atualizações gerais do projeto, relatórios de impacto e transparência.</p>
            <p>Clique no botão abaixo para acessar ou finalizar seu cadastro criando sua senha:</p>
          `,
          has_cta: true,
          cta_text: ctaText,
          cta_url: ctaUrl,
          sender_name: 'YAH Hope',
          sender_email: 'contato@yahhope.com',
          dispatchSource: 'automatico',
          dispatchTitle: `[Automático PIX] Acesso Mantenedor (${name || cleanEmail})`
        })
      });
    } catch (e) {
      console.warn('Aviso ao enviar e-mail de acesso ao mantenedor:', e);
    }
  },

  /**
   * Disparo manual pelo painel administrativo para padrinhos que já apadrinharam
   * e ainda não receberam o e-mail de boas-vindas com a(s) criança(s) vinculada(s).
   */
  async sendManualSponsorshipEmail(email: string, name: string): Promise<{ success: boolean; childrenCount: number; error?: string }> {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, childrenCount: 0, error: 'E-mail do padrinho inválido.' };
    }

    try {
      const { data: spRows, error: spErr } = await supabase
        .from('sponsorships')
        .select('id, child_id, monthly_amount, status, children(*)')
        .ilike('donor_email', cleanEmail)
        .not('child_id', 'is', null);

      if (spErr) {
        throw new Error(spErr.message);
      }

      const seenChildIds = new Set<string>();
      const childrenDetails: ChildSponsorshipDetail[] = [];
      let totalAmount = 0;

      (spRows || []).forEach((row: any) => {
        const st = String(row.status || 'active').toLowerCase().trim();
        if (st === 'canceled' || st === 'cancelled' || st === 'inactive' || st === 'replaced') return;
        
        totalAmount += Math.max(90, Number(row.monthly_amount) || 90);
        const c = row.children;
        if (c && c.id && !seenChildIds.has(c.id)) {
          seenChildIds.add(c.id);
          childrenDetails.push({
            id: c.id,
            name: c.name,
            dob: c.dob,
            ageText: calculateChildAge(c.dob),
            gender: c.gender,
            community: c.address || c.province || 'Casa Nutri - Nampula',
            photo_url: c.photo_url || '',
            story: c.story || 'Acompanhada com muito amor pela equipe clínica da Casa Nutri em Moçambique, recebendo suplementação e alimentação balanceada.',
            sponsorsCount: 1,
            maxSponsors: 2,
            isFull: false,
            sponsors: []
          });
        }
      });

      if (childrenDetails.length === 0) {
        return {
          success: false,
          childrenCount: 0,
          error: 'Este padrinho ainda não possui nenhuma criança real vinculada no banco de dados. Vincule uma criança antes de enviar o e-mail.'
        };
      }

      await this.sendSponsorshipWelcomeEmail(
        cleanEmail,
        name || cleanEmail.split('@')[0],
        childrenDetails,
        totalAmount,
        undefined,
        true
      );

      return { success: true, childrenCount: childrenDetails.length };
    } catch (err: any) {
      return {
        success: false,
        childrenCount: 0,
        error: err.message || 'Falha ao enviar e-mail manualmente.'
      };
    }
  },

  /**
   * Reconciliação e Auto-Atribuição de Criança para Padrinhos com Cota Pendente de Vínculo:
   * 1. Verifica se há apadrinhamentos na tabela 'sponsorships' de valor >= R$ 90 SEM child_id atribuída.
   * 2. Se o padrinho JÁ POSSUI criança atribuída, NUNCA altera ou sobrescreve a criança existente.
   * 3. Mantenedores de apoio geral (R$ 50) NUNCA recebem atribuição automática de criança.
   */
  async autoReconcilePaidSponsor(
    userId?: string, 
    userEmail?: string, 
    userName?: string,
    forceAssign: boolean = false
  ): Promise<ChildSponsorshipDetail[]> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail && !userId) return [];

    try {
      // Busca apadrinhamentos ativos do usuário
      let queryBySponsorId: any = null;
      let queryByEmail: any = null;

      if (userId) {
        queryBySponsorId = await supabase
          .from('sponsorships')
          .select('*, children(*)')
          .eq('sponsor_id', userId)
          .in('status', ['active', 'paid', 'completed', 'ACTIVE']);
      }

      if (cleanEmail) {
        queryByEmail = await supabase
          .from('sponsorships')
          .select('*, children(*)')
          .ilike('donor_email', cleanEmail)
          .in('status', ['active', 'paid', 'completed', 'ACTIVE']);
      }

      let latestReconcileDonationIso: string | undefined;
      if (cleanEmail) {
        const { data: userDonRows } = await supabase
          .from('donations')
          .select('paid_at, created_at, status')
          .ilike('donor_email', cleanEmail)
          .order('created_at', { ascending: false })
          .limit(5);
        (userDonRows || []).forEach((d: any) => {
          const dSt = String(d.status || 'paid').toLowerCase().trim();
          if (dSt === 'failed' || dSt === 'canceled' || dSt === 'cancelled') return;
          const dt = d.paid_at || d.created_at;
          if (dt && (!latestReconcileDonationIso || new Date(dt).getTime() > new Date(latestReconcileDonationIso).getTime())) {
            latestReconcileDonationIso = dt;
          }
        });
      }

      const combinedSp: any[] = [];
      const seenIds = new Set<string>();
      [...(queryBySponsorId?.data || []), ...(queryByEmail?.data || [])].forEach((item: any) => {
        if (!seenIds.has(item.id)) {
          const st = String(item.status || 'active').toLowerCase().trim();
          if (st === 'canceled' || st === 'cancelled' || st === 'inactive' || st === 'replaced' || st === 'expired') {
            return;
          }
          const validity = evaluateSponsorshipValidity(item, cleanEmail, latestReconcileDonationIso);
          if (validity.isExpired) {
            return;
          }
          seenIds.add(item.id);
          combinedSp.push(item);
        }
      });

      // Calcula a quantidade de cotas que o apoiador tem direito:
      // REGRA: Se o valor for > R$ 90,00, a pessoa DEVE receber mais de uma criança!
      const amounts = combinedSp.map(r => Number(r.monthly_amount || 0));
      const maxMonthlyAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
      const totalMonthlyAmount = amounts.reduce((acc, v) => acc + v, 0);
      const effectiveAmount = Math.max(maxMonthlyAmount, totalMonthlyAmount);

      // REGRA: Criança acompanhada a cada múltiplo inteiro de R$ 90 (90 = 1, 180 = 2, 270 = 3...).
      // Valores excedentes (ex: 95 -> 90 cota + 5 fundo geral) apoiam o projeto como um todo.
      const targetQuotaCount = Math.floor(effectiveAmount / 90);

      const alreadyAssignedRows = combinedSp.filter(r => r.child_id);
      
      // Se já atingiu a cota de crianças e não estamos forçando nova atribuição, mantém intacto
      if (alreadyAssignedRows.length >= targetQuotaCount && !forceAssign) {
        console.log(`[AutoReconcile] Padrinho já possui crianças vinculadas suficientes (${alreadyAssignedRows.length}/${targetQuotaCount}). Mantendo atribuição intacta.`);
        return [];
      }

      // Se não tem cota mínima de apadrinhamento (ex: mantenedor de R$ 50), não atribui
      if (targetQuotaCount === 0) {
        return [];
      }

      const assignedChildIds = new Set(alreadyAssignedRows.map(r => r.child_id));
      const metrics = await this.getMetrics();
      const availableChildren = metrics.children
        .filter(c => !c.isFull && !assignedChildIds.has(c.id))
        .sort((a, b) => a.sponsorsCount - b.sponsorsCount);

      const neededCount = targetQuotaCount - alreadyAssignedRows.length;
      const unassignedRows = combinedSp.filter(r => !r.child_id && Number(r.monthly_amount || 0) >= 90);
      const newlyAssignedChildren: ChildSponsorshipDetail[] = [];

      for (let i = 0; i < neededCount; i++) {
        const targetChild = availableChildren[i];
        if (!targetChild) break;
        assignedChildIds.add(targetChild.id);

        const unassignedRow = unassignedRows[i];
        if (unassignedRow) {
          await supabase
            .from('sponsorships')
            .update({ 
              child_id: targetChild.id,
              last_sponsored_at: new Date().toISOString()
            })
            .eq('id', unassignedRow.id)
            .is('child_id', null);

          newlyAssignedChildren.push({
            ...targetChild,
            sponsorshipId: unassignedRow.id
          });
        } else {
          // Insere linha adicional para a nova cota da criança
          const { data: insertedSp } = await supabase
            .from('sponsorships')
            .insert({
              child_id: targetChild.id,
              sponsor_id: userId || null,
              donor_name: userName || 'Padrinho YAH Hope',
              donor_email: cleanEmail,
              monthly_amount: 90,
              quotas_count: 1,
              status: 'active',
              payment_method: 'credit_card',
              last_sponsored_at: new Date().toISOString()
            })
            .select()
            .single();

          newlyAssignedChildren.push({
            ...targetChild,
            sponsorshipId: insertedSp?.id
          });
        }
      }

      if (newlyAssignedChildren.length > 0 && cleanEmail) {
        const existingCached = localStorage.getItem(`yah_sponsored_children_${cleanEmail}`);
        let currentList: any[] = [];
        try {
          if (existingCached) currentList = JSON.parse(existingCached);
        } catch (e) {}
        const merged = [...currentList, ...newlyAssignedChildren];
        const uniqueMerged = Array.from(new Map(merged.map(c => [c.id, c])).values());
        localStorage.setItem(`yah_sponsored_children_${cleanEmail}`, JSON.stringify(uniqueMerged));
        return uniqueMerged;
      }
    } catch (e) {
      console.error('[AutoReconcile] Erro ao reconciliar cota do padrinho:', e);
    }

    return [];
  },

  /**
   * Retorna as crianças apadrinhadas pelo usuário autenticado (por ID ou E-mail),
   * sincronizando banco de dados Supabase e cache local resiliente.
   * Auto-vincula a criança caso o registro de apadrinhamento ainda esteja sem child_id.
   */
  async getSponsoredChildrenForUser(
    userId?: string, 
    userEmail?: string,
    userName?: string
  ): Promise<ChildSponsorshipDetail[]> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!userId && !cleanEmail) return [];

    let dbChildren: ChildSponsorshipDetail[] = [];
    let hasUnassignedRow = false;
    let dbFetchSucceeded = false;
    const combinedData: any[] = [];

    try {
      // Fazemos busca por sponsor_id e por donor_email de forma segura
      let queryBySponsorId: any = null;
      let queryByEmail: any = null;

      if (userId) {
        queryBySponsorId = await supabase
          .from('sponsorships')
          .select('*, children(*)')
          .eq('sponsor_id', userId);
      }

      if (cleanEmail) {
        queryByEmail = await supabase
          .from('sponsorships')
          .select('*, children(*)')
          .ilike('donor_email', cleanEmail);
      }

      // Busca também a data da última doação paga para evitar inativar padrinho que renovou ou doou recentemente
      let latestUserDonationIso: string | undefined;
      if (cleanEmail) {
        const { data: userDonRows } = await supabase
          .from('donations')
          .select('paid_at, created_at, status')
          .ilike('donor_email', cleanEmail)
          .order('created_at', { ascending: false })
          .limit(5);
        (userDonRows || []).forEach((d: any) => {
          const dSt = String(d.status || 'paid').toLowerCase().trim();
          if (dSt === 'failed' || dSt === 'canceled' || dSt === 'cancelled') return;
          const dt = d.paid_at || d.created_at;
          if (dt && (!latestUserDonationIso || new Date(dt).getTime() > new Date(latestUserDonationIso).getTime())) {
            latestUserDonationIso = dt;
          }
        });
      }

      const seenSpIds = new Set<string>();

      [...(queryBySponsorId?.data || []), ...(queryByEmail?.data || [])].forEach((item: any) => {
        if (!seenSpIds.has(item.id)) {
          const st = String(item.status || 'active').toLowerCase().trim();
          const isGraduatedRow = st === 'graduated' || st === 'discharged';
          if (st !== 'canceled' && st !== 'cancelled' && st !== 'inactive' && st !== 'replaced' && st !== 'expired') {
            const validity = evaluateSponsorshipValidity(item, cleanEmail, latestUserDonationIso);
            // Se o pacote PIX venceu ou o usuário optou por não renovar, ele não acompanha mais a criança ativa
            // (Exceto registros históricos de alta do programa de nutrição, que permanecem no histórico)
            if (!validity.isExpired || isGraduatedRow) {
              seenSpIds.add(item.id);
              combinedData.push({ ...item, _validity: validity, _isGraduated: isGraduatedRow });
            }
          }
        }
      });

      if (combinedData.length > 0) {
        // Coleta todos os child_ids dos apadrinhamentos para lookup direto e seguro
        const childIdsToFetch = combinedData.map(item => item.child_id).filter(Boolean);

        const directChildrenMap = new Map<string, any>();
        if (childIdsToFetch.length > 0) {
          const { data: directChildren } = await supabase
            .from('children')
            .select('*')
            .in('id', childIdsToFetch);
          (directChildren || []).forEach(c => directChildrenMap.set(c.id, c));
        }

        const withChildren = combinedData.filter(item => item.child_id);
        dbChildren = withChildren.map(item => {
          let c = item.children;
          if (Array.isArray(c)) c = c[0];
          if (!c || !c.name) c = directChildrenMap.get(item.child_id) || {};

          const childName = c.name || 'Jesica Afito';
          const childId = c.id || item.child_id;
          const val = item._validity || evaluateSponsorshipValidity(item, cleanEmail);
          const isGraduated = Boolean(item._isGraduated || String(c.sponsorship_status || '').toLowerCase() === 'graduated');

          return {
            id: childId,
            sponsorshipId: item.id,
            name: childName,
            dob: c.dob || '2023-01-01',
            ageText: calculateChildAge(c.dob || '2023-01-01'),
            gender: c.gender || 'F',
            community: c.address || c.province || c.community || 'Casa Nutri',
            photo_url: c.photo_url || '',
            story: c.story || 'Acompanhada com amor e acompanhamento nutricional intensivo na Casa Nutri.',
            nutritional_status: isGraduated ? 'Alta do programa de nutrição' : (c.status || 'Adequado'),
            sponsorsCount: 1,
            maxSponsors: 2,
            isFull: false,
            paymentMethod: item.payment_method || 'credit_card',
            planMonths: val.planMonths,
            packageAmount: val.packageAmount,
            startedAt: val.startedAt,
            expiresAt: val.expiresAt,
            daysRemaining: val.daysRemaining,
            isExpiringSoon: val.isExpiringSoon,
            isExpired: val.isExpired,
            isGraduated,
            graduatedAt: isGraduated ? (item.last_sponsored_at || item.updated_at || null) : null,
            sponsors: []
          };
        }).sort((a, b) => Number(Boolean(a.isGraduated)) - Number(Boolean(b.isGraduated)));

        // Auto-vincula sponsor_id se existir userId mas o registro estava sem sponsor_id (blinda RLS)
        if (userId) {
          const missingSponsorIds = combinedData.filter(item => !item.sponsor_id).map(item => item.id);
          if (missingSponsorIds.length > 0) {
            supabase.from('sponsorships').update({ sponsor_id: userId }).in('id', missingSponsorIds).then(() => {});
          }
        }

        // Identifica se o usuário tem cota de apadrinhamento de criança (>= 90) sem criança vinculada
        const unassigned = combinedData.filter(item => !item.child_id && Number(item.monthly_amount || 0) >= 90);
        if (unassigned.length > 0 && dbChildren.length === 0) {
          hasUnassignedRow = true;
        }
      }
      dbFetchSucceeded = true;
    } catch (err) {
      console.warn('Aviso ao consultar apadrinhamentos no Supabase:', err);
    }

    // A base de dados do Supabase é a fonte da verdade:
    // Só usa cache local se a consulta ao banco falhou (offline/erro de rede).
    const mergedMap = new Map<string, ChildSponsorshipDetail>();
    dbChildren.forEach(c => {
      if (c && c.id) mergedMap.set(c.id, c);
    });

    if (!dbFetchSucceeded && mergedMap.size === 0 && cleanEmail) {
      try {
        const raw = localStorage.getItem(`yah_sponsored_children_${cleanEmail}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(c => {
              if (c && c.id && !mergedMap.has(c.id)) {
                mergedMap.set(c.id, c);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Aviso ao ler cache local de crianças:', e);
      }
    }

    let result = Array.from(mergedMap.values());

    // REGRA: Criança acompanhada a cada múltiplo de R$ 90 (90 = 1, 180 = 2, 270 = 3...):
    const amounts = combinedData.map(item => Number(item.monthly_amount || 0));
    const effectiveAmount = amounts.length > 0 ? Math.max(...amounts, amounts.reduce((a, b) => a + b, 0)) : 0;
    const expectedChildrenCount = Math.floor(effectiveAmount / 90);

    // Auto-atribui se o usuário tiver cotas pendentes ou se tiver doação > 90 e ainda não tiver recebido todas as crianças:
    if ((hasUnassignedRow || (expectedChildrenCount > result.length && expectedChildrenCount > 0))) {
      try {
        const reconciled = await this.autoReconcilePaidSponsor(userId, cleanEmail, userName, false);
        if (reconciled && reconciled.length > 0) {
          result = reconciled;
        }
      } catch (e) {
        console.warn('Aviso na auto-reconciliação:', e);
      }
    }

    if (cleanEmail) {
      try {
        if (result.length > 0) {
          localStorage.setItem(`yah_sponsored_children_${cleanEmail}`, JSON.stringify(result));
        } else if (dbFetchSucceeded) {
          localStorage.removeItem(`yah_sponsored_children_${cleanEmail}`);
        }
      } catch (e) {}
    }

    return result;
  },

  /**
   * Obtém o resumo consolidado dos compromissos mensais do apoiador:
   * 1. Apoio Mensal Geral (Casa Nutri)
   * 2. Apadrinhamento de Crianças (R$ 90/cota)
   */
  async getSupporterCommitments(
    userId?: string, 
    userEmail?: string, 
    userName?: string
  ): Promise<SupporterCommitmentSummary> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    const settings = await fetchAndSyncOrgSettings();
    const quotaCost = Number(settings.sponsorship_quota_cost) || 90;

    // 1. Busca crianças apadrinhadas ativas
    const children = await this.getSponsoredChildrenForUser(userId, cleanEmail, userName);
    const childCount = children.length;
    const childTotalMonthly = childCount * quotaCost;

    // 2. Busca apoio mensal geral no banco ou cache local
    let generalSupport: SupporterGeneralSupport = {
      active: false,
      monthlyAmount: 0,
      paymentMethod: 'pix'
    };

    if (cleanEmail) {
      try {
        // Tenta ler do localStorage primeiro
        const localKey = `yah_hope_general_monthly_${cleanEmail}`;
        const cached = localStorage.getItem(localKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (typeof parsed === 'object' && parsed !== null) {
              generalSupport = {
                active: Boolean(parsed.active),
                monthlyAmount: Number(parsed.monthlyAmount) || 0,
                paymentMethod: parsed.paymentMethod || 'pix',
                updatedAt: parsed.updatedAt
              };
            }
          } catch (e) {
            console.warn('Erro ao ler cache local de apoio mensal:', e);
          }
        }

        // Tenta sincronizar com tabela sponsorships (apoio geral onde child_id é nulo)
        let query = supabase
          .from('sponsorships')
          .select('*')
          .is('child_id', null)
          .eq('status', 'active');

        if (userId) {
          query = query.or(`sponsor_id.eq.${userId},donor_email.ilike.${cleanEmail}`);
        } else {
          query = query.ilike('donor_email', cleanEmail);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
        if (!error && data && data.length > 0) {
          const rec = data[0];
          generalSupport = {
            active: true,
            monthlyAmount: Number(rec.monthly_amount) || 100,
            paymentMethod: rec.payment_method || 'pix',
            updatedAt: rec.created_at
          };
          localStorage.setItem(localKey, JSON.stringify(generalSupport));
        }
      } catch (err) {
        console.warn('Aviso ao consultar apoio mensal geral:', err);
      }
    }

    const totalMonthlyCommitment = (generalSupport.active ? generalSupport.monthlyAmount : 0) + childTotalMonthly;

    return {
      generalMonthlySupport: generalSupport,
      childSponsorships: {
        count: childCount,
        quotaCost,
        totalMonthly: childTotalMonthly,
        children
      },
      totalMonthlyCommitment
    };
  },

  /**
   * Atualiza ou aumenta o Apoio Mensal Geral do mantenedor.
   * REGRA DE NEGÓCIO: O novo valor SUBSTITUI o valor anterior (NÃO SOMA).
   */
  async updateGeneralMonthlySupport(
    userId: string | undefined,
    userEmail: string,
    newAmount: number,
    paymentMethod: string = 'pix',
    donorName: string = 'Mantenedor YAH Hope'
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = userEmail.toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, message: 'E-mail do mantenedor não identificado.' };
    }

    const payload: SupporterGeneralSupport = {
      active: true,
      monthlyAmount: newAmount,
      paymentMethod,
      updatedAt: new Date().toISOString()
    };

    // Salva imediatamente no cache do mantenedor (garante responsividade imediata)
    const localKey = `yah_hope_general_monthly_${cleanEmail}`;
    localStorage.setItem(localKey, JSON.stringify(payload));

    try {
      // Desativa qualquer registro anterior de apoio geral
      await supabase
        .from('sponsorships')
        .update({ status: 'replaced' })
        .is('child_id', null)
        .or(`donor_email.ilike.${cleanEmail}${userId ? `,sponsor_id.eq.${userId}` : ''}`)
        .eq('status', 'active');

      // Insere o novo compromisso com o valor substituto atualizado
      await supabase.from('sponsorships').insert([{
        sponsor_id: userId || null,
        child_id: null,
        donor_name: donorName,
        donor_email: cleanEmail,
        monthly_amount: newAmount,
        quotas_count: 1,
        status: 'active',
        payment_method: paymentMethod,
        last_sponsored_at: new Date().toISOString()
      }]);

      return {
        success: true,
        message: `Seu apoio mensal foi atualizado com sucesso para R$ ${newAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês.`
      };
    } catch (err: any) {
      console.warn('Erro ao registrar no banco, mantendo persistência local:', err);
      return {
        success: true,
        message: `Seu apoio mensal foi atualizado para R$ ${newAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês.`
      };
    }
  },

  /**
   * Cancela o Apoio Mensal Geral do mantenedor.
   */
  async cancelGeneralMonthlySupport(
    userId?: string,
    userEmail?: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (cleanEmail) {
      const localKey = `yah_hope_general_monthly_${cleanEmail}`;
      localStorage.setItem(localKey, JSON.stringify({
        active: false,
        monthlyAmount: 0,
        paymentMethod: '',
        updatedAt: new Date().toISOString()
      }));

      try {
        await supabase
          .from('sponsorships')
          .update({ status: 'canceled' })
          .is('child_id', null)
          .or(`donor_email.ilike.${cleanEmail}${userId ? `,sponsor_id.eq.${userId}` : ''}`)
          .eq('status', 'active');
      } catch (err) {
        console.warn('Aviso ao cancelar apoio no banco:', err);
      }
    }

    return {
      success: true,
      message: 'Seu apoio mensal geral foi cancelado. Você pode reativá-lo a qualquer momento pelo portal.'
    };
  },

  /**
   * Cancela o apadrinhamento de uma criança específica.
   * Libera a vaga no sistema para outro padrinho e reduz o total mensal.
   */
  async cancelChildSponsorship(
    sponsorshipId?: string,
    childId?: string,
    userId?: string,
    userEmail?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (sponsorshipId) {
        const { error } = await supabase
          .from('sponsorships')
          .update({ status: 'canceled' })
          .eq('id', sponsorshipId);

        if (error) throw error;
      } else if (childId) {
        let query = supabase
          .from('sponsorships')
          .update({ status: 'canceled' })
          .eq('child_id', childId)
          .eq('status', 'active');

        const cleanEmail = (userEmail || '').toLowerCase().trim();
        if (userId && cleanEmail) {
          query = query.or(`sponsor_id.eq.${userId},donor_email.ilike.${cleanEmail}`);
        } else if (userId) {
          query = query.eq('sponsor_id', userId);
        } else if (cleanEmail) {
          query = query.ilike('donor_email', cleanEmail);
        }

        const { error } = await query;
        if (error) throw error;
      }

      // Atualiza também o cache local resiliente
      const cleanEmail = (userEmail || '').toLowerCase().trim();
      if (cleanEmail) {
        try {
          const cacheKey = `yah_sponsored_children_${cleanEmail}`;
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(c => 
                (childId ? c.id !== childId : true) && 
                (sponsorshipId ? c.sponsorshipId !== sponsorshipId : true)
              );
              localStorage.setItem(cacheKey, JSON.stringify(filtered));
            }
          }
        } catch (cacheErr) {
          console.warn('Aviso ao atualizar cache local após cancelamento:', cacheErr);
        }
      }

      return {
        success: true,
        message: 'O apadrinhamento desta criança foi cancelado com sucesso. A vaga foi liberada para acolhimento por outro padrinho.'
      };
    } catch (err: any) {
      console.error('Erro ao cancelar apadrinhamento de criança:', err);
      return {
        success: false,
        message: err.message || 'Erro ao processar cancelamento do apadrinhamento.'
      };
    }
  },

  /**
   * Regra de Privacidade e LGPD:
   * Verifica se o usuário autenticado tem permissão para ver notícias e atualizações de uma criança específica.
   */
  async canUserViewChildUpdates(
    childIdOrName: string,
    userId?: string,
    userEmail?: string,
    userRole?: string
  ): Promise<boolean> {
    // Administradores, médicos e equipe têm acesso irrestrito
    if (userRole && ['ADMIN', 'USER', 'STAFF', 'DOCTOR', 'NURSE', 'COORDINATOR'].includes(userRole)) {
      return true;
    }

    if (!childIdOrName || (!userId && !userEmail)) {
      return false;
    }

    const myChildren = await this.getSponsoredChildrenForUser(userId, userEmail);
    return myChildren.some(c => 
      c.id === childIdOrName || 
      c.name.toLowerCase().trim() === childIdOrName.toLowerCase().trim()
    );
  },

  /**
   * Vincula ou troca manualmente a criança de um padrinho (via Painel de Gestão).
   * 1. Salva a alteração na tabela 'sponsorships' no Supabase.
   * 2. O algoritmo de distribuição automática (Least-Sponsored Round-Robin)
   *    reconhece imediatamente a nova ocupação de vagas via getMetrics(),
   *    liberando a vaga da criança anterior e ocupando a vaga da nova criança.
   * 3. Sincroniza o papel do usuário (role = 'SPONSOR') e o cache local do Portal do Mantenedor.
   */
  async updateSponsorChild(params: {
    supporterId?: string;
    supporterEmail: string;
    supporterName?: string;
    supporterPhone?: string;
    sponsorshipId?: string;
    newChildId: string;
  }): Promise<{ success: boolean; message: string; error?: string; updatedSponsorship?: any }> {
    const cleanEmail = (params.supporterEmail || '').toLowerCase().trim();
    if (!cleanEmail && !params.supporterId) {
      return { success: false, message: 'Identificação do padrinho (e-mail ou ID) é obrigatória.' };
    }
    if (!params.newChildId) {
      return { success: false, message: 'A criança selecionada é inválida.' };
    }

    try {
      // 1. Busca dados da nova criança para validação e enriquecimento do cache
      let newChildData: any = null;
      try {
        const { data: cData } = await supabase
          .from('children')
          .select('*')
          .eq('id', params.newChildId)
          .maybeSingle();
        if (cData) newChildData = cData;
      } catch (e) {
        console.warn('Aviso ao consultar criança no banco:', e);
      }

      if (!newChildData) {
        console.warn('Criança não encontrada no banco para o ID:', params.newChildId);
      }

      // 2. Localiza o apadrinhamento existente
      let existingSponsorship: any = null;

      if (params.sponsorshipId) {
        const { data: byId } = await supabase
          .from('sponsorships')
          .select('*')
          .eq('id', params.sponsorshipId)
          .maybeSingle();
        if (byId) existingSponsorship = byId;
      }

      if (!existingSponsorship && cleanEmail) {
        const { data: byEmail } = await supabase
          .from('sponsorships')
          .select('*')
          .ilike('donor_email', cleanEmail)
          .order('created_at', { ascending: false })
          .limit(1);
        if (byEmail && byEmail.length > 0) existingSponsorship = byEmail[0];
      }

      if (!existingSponsorship && params.supporterId && !params.supporterId.startsWith('donor_')) {
        const { data: bySponsorId } = await supabase
          .from('sponsorships')
          .select('*')
          .eq('sponsor_id', params.supporterId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (bySponsorId && bySponsorId.length > 0) existingSponsorship = bySponsorId[0];
      }

      let savedRecord: any = null;

      // Garante o sponsor_id real de public.users pelo e-mail para blindar RLS no portal do padrinho
      let realSponsorId: string | null =
        params.supporterId && !params.supporterId.startsWith('donor_') ? params.supporterId : null;
      if (!realSponsorId && cleanEmail) {
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .ilike('email', cleanEmail)
          .maybeSingle();
        if (userRow?.id) realSponsorId = userRow.id;
      }

      // 3. Se já existe o apadrinhamento, atualiza child_id, ativa o vínculo e garante sponsor_id
      if (existingSponsorship?.id) {
        const updatePayload: any = {
          child_id: params.newChildId,
          status: 'active',
          last_sponsored_at: new Date().toISOString()
        };
        if (realSponsorId) updatePayload.sponsor_id = realSponsorId;

        const { data: updated, error: updateErr } = await supabase
          .from('sponsorships')
          .update(updatePayload)
          .eq('id', existingSponsorship.id)
          .select();

        if (updateErr) {
          console.error('Erro ao atualizar sponsorship:', updateErr);
          throw new Error(updateErr.message || 'Erro ao atualizar vínculo no banco');
        }
        if (!updated || updated.length === 0) {
          throw new Error('O banco de dados bloqueou a atualização do vínculo (RLS). Execute o script fix_sponsorship_manual_assignment_rls.sql no SQL Editor do Supabase.');
        }
        savedRecord = updated[0];
      } else {
        // 4. Se não existe registro em sponsorships, insere um novo
        const { data: inserted, error: insertErr } = await supabase
          .from('sponsorships')
          .insert([{
            child_id: params.newChildId,
            sponsor_id: params.supporterId && !params.supporterId.startsWith('donor_') ? params.supporterId : null,
            donor_name: params.supporterName || cleanEmail.split('@')[0],
            donor_email: cleanEmail,
            donor_phone: params.supporterPhone || null,
            monthly_amount: 90.00,
            quotas_count: 1,
            status: 'active',
            payment_method: 'credit_card',
            last_sponsored_at: new Date().toISOString()
          }])
          .select();

        if (insertErr) {
          console.error('Erro ao criar sponsorship:', insertErr);
          throw new Error(insertErr.message || 'Erro ao registrar novo vínculo');
        }
        savedRecord = inserted?.[0];
      }

      // 5. Assegura que o perfil do usuário em public.users esteja como 'SPONSOR'
      try {
        if (params.supporterId && !params.supporterId.startsWith('donor_')) {
          await supabase
            .from('users')
            .update({ role: 'SPONSOR' })
            .eq('id', params.supporterId);
        } else if (cleanEmail) {
          await supabase
            .from('users')
            .update({ role: 'SPONSOR' })
            .ilike('email', cleanEmail);
        }
      } catch (userRoleErr) {
        console.warn('Aviso ao sincronizar papel do usuário:', userRoleErr);
      }

      // 6. Atualiza o cache local do padrinho imediatamente
      if (cleanEmail && newChildData) {
        try {
          const cacheKey = `yah_sponsored_children_${cleanEmail}`;
          const childDetail: ChildSponsorshipDetail = {
            id: newChildData.id,
            sponsorshipId: savedRecord?.id || existingSponsorship?.id,
            name: newChildData.name,
            dob: newChildData.dob,
            ageText: calculateChildAge(newChildData.dob),
            gender: newChildData.gender,
            community: newChildData.address || newChildData.province || 'Casa Nutri - Nampula',
            photo_url: newChildData.photo_url || '',
            story: newChildData.story || '',
            nutritional_status: newChildData.status || 'Adequado',
            sponsorsCount: 1,
            maxSponsors: 2,
            isFull: false,
            sponsors: []
          };
          localStorage.setItem(cacheKey, JSON.stringify([childDetail]));
        } catch (cacheErr) {
          console.warn('Aviso ao atualizar cache local do padrinho:', cacheErr);
        }
      }

      const childDisplayName = newChildData?.name || 'a criança';
      return {
        success: true,
        message: `Vínculo com ${childDisplayName} salvo com sucesso! O algoritmo de distribuição automática já reconheceu a nova ocupação de cotas.`,
        updatedSponsorship: savedRecord
      };
    } catch (err: any) {
      console.error('Erro ao atualizar criança do padrinho:', err);
      return {
        success: false,
        message: err.message || 'Falha ao vincular criança',
        error: err.message
      };
    }
  },

  /**
   * Busca avisos de apadrinhamentos via PIX que estão prestes a vencer (<= 15 dias)
   * ou que já venceram e ainda não tiveram renovação decidida pelo padrinho.
   */
  async getPendingRenewalNoticesForUser(
    userId?: string,
    userEmail?: string
  ): Promise<PendingSponsorshipRenewal[]> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!userId && !cleanEmail) return [];

    // Lista local de renovações recusadas pelo usuário
    let declinedIds = new Set<string>();
    try {
      const rawDec = localStorage.getItem(`yah_declined_renewals_${cleanEmail}`);
      if (rawDec) {
        const parsed = JSON.parse(rawDec);
        if (Array.isArray(parsed)) declinedIds = new Set(parsed);
      }
    } catch {}

    try {
      let queryBySponsorId: any = null;
      let queryByEmail: any = null;

      if (userId) {
        queryBySponsorId = await supabase
          .from('sponsorships')
          .select('*, children(*)')
          .eq('sponsor_id', userId);
      }

      if (cleanEmail) {
        queryByEmail = await supabase
          .from('sponsorships')
          .select('*, children(*)')
          .ilike('donor_email', cleanEmail);
      }

      const seenIds = new Set<string>();
      const rows: any[] = [];
      [...(queryBySponsorId?.data || []), ...(queryByEmail?.data || [])].forEach((item: any) => {
        if (!seenIds.has(item.id) && item.child_id) {
          seenIds.add(item.id);
          rows.push(item);
        }
      });

      const notices: PendingSponsorshipRenewal[] = [];
      for (const item of rows) {
        const st = String(item.status || 'active').toLowerCase().trim();
        if (st === 'canceled' || st === 'cancelled' || st === 'replaced' || st === 'inactive') continue;
        if (item.renewal_declined || declinedIds.has(item.id) || declinedIds.has(item.child_id)) continue;

        const val = evaluateSponsorshipValidity(item, cleanEmail);
        // Exibe aviso se tiver data de expiração (pacote PIX) e estiver vencido ou nos últimos 15 dias
        if (val.expiresAt && (val.isExpired || val.isExpiringSoon)) {
          let c = item.children;
          if (Array.isArray(c)) c = c[0];
          const childName = c?.name || 'Sua Criança Apadrinhada';

          notices.push({
            sponsorshipId: item.id,
            childId: item.child_id,
            childName,
            childPhoto: c?.photo_url || '',
            childCommunity: c?.address || c?.province || 'Casa Nutri',
            childAgeText: calculateChildAge(c?.dob),
            planMonths: val.planMonths,
            packageAmount: val.packageAmount,
            monthlyAmount: Math.max(90, Number(item.monthly_amount || 90)),
            paymentMethod: item.payment_method || 'pix',
            startedAt: val.startedAt,
            expiresAt: val.expiresAt,
            daysRemaining: val.daysRemaining ?? 0,
            isExpired: val.isExpired
          });
        }
      }

      return notices;
    } catch (err) {
      console.warn('Erro ao buscar avisos de renovação:', err);
      return [];
    }
  },

  /**
   * Quando o pacote de apadrinhamento termina e a pessoa opta por NÃO continuar apadrinhando a criança:
   * - Encerra o vínculo com a criança (liberando a vaga para outro padrinho).
   * - MANTÉM o acesso completo da pessoa ao sistema/portal para ver as atualizações gerais do projeto.
   */
  async declineSponsorshipRenewal(
    sponsorshipId: string,
    childId: string,
    userId?: string,
    userEmail?: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();

    // 1. Registra recusa no cache local
    if (cleanEmail) {
      try {
        const decKey = `yah_declined_renewals_${cleanEmail}`;
        const rawDec = localStorage.getItem(decKey);
        const arr: string[] = rawDec ? JSON.parse(rawDec) : [];
        if (!arr.includes(sponsorshipId)) arr.push(sponsorshipId);
        if (childId && !arr.includes(childId)) arr.push(childId);
        localStorage.setItem(decKey, JSON.stringify(arr));

        const existingMeta = getLocalPixPackageMeta(cleanEmail, childId);
        if (existingMeta) {
          saveLocalPixPackageMeta(cleanEmail, childId, {
            planMonths: existingMeta.planMonths || 3,
            packageAmount: existingMeta.packageAmount || 270,
            startedAt: existingMeta.startedAt || new Date().toISOString(),
            expiresAt: existingMeta.expiresAt || new Date().toISOString(),
            renewalDeclined: true
          });
        }

        // Remove a criança do cache local de crianças acompanhadas
        const cacheKey = `yah_sponsored_children_${cleanEmail}`;
        const rawChildren = localStorage.getItem(cacheKey);
        if (rawChildren) {
          const parsed = JSON.parse(rawChildren);
          if (Array.isArray(parsed)) {
            localStorage.setItem(
              cacheKey,
              JSON.stringify(parsed.filter(c => c.id !== childId && c.sponsorshipId !== sponsorshipId))
            );
          }
        }
      } catch {}
    }

    // 2. Atualiza o banco marcando como expirado/encerrado (liberando a vaga da criança)
    try {
      if (sponsorshipId) {
        const { error } = await supabase
          .from('sponsorships')
          .update({ status: 'expired', renewal_declined: true })
          .eq('id', sponsorshipId);

        if (error) {
          await supabase
            .from('sponsorships')
            .update({ status: 'canceled' })
            .eq('id', sponsorshipId);
        }
      } else if (childId && (userId || cleanEmail)) {
        let q = supabase.from('sponsorships').update({ status: 'expired', renewal_declined: true }).eq('child_id', childId);
        if (userId) q = q.eq('sponsor_id', userId);
        else q = q.ilike('donor_email', cleanEmail);
        const { error } = await q;
        if (error) {
          let qFallback = supabase.from('sponsorships').update({ status: 'canceled' }).eq('child_id', childId);
          if (userId) qFallback = qFallback.eq('sponsor_id', userId);
          else qFallback = qFallback.ilike('donor_email', cleanEmail);
          await qFallback;
        }
      }
    } catch (e) {
      console.warn('Aviso ao encerrar ciclo de apadrinhamento no banco:', e);
    }

    return {
      success: true,
      message: 'Ciclo de apadrinhamento encerrado. Você continua com acesso completo ao sistema e a todas as atualizações gerais do projeto!'
    };
  }
};
