import { supabase } from '../lib/supabase';
import { isSpamOrMockUser } from '../utils/userCleanup';
import { evaluateSponsorshipValidity, MAX_INACTIVE_DAYS_BEFORE_CHURN } from './sponsorshipService';

export interface MonthlySupportersData {
  count: number;
  formattedCount: string;
  loading: boolean;
}

const STORAGE_KEY_SUPPORTERS_COUNT = 'yah_hope_unique_monthly_supporters_count_v2';

/**
 * Obtém a contagem real de apoiadores mensais ativos (Padrinhos + Mantenedores Mensais),
 * estritamente alinhada com a Base de Apoiadores da área de Finanças:
 * - Cada pessoa (e-mail) conta uma única vez.
 * - Exclui quem está há mais de 2 meses (> 60 dias) sem contribuir (exceto pacotes PIX vigentes no prazo).
 * - Exclui doadores de contribuição única/avulsa e usuários inativos ou de teste/spam.
 * - Nunca retorna números fictícios.
 */
export async function getUniqueMonthlySupportersCount(): Promise<number> {
  try {
    const [usersRes, sponsorshipsRes, donationsRes] = await Promise.all([
      supabase.from('users').select('id, name, email, role, status'),
      supabase.from('sponsorships').select('*'),
      supabase.from('donations').select('*')
    ]);

    const dbUsers = (usersRes.data || []).filter(u => !isSpamOrMockUser(u));
    const dbSponsorships = sponsorshipsRes.data || [];
    const dbDonations = donationsRes.data || [];

    const usersByEmail = new Map<string, any>();
    const usersById = new Map<string, any>();
    dbUsers.forEach(u => {
      if (u.email) usersByEmail.set(u.email.toLowerCase().trim(), u);
      if (u.id) usersById.set(u.id, u);
    });

    // Agrupa doações pagas e identifica a última data de contribuição por e-mail
    const paidDonationsByEmail = new Map<string, any[]>();
    const latestPaidDonationByEmail = new Map<string, string>();

    dbDonations.forEach(d => {
      const rawStatus = String(d.status || 'paid').toLowerCase().trim();
      const isPaid = rawStatus === 'paid' || rawStatus === 'completed' || rawStatus === 'confirmed' || rawStatus === 'pago';
      if (!isPaid) return;

      const email = (d.donor_email || d.email || '').toLowerCase().trim();
      if (!email) return;

      if (!paidDonationsByEmail.has(email)) paidDonationsByEmail.set(email, []);
      paidDonationsByEmail.get(email)!.push(d);

      const dt = d.paid_at || d.created_at;
      if (dt) {
        const prev = latestPaidDonationByEmail.get(email);
        if (!prev || new Date(dt).getTime() > new Date(prev).getTime()) {
          latestPaidDonationByEmail.set(email, dt);
        }
      }
    });

    const activeMonthlyEmails = new Set<string>();

    // 1. Verifica apadrinhamentos e assinaturas na tabela sponsorships que estão ativos e vigentes (<= 60 dias ou pacote vigente)
    dbSponsorships.forEach(sp => {
      const st = String(sp.status || 'active').toLowerCase().trim();
      const isStatusActive = st === 'active' || st === 'paid' || st === 'ativo' || st === 'confirmed';
      if (!isStatusActive) return;

      const linkedUser = sp.sponsor_id ? usersById.get(sp.sponsor_id) : undefined;
      const email = (sp.donor_email || linkedUser?.email || '').toLowerCase().trim();
      if (!email) return;

      const userRecord = usersByEmail.get(email) || linkedUser;
      if (userRecord && (isSpamOrMockUser(userRecord) || userRecord.status === 'inactive')) return;

      const latestDonIso = latestPaidDonationByEmail.get(email);
      const validity = evaluateSponsorshipValidity(sp, email, latestDonIso);
      if (!validity.isExpired) {
        activeMonthlyEmails.add(email);
      }
    });

    // 2. Verifica doações recorrentes/mensais pagas nos últimos 60 dias (caso ainda não tenham linha em sponsorships)
    paidDonationsByEmail.forEach((donationsList, email) => {
      if (activeMonthlyEmails.has(email)) return;

      const userRecord = usersByEmail.get(email);
      if (userRecord && (isSpamOrMockUser(userRecord) || userRecord.status === 'inactive')) return;

      const hasRecentRecurringDonation = donationsList.some(d => {
        const isRecurring = Boolean(
          d.stripe_subscription_id ||
          d.is_sponsorship ||
          d.recurrence === 'monthly' ||
          d.type === 'monthly' ||
          d.type === 'sponsorship' ||
          (d.campaign_title && String(d.campaign_title).toLowerCase().includes('apadrinh'))
        );
        if (!isRecurring) return false;

        const dt = d.paid_at || d.created_at;
        if (!dt) return false;
        const daysAgo = Math.floor((Date.now() - new Date(dt).getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo <= MAX_INACTIVE_DAYS_BEFORE_CHURN;
      });

      if (hasRecentRecurringDonation) {
        activeMonthlyEmails.add(email);
      }
    });

    const finalCount = activeMonthlyEmails.size;
    localStorage.setItem(STORAGE_KEY_SUPPORTERS_COUNT, finalCount.toString());
    return finalCount;
  } catch (err) {
    console.warn('Erro ao consultar apoiadores mensais únicos no Supabase:', err);
    const cached = localStorage.getItem(STORAGE_KEY_SUPPORTERS_COUNT);
    if (cached) {
      const parsed = parseInt(cached, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return 0;
  }
}
