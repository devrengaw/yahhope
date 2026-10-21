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

  // Apoiadores, padrinhos e mantenedores reais NUNCA são considerados spam
  const role = (user.role || '').trim().toUpperCase();
  if (role === 'SPONSOR' || role === 'PADRINHO' || role === 'MANTENEDOR') {
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

  // Papéis de apoiadores externos NUNCA são equipe interna do workspace
  if (
    role === 'SPONSOR' || 
    role === 'PADRINHO' || 
    role === 'MANTENEDOR' || 
    role === 'DOADOR' || 
    role === 'DONOR' || 
    role === 'APOIADOR' || 
    role === 'SUPPORTER'
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

let purgeTxInProgress = false;

/**
 * Remove do banco (public.finance_transactions) transações geradas por bots/scripts inválidos
 */
export async function purgeSpamFinanceTransactions(): Promise<string[]> {
  if (purgeTxInProgress) return [];
  purgeTxInProgress = true;

  try {
    const { data: txList, error } = await supabase
      .from('finance_transactions')
      .select('id, description, amount, type');

    if (error || !txList) return [];

    const spamTx = txList.filter(t => isSpamFinanceTransaction(t));
    if (spamTx.length === 0) return [];

    const ids = spamTx.map(t => t.id).filter(Boolean);
    if (ids.length > 0) {
      await supabase.from('finance_transactions').delete().in('id', ids);
    }
    return ids;
  } catch (err) {
    console.warn('Aviso ao purgar transações de spam:', err);
    return [];
  } finally {
    purgeTxInProgress = false;
  }
}
