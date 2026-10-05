import { supabase } from '../lib/supabase';

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  created_at?: string;
}

const STORAGE_KEY = 'yah_hope_finance_categories_v2';

export const DEFAULT_FINANCE_CATEGORIES: TransactionCategory[] = [
  // Receitas
  { id: 'cat_donation', name: 'Doações da Campanha', type: 'income', color: 'bg-emerald-100 text-emerald-600', icon: 'Heart' },
  { id: 'cat_sponsorship', name: 'Apadrinhamento', type: 'income', color: 'bg-teal-100 text-teal-600', icon: 'Users' },
  { id: 'cat_store', name: 'Vendas da Loja', type: 'income', color: 'bg-indigo-100 text-indigo-600', icon: 'ShoppingBag' },
  // Despesas Gerais
  { id: 'cat_salary', name: 'Pagamento de Pessoal', type: 'expense', color: 'bg-rose-100 text-rose-600', icon: 'Briefcase' },
  { id: 'cat_office', name: 'Material de Escritório', type: 'expense', color: 'bg-orange-100 text-orange-600', icon: 'Paperclip' },
  { id: 'cat_marketing', name: 'Marketing e Eventos', type: 'expense', color: 'bg-blue-100 text-blue-600', icon: 'Megaphone' },
  // Despesas Nutricionais / Casa Nutri
  { id: 'cat_nutri_alimentos', name: 'Alimentos & Cestas', type: 'expense', color: 'bg-emerald-500', icon: 'Apple' },
  { id: 'cat_nutri_suplementos', name: 'Suplementos & Vitaminas', type: 'expense', color: 'bg-blue-500', icon: 'HeartPulse' },
  { id: 'cat_nutri_logistica', name: 'Logística & Transporte', type: 'expense', color: 'bg-amber-500', icon: 'Truck' },
  { id: 'cat_nutri_equipe', name: 'Honorários & Equipe', type: 'expense', color: 'bg-purple-500', icon: 'Users' },
  { id: 'cat_nutri_infra', name: 'Infraestrutura & Cozinha', type: 'expense', color: 'bg-rose-500', icon: 'Home' },
  { id: 'cat_nutri_outros', name: 'Outras Despesas Nutricionais', type: 'expense', color: 'bg-slate-500', icon: 'Tag' }
];

/**
 * Lê as categorias armazenadas em cache local. Se não houver, inicializa com os defaults.
 */
export function getLocalCategories(): TransactionCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLocalCategories(DEFAULT_FINANCE_CATEGORIES);
      return DEFAULT_FINANCE_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Erro ao ler categorias financeiras do localStorage:', err);
  }
  return DEFAULT_FINANCE_CATEGORIES;
}

/**
 * Grava a lista completa de categorias no localStorage.
 */
export function saveLocalCategories(categories: TransactionCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.warn('Erro ao salvar categorias financeiras no localStorage:', err);
  }
}

/**
 * Mescla categorias locais e remotas.
 * Se houver categorias locais que NÃO estão no Supabase (por exemplo, após um reset do banco ou execução de script SQL),
 * faz o auto-heal (upsert) para o Supabase sem perder nada!
 */
export async function fetchAndSyncCategories(): Promise<TransactionCategory[]> {
  const localList = getLocalCategories();
  
  try {
    const { data: remoteData, error } = await supabase
      .from('finance_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar finance_categories do Supabase, usando cache local:', error);
      return localList;
    }

    const remoteCategories: TransactionCategory[] = (remoteData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      color: row.color,
      icon: row.icon || 'Tag',
      created_at: row.created_at
    }));

    // Mapa por ID
    const mergedMap = new Map<string, TransactionCategory>();

    // 1. Inicia com as remotas
    remoteCategories.forEach(cat => mergedMap.set(cat.id, cat));

    // 2. Identifica se há itens locais não presentes no Supabase
    const missingInRemote: TransactionCategory[] = [];
    localList.forEach(localCat => {
      if (!mergedMap.has(localCat.id)) {
        mergedMap.set(localCat.id, localCat);
        missingInRemote.push(localCat);
      }
    });

    const unifiedList = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    saveLocalCategories(unifiedList);

    // Auto-heal: se o banco perdeu categorias locais por causa de um script SQL ou reset,
    // re-insere de volta no Supabase automaticamente em background
    if (missingInRemote.length > 0) {
      const inserts = missingInRemote.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        color: c.color,
        icon: c.icon || 'Tag'
      }));
      supabase
        .from('finance_categories')
        .upsert(inserts, { onConflict: 'id' })
        .then(({ error: upsertErr }) => {
          if (upsertErr) {
            console.warn('Aviso: auto-sync de categorias para Supabase encontrou restrição:', upsertErr.message);
          } else {
            console.log(`Auto-restauradas ${missingInRemote.length} categorias financeiras no Supabase.`);
          }
        });
    }

    return unifiedList;
  } catch (err) {
    console.warn('Exceção ao sincronizar finance_categories:', err);
    return localList;
  }
}

/**
 * Salva (cria ou atualiza) uma categoria tanto no localStorage quanto no Supabase.
 */
export async function saveCategory(category: TransactionCategory): Promise<TransactionCategory> {
  const current = getLocalCategories();
  const existingIdx = current.findIndex(c => c.id === category.id);
  let updatedList: TransactionCategory[];

  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = category;
  } else {
    updatedList = [...current, category].sort((a, b) => a.name.localeCompare(b.name));
  }

  saveLocalCategories(updatedList);

  // Upsert no Supabase
  try {
    const { error } = await supabase
      .from('finance_categories')
      .upsert({
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon || 'Tag'
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Erro ao salvar categoria no Supabase, mantida no cache local:', error);
    }
  } catch (err) {
    console.warn('Exceção ao salvar categoria no Supabase:', err);
  }

  return category;
}

/**
 * Exclui uma categoria do localStorage e do Supabase.
 */
export async function deleteCategory(id: string): Promise<void> {
  const current = getLocalCategories();
  const filtered = current.filter(c => c.id !== id);
  saveLocalCategories(filtered);

  try {
    const { error } = await supabase
      .from('finance_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Erro ao excluir categoria no Supabase, removida do cache local:', error);
    }
  } catch (err) {
    console.warn('Exceção ao excluir categoria no Supabase:', err);
  }
}
