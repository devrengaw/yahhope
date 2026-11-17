import { supabase } from '../lib/supabase';

const KNOWN_SPAM_EMAILS = new Set([
  'hbi@vi-team.dk',
  'vca@victorycheeracademy.com',
  'jessica.hilscher@apexcos.com',
  'marco.weimer@cyderes.com',
  'alfonso.m.hernandez@ogarriowireless.com',
  'mirzahashim@msn.com',
  'maximilian.perdue.1@us.af.mil',
]);

const KNOWN_SPAM_NAMES = new Set([
  'pbedhkydnyerscox',
  'eukjnlqgskpwheuygxw',
  'qsmgjmnuohyjuvjymjj',
  'qsmgjmnuohyjujvymyjj',
  'ldzwmvpqfpcobmpdvadl',
  'oieufzqqkdvtylkkjswbbcks',
  'hthobmaprnnntaczlx',
  'ldceeqtjmquwadjvvfbakf',
]);

/**
 * Detecta nomes gerados automaticamente por bots/scripts (ex: "PBeDhkYDNYerSCox")
 */
export function isGibberishBotName(name?: string | null): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;

  if (KNOWN_SPAM_NAMES.has(trimmed.toLowerCase())) {
    return true;
  }

  // Nomes de uma única palavra (sem espaços) apenas com letras ASCII
  if (!/\s/.test(trimmed) && /^[A-Za-z]+$/.test(trimmed)) {
    // Strings longas sem espaço (>= 13 caracteres) com alternância aleatória de maiúsculas e minúsculas
    if (trimmed.length >= 12) {
      const uppercaseCount = (trimmed.match(/[A-Z]/g) || []).length;
      const lowercaseCount = (trimmed.match(/[a-z]/g) || []).length;
      const internalUpperTransitions = (trimmed.slice(1).match(/[A-Z]/g) || []).length;

      // Ex: PBeDhkYDNYerSCox -> várias letras maiúsculas no meio de uma única palavra longa
      if (uppercaseCount >= 3 && lowercaseCount >= 3 && internalUpperTransitions >= 2) {
        return true;
      }
    }

    // 6 ou mais consoantes seguidas em uma única palavra sem espaços
    if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{6,}/.test(trimmed)) {
      return true;
    }
  }

  return false;
}

/**
 * Identifica se um registro de usuário é um cadastro falso/bot/mockup não autorizado
 */
export function isSpamOrMockUser(user?: {
  name?: string | null;
  email?: string | null;
  role?: string | null;
} | null): boolean {
  if (!user) return false;

  // Apoiadores, padrinhos, mantenedores e mentores voluntários NUNCA são considerados spam
  const role = (user.role || '').trim().toUpperCase();
  if (role === 'SPONSOR' || role === 'PADRINHO' || role === 'MANTENEDOR' || role === 'MENTOR') {
    return false;
  }

  const email = (user.email || '').trim().toLowerCase();
  const name = (user.name || '').trim();

  if (email && KNOWN_SPAM_EMAILS.has(email)) {
    return true;
  }

  if (name && KNOWN_SPAM_NAMES.has(name.toLowerCase())) {
    return true;
  }

  if (isGibberishBotName(name)) {
    return true;
  }

  return false;
}

export const KNOWN_PADRINHO_EMAILS = new Set([
  'lucas.wagneer@gmail.com',
  'jonata_xx@hotmail.com',
  'diegott@ymail.com'
]);

export const KNOWN_MANTENEDOR_EMAILS = new Set([
  'messiasletic@gmail.com',
  'gerson.simionato@gmail.com',
  'fe.carmagnani@hotmail.com',
  'jesspenido@gmail.com',
  'gabrielbertoline1202@yahoo.com'
]);

export const KNOWN_SUPPORTER_EMAILS = new Set([
  ...KNOWN_PADRINHO_EMAILS,
  ...KNOWN_MANTENEDOR_EMAILS
]);

