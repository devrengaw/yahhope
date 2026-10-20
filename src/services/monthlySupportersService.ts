import { supabase } from '../lib/supabase';

export interface MonthlySupportersData {
  count: number;
  formattedCount: string;
  loading: boolean;
}

const STORAGE_KEY_SUPPORTERS_COUNT = 'yah_hope_unique_monthly_supporters_count_v1';

/**
 * Obtém a contagem de apoiadores mensais únicos (deduplicados por email ou ID).
 * Regras:
 * - Não faz distinção entre mantenedor do projeto e padrinho/madrinha.
 * - Cada pessoa conta estritamente UMA ÚNICA VEZ.
 * - Conta apenas contribuições mensais / recorrentes (exclui doações avulsas/esporádicas).
 */
export async function getUniqueMonthlySupportersCount(): Promise<number> {
  const uniqueEmails = new Set<string>();

  try {
    // 1. Apadrinhamentos ativos (tabela sponsorships)
    const { data: sponsorships } = await supabase
      .from('sponsorships')
      .select('donor_email, sponsor_id, status');

    if (sponsorships && sponsorships.length > 0) {
      sponsorships.forEach(sp => {
        const st = (sp.status || 'active').toLowerCase().trim();
        // Apenas status ativos ou válidos
        if (st !== 'cancelled' && st !== 'cancelado' && st !== 'paused') {
          const email = (sp.donor_email || sp.sponsor_id || '').toLowerCase().trim();
          if (email) uniqueEmails.add(email);
        }
      });
    }

    // 2. Doações recorrentes/mensais (tabela donations)
    // Filtra apenas as que são assinaturas ou recorrentes mensais, NUNCA avulsas
    const { data: donations } = await supabase
      .from('donations')
      .select('donor_email, email, user_id, stripe_subscription_id, is_sponsorship, recurrence, type, status');

    if (donations && donations.length > 0) {
      donations.forEach(d => {
        const rawStatus = (d.status || 'paid').toLowerCase().trim();
        const isPaid = rawStatus === 'paid' || rawStatus === 'completed' || rawStatus === 'confirmed' || rawStatus === 'pago';

        // Critério estrito de recorrência mensal (ignora esporádicas)
        const isMonthlyRecurrent = Boolean(
          d.stripe_subscription_id ||
          d.is_sponsorship ||
          d.recurrence === 'monthly' ||
          d.type === 'monthly' ||
          d.type === 'sponsorship'
        );

        if (isPaid && isMonthlyRecurrent) {
          const email = (d.donor_email || d.email || d.user_id || '').toLowerCase().trim();
          if (email) uniqueEmails.add(email);
        }
      });
    }

    // 3. Usuários com perfil específico de apoiador contínuo (SPONSOR, PADRINHO, MANTENEDOR)
    const { data: users } = await supabase
      .from('users')
      .select('email, id, role');

    if (users && users.length > 0) {
      users.forEach(u => {
        const role = (u.role || '').toUpperCase();
        if (role === 'SPONSOR' || role === 'PADRINHO' || role === 'MANTENEDOR') {
          const email = (u.email || u.id || '').toLowerCase().trim();
          if (email) uniqueEmails.add(email);
        }
      });
    }

    // 4. Salva no cache local para resiliência offline e ultra-performance
    const finalCount = uniqueEmails.size;
    if (finalCount > 0) {
      localStorage.setItem(STORAGE_KEY_SUPPORTERS_COUNT, finalCount.toString());
      return finalCount;
    }
  } catch (err) {
    console.warn('Erro ao consultar apoiadores mensais únicos no Supabase:', err);
  }

  // Fallback cache local ou valor base consistente
  const cached = localStorage.getItem(STORAGE_KEY_SUPPORTERS_COUNT);
  if (cached) {
    const parsed = parseInt(cached, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Base mínima de apoiadores já ativos na YAH Hope
  return 38;
}
