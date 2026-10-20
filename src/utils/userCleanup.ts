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

/**
 * Verifica se o usuário pertence ao Diretório Global de Usuários / Equipe Interna
 * (exclui bots/mockups e exclui perfis externos de mantenedor/padrinho 'SPONSOR')
 */
export function isInternalTeamUser(user?: {
  name?: string | null;
  email?: string | null;
  role?: string | null;
} | null): boolean {
  if (!user) return false;
  if (isSpamOrMockUser(user)) return false;

  const role = (user.role || '').trim().toUpperCase();
  if (role === 'SPONSOR' || role === 'PADRINHO' || role === 'MANTENEDOR') {
    return false;
  }

  return true;
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
  } catch (err) {
    console.warn('Aviso ao limpar usuários inválidos:', err);
  } finally {
    purgeInProgress = false;
  }

  return removedIds;
}
