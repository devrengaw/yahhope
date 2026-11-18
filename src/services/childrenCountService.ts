import { supabase } from '../lib/supabase';

const STORAGE_KEY_CHILDREN_COUNT = 'yah_hope_public_children_count_v1';

/**
 * Obtém o número real de crianças cadastradas/atendidas na tabela `children`.
 * 1. Tenta via RPC pública `get_public_children_count` (SECURITY DEFINER, segura para visitantes anônimos).
 * 2. Fallback via query `count: 'exact'` (funciona quando há sessão autenticada).
 * 3. Fallback via cache local para resiliência offline.
 */
export async function getPublicChildrenCount(): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('get_public_children_count');
    if (!error && typeof data === 'number' && data > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_CHILDREN_COUNT, String(data));
      } catch {
        // Ignore storage errors
      }
      return data;
    }
  } catch {
    // RPC may not be deployed yet; try authenticated count fallback
  }

  try {
    const { count, error } = await supabase
      .from('children')
      .select('id', { count: 'exact', head: true });

    if (!error && typeof count === 'number' && count > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_CHILDREN_COUNT, String(count));
      } catch {
        // Ignore storage errors
      }
      return count;
    }
  } catch {
    // Ignore fallback errors
  }

  try {
    const cached = localStorage.getItem(STORAGE_KEY_CHILDREN_COUNT);
    if (cached) {
      const parsed = parseInt(cached, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Ignore storage errors
  }

  return null;
}

/**
 * Formata a contagem de crianças para exibição nas métricas da landing page.
 */
export function formatChildrenCountLabel(count: number, isEn = false): string {
  if (isEn) {
    return `${count} ${count === 1 ? 'child' : 'children'}`;
  }
  return `${count} ${count === 1 ? 'criança' : 'crianças'}`;
}