const INTERNAL_ROLES = new Set([
  'ADMIN',
  'MASTER',
  'COORDINATOR',
  'COORDENADOR',
  'STAFF',
  'EQUIPE',
  'VOLUNTEER',
  'VOLUNTARIO',
  'SOCIAL_WORKER',
  'ASSISTENTE_SOCIAL',
  'NURSE',
  'ENFERMEIRO',
  'ENFERMEIRA',
  'DOCTOR',
  'MEDICO',
  'MEDICA',
  'ACS',
  'AGENTE',
  'OBSERVER',
  'OBSERVADOR',
  'NUTRITIONIST',
  'NUTRICIONISTA',
  'PSYCHOLOGIST',
  'PSICOLOGO',
  'FINANCIAL',
  'FINANCEIRO',
  'COMMUNICATION',
  'COMUNICACAO'
]);

/**
 * Verifica se o usuário pertence ao Diretório Global de Usuários / Equipe Interna
 * (exclui bots/mockups e exclui perfis externos de mantenedor/padrinho/doador 'SPONSOR', 'MANTENEDOR', 'USER')
 */
export function isInternalTeamUser(user?: {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  permissions?: string[] | null;
  department?: string | null;
} | null): boolean {
  if (!user) return false;
  if (isSpamOrMockUser(user)) return false;

  const email = (user.email || '').trim().toLowerCase();
  // Se for o e-mail de mantenedor/padrinho conhecido, é perfil externo de apoiador
  if (KNOWN_SUPPORTER_EMAILS.has(email)) {
    return false;
  }

  // Administrador master sempre é interno
  if (email === 'contato@yahhope.com') {
    return true;
  }

  const role = (user.role || '').trim().toUpperCase();

  // Papéis especificamente internos
  if (INTERNAL_ROLES.has(role)) {
    return true;
  }

  // Papéis de apoiadores externos e mentores voluntários NUNCA são equipe interna do painel administrativo
  if (
    role === 'SPONSOR' || 
    role === 'PADRINHO' || 
    role === 'MANTENEDOR' || 
    role === 'DOADOR' || 
    role === 'DONOR' || 
    role === 'APOIADOR' || 
    role === 'SUPPORTER' ||
    role === 'MENTOR'
  ) {
    return false;
  }

  // Usuários com role genérica 'USER' ou vazia só entram na equipe se tiverem departamento ou permissões internas explícitas
  if (role === 'USER' || role === 'USUARIO' || !role) {
    const hasDept = Boolean(user.department && user.department.trim() !== '-' && user.department.trim() !== '');
    const hasPerms = Boolean(
      user.permissions && 
      Array.isArray(user.permissions) && 
      user.permissions.some((p: string) => p && p !== 'dashboard' && p !== 'portal')
    );

    return hasDept || hasPerms;
  }

  return false;
}

let purgeInProgress = false;

/**
 * Remove automaticamente do banco (public.users e auth.users) quaisquer
 * usuários falsos/bots detectados.
 */
export async function purgeSpamUsersFromDatabase(): Promise<string[]> {
  if (purgeInProgress) return [];
  purgeInProgress = true;

  const removedIds: string[] = [];

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role');

    if (error || !users) {
      return [];
    }

    const spamUsers = users.filter(u => isSpamOrMockUser(u));
    if (spamUsers.length === 0) {
      return [];
    }

    const ids = spamUsers.map(u => u.id).filter(Boolean);

    // 1. Deleta diretamente da tabela public.users
    if (ids.length > 0) {
      await supabase.from('users').delete().in('id', ids);
    }

    // 2. Aciona a Edge Function delete-user para remover também do Supabase Auth
    await Promise.allSettled(
      ids.map(id =>
        supabase.functions.invoke('delete-user', {
          body: { id },
        })
      )
    );

    removedIds.push(...ids);

    // 3. Normaliza papéis: Padrinhos de crianças (SPONSOR) vs Mantenedores mensais (MANTENEDOR)
    const padrinhosNeedingFix = users.filter(u => {
      const email = (u.email || '').trim().toLowerCase();
      const role = (u.role || '').trim().toUpperCase();
      return KNOWN_PADRINHO_EMAILS.has(email) && role !== 'SPONSOR';
    });
    if (padrinhosNeedingFix.length > 0) {
      await supabase
        .from('users')
        .update({ role: 'SPONSOR' })
        .in('id', padrinhosNeedingFix.map(u => u.id));
    }

    const mantenedoresNeedingFix = users.filter(u => {
      const email = (u.email || '').trim().toLowerCase();
      const role = (u.role || '').trim().toUpperCase();
      return KNOWN_MANTENEDOR_EMAILS.has(email) && role !== 'MANTENEDOR';
    });
    if (mantenedoresNeedingFix.length > 0) {
      await supabase
        .from('users')
        .update({ role: 'MANTENEDOR' })
        .in('id', mantenedoresNeedingFix.map(u => u.id));
    }
  } catch (err) {
    console.warn('Aviso ao limpar usuários inválidos:', err);
  } finally {
    purgeInProgress = false;
  }

  return removedIds;
}

/**
 * Detecta se uma transação financeira foi gerada por bot/script de spam
 * (ex: "Apadrinhamento Mensal (1 cota) - VRGJRTZBVJHNLTUCIMRE")
 */
export function isSpamFinanceTransaction(tx: any): boolean {
  if (!tx || !tx.description) return false;
  const desc = String(tx.description).trim();

  // 1. Strings aleatórias de bots (consoantes consecutivas ou hashes aleatórios sem espaços)
  if (/- [A-Za-z0-9\s]{8,}$/.test(desc)) {
    const namePart = desc.split('-').pop()?.trim() || '';
    // Só considera bot se for uma única palavra sem espaços contendo gibberish ou hash aleatório de >=10 letras maiúsculas
    const isSingleWordRandomHash = !/\s/.test(namePart) && (/^[A-Z]{10,}$/.test(namePart) || /^[A-Za-z0-9]{12,}$/.test(namePart));
    if (isGibberishBotName(namePart) || isSingleWordRandomHash) {
      return true;
    }
  }

  // 2. Nomes de spam conhecidos
  for (const spamName of KNOWN_SPAM_NAMES) {
    if (desc.toLowerCase().includes(spamName)) return true;
  }

  // 3. Palavras-chave de teste/mock não autorizadas
  if (desc.toLowerCase().includes('teste_') || desc.toLowerCase().includes('mock_') || desc.toLowerCase().includes('fake_')) {
    return true;
  }

  return false;
}

/**
 * Normaliza texto removendo acentos e convertendo para minúsculas
 */
function normalizeText(str?: string | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Identifica se um identificador de doador parece um prefixo de e-mail / username
 * Ex: "willian.alves.will", "rita.rochareis", "joao_silva12" (sem espaços, com ponto/underscore/números ou tudo minúsculo)
 */
export function isEmailPrefixOrHandle(donorStr?: string | null): boolean {
  if (!donorStr) return false;
  const trimmed = donorStr.trim();
  if (!trimmed) return false;
  // Se tem espaço, é um nome composto (ex: "Willian junqueiropolis -SP" ou "Rita Reis Prieto")
  if (/\s/.test(trimmed)) return false;
  // Se contém '.', '_', '@' ou dígitos colados, ou é uma única palavra 100% minúscula
  if (/[._@]/.test(trimmed) || /\d/.test(trimmed) || trimmed === trimmed.toLowerCase()) {
    return true;
  }
  return false;
}

/**
 * Extrai o prefixo da descrição (ex: "Doação via Stripe (PIX)") e o nome/identificador do doador após o primeiro " - "
 */
export function splitFinanceDescription(description?: string | null): { prefix: string; donor: string } {
  const raw = (description || '').trim();
  const match = raw.match(/^(.*?)\s+-\s+(.+)$/);
  if (!match) {
    return { prefix: normalizeText(raw), donor: '' };
  }
  return {
    prefix: normalizeText(match[1]),
    donor: match[2].trim()
  };
}

/**
 * Verifica se dois identificadores de doador (um nome completo e um prefixo de e-mail) referem-se à mesma pessoa
 * Ex: "Willian junqueiropolis -SP" <-> "willian.alves.will"
 * Ex: "Rita Reis Prieto" <-> "rita.rochareis"
 */
export function isSameDonorNameAndHandle(nameA?: string | null, nameB?: string | null): boolean {
  const normA = normalizeText(nameA);
  const normB = normalizeText(nameB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const aIsHandle = isEmailPrefixOrHandle(nameA);
  const bIsHandle = isEmailPrefixOrHandle(nameB);

  // Precisa que pelo menos um seja handle/prefixo de e-mail (ou ambos)
  if (!aIsHandle && !bIsHandle) return false;

  const handle = aIsHandle ? normA : normB;
  const fullName = aIsHandle ? normB : normA;

  // Extrai palavras significativas (>= 3 letras) do nome completo e do handle
  const nameTokens = fullName.split(/[^a-z0-9]+/).filter(t => t.length >= 3);
  const handleClean = handle.replace(/[^a-z0-9]/g, '');

  if (nameTokens.length === 0) return false;

  // O primeiro nome está contido no handle de e-mail (ex: "willian" em "willianalveswill", "rita" em "ritarochareis")
  const firstName = nameTokens[0];
  if (firstName.length >= 3 && (handle.includes(firstName) || handleClean.includes(firstName))) {
    return true;
  }

  // Ou pelo menos 2 tokens do nome aparecem no handle
  const matchingTokens = nameTokens.filter(t => t.length >= 4 && handleClean.includes(t));
  return matchingTokens.length >= 1;
}

/**
 * Deduplica lançamentos de finance_transactions onde a mesma doação entrou duas vezes no mesmo dia e mesmo valor:
 * - Uma vez com o Nome Completo (via webhook checkout.session.completed)
 * - Outra vez com o prefixo do e-mail (via sync de charges/invoices da Stripe)
 * Mantém SEMPRE o registro com o Nome Completo e retorna os IDs duplicados para remoção.
 */
export function deduplicateFinanceTransactions<T extends { id: string; description?: string; amount?: number; type?: string; date?: string; account?: string }>(
  txList: T[]
): { cleanList: T[]; duplicateIds: string[] } {
  if (!txList || txList.length <= 1) {
    return { cleanList: txList || [], duplicateIds: [] };
  }

  // Ordena priorizando descrições que possuem Nome Completo (com espaço) sobre prefixos de e-mail (sem espaço / com ponto)
  const sorted = [...txList].sort((a, b) => {
    const aParts = splitFinanceDescription(a.description);
    const bParts = splitFinanceDescription(b.description);
    const aIsHandle = isEmailPrefixOrHandle(aParts.donor) ? 1 : 0;
    const bIsHandle = isEmailPrefixOrHandle(bParts.donor) ? 1 : 0;
    if (aIsHandle !== bIsHandle) return aIsHandle - bIsHandle; // Nome completo vem primeiro (0 < 1)
    return 0;
  });

  const kept: T[] = [];
  const duplicateIds: string[] = [];

  for (const item of sorted) {
    if (item.type !== 'income') {
      kept.push(item);
      continue;
    }

    const itemDate = (item.date || '').slice(0, 10);
    const itemAmt = Number(item.amount || 0);
    const itemOrigAmt = Number((item as any).original_amount || item.amount || 0);
    const itemParts = splitFinanceDescription(item.description);

    const isDup = kept.some(prev => {
      if (prev.type !== 'income') return false;
      const prevDate = (prev.date || '').slice(0, 10);
      const prevAmt = Number(prev.amount || 0);
      const prevOrigAmt = Number((prev as any).original_amount || prev.amount || 0);

      if (!itemDate || !prevDate || itemDate !== prevDate) return false;
      const isExactSameAmt = Math.abs(itemAmt - prevAmt) <= 0.01 || Math.abs(itemOrigAmt - prevOrigAmt) <= 0.01;

      // Caso 1: Descrição exatamente idêntica no mesmo dia e mesmo valor
      if (isExactSameAmt && normalizeText(item.description) === normalizeText(prev.description)) {
        return true;
      }

      // Caso 2: Mesmo dia, mesmo valor (ou bruto equivalente a líquido descontado de taxa Stripe), e um tem o Nome Completo enquanto o outro tem o prefixo do e-mail da mesma pessoa
      const maxVal = Math.max(itemOrigAmt, prevOrigAmt, 1);
      const isWithinGatewayFeeMargin = Math.abs(itemOrigAmt - prevOrigAmt) / maxVal <= 0.08 || Math.abs(itemAmt - prevAmt) / maxVal <= 0.08;
      const prevParts = splitFinanceDescription(prev.description);
      if (isWithinGatewayFeeMargin && itemParts.donor && prevParts.donor && isSameDonorNameAndHandle(itemParts.donor, prevParts.donor)) {
        return true;
      }

      return false;
    });

    if (isDup) {
      if (item.id) duplicateIds.push(item.id);
    } else {
      kept.push(item);
    }
  }

  // Restaura a ordem original por data decrescente
  const duplicateSet = new Set(duplicateIds);
  const cleanList = txList.filter(t => !duplicateSet.has(t.id));

  return { cleanList, duplicateIds };
}

let purgeTxInProgress = false;

/**
 * Remove do banco (public.finance_transactions e public.donations) transações geradas por bots/scripts inválidos
 * e duplicatas de sincronização Stripe (nome vs prefixo de e-mail no mesmo dia e mesmo valor).
 */
export async function purgeSpamFinanceTransactions(): Promise<string[]> {
  if (purgeTxInProgress) return [];
  purgeTxInProgress = true;

  try {
    const { data: txList, error } = await supabase
      .from('finance_transactions')
      .select('id, description, amount, type, date, account');

    if (error || !txList) return [];

    const spamTxIds = txList.filter(t => isSpamFinanceTransaction(t)).map(t => t.id).filter(Boolean);
    const nonSpamList = txList.filter(t => !isSpamFinanceTransaction(t));
    const { duplicateIds } = deduplicateFinanceTransactions(nonSpamList);

    const allIdsToRemove = Array.from(new Set([...spamTxIds, ...duplicateIds]));

    if (allIdsToRemove.length > 0) {
      await supabase.from('finance_transactions').delete().in('id', allIdsToRemove);
    }

    // Limpa também duplicatas na tabela donations (mesmo e-mail, mesmo valor e mesmo dia onde um entrou com pi_ e nome e outro com ch_ e prefixo de e-mail)
    const { data: donList } = await supabase
      .from('donations')
      .select('id, donor_name, donor_email, amount, status, payment_method, paid_at, created_at, stripe_payment_id');

    if (donList && donList.length > 1) {
      const sortedDon = [...donList].sort((a, b) => {
        const aIsHandle = isEmailPrefixOrHandle(a.donor_name) ? 1 : 0;
        const bIsHandle = isEmailPrefixOrHandle(b.donor_name) ? 1 : 0;
        if (aIsHandle !== bIsHandle) return aIsHandle - bIsHandle; // Mantém o que tem Nome Completo
        const aIsPi = String(a.stripe_payment_id || '').startsWith('pi_') ? 0 : 1;
        const bIsPi = String(b.stripe_payment_id || '').startsWith('pi_') ? 0 : 1;
        return aIsPi - bIsPi;
      });

      const keptDon: any[] = [];
      const dupDonIds: string[] = [];

      for (const d of sortedDon) {
        const dEmail = normalizeText(d.donor_email);
        const dDate = String(d.paid_at || d.created_at || '').slice(0, 10);
        const dAmt = Number(d.amount || 0);
        const dStripe = String(d.stripe_payment_id || '').trim();

        const isDupDon = keptDon.some(prev => {
          const prevEmail = normalizeText(prev.donor_email);
          const prevDate = String(prev.paid_at || prev.created_at || '').slice(0, 10);
          const prevAmt = Number(prev.amount || 0);
          const prevStripe = String(prev.stripe_payment_id || '').trim();

          if (Math.abs(dAmt - prevAmt) > 0.01) return false;
          if (dStripe && prevStripe && dStripe === prevStripe) return true;

          if (dDate && prevDate && dDate === prevDate) {
            // Mesmo e-mail no mesmo dia e mesmo valor, sendo que um está com prefixo do e-mail no nome ou um é pi_ e outro é ch_
            if (dEmail && prevEmail && dEmail === prevEmail) {
              if (isSameDonorNameAndHandle(d.donor_name, prev.donor_name)) return true;
              const oneIsPiOtherIsCh =
                (dStripe.startsWith('pi_') && prevStripe.startsWith('ch_')) ||
                (dStripe.startsWith('ch_') && prevStripe.startsWith('pi_'));
              if (oneIsPiOtherIsCh) return true;
            }
            // Ou mesmo sem e-mail idêntico, nome completo vs prefixo de e-mail no mesmo dia e mesmo valor
            if (isSameDonorNameAndHandle(d.donor_name, prev.donor_name)) {
              return true;
            }
          }
          return false;
        });

        if (isDupDon && d.id) {
          dupDonIds.push(d.id);
        } else {
          keptDon.push(d);
        }
      }

      if (dupDonIds.length > 0) {
        await supabase.from('donations').delete().in('id', dupDonIds);
      }
    }

    return allIdsToRemove;
  } catch (err) {
    console.warn('Aviso ao purgar transações de spam/duplicadas:', err);
    return [];
  } finally {
    purgeTxInProgress = false;
  }
}
