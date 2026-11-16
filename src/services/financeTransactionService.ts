import { supabase } from '../lib/supabase';
import { Transaction, TransactionCategory } from '../pages/admin/Finance';
import { ExpensePayload } from '../components/admin/finance/ExpenseModal';

const LOCAL_STORAGE_PREFIX = 'yah_finance_transactions_';

/**
 * Lê as transações armazenadas localmente como backup ou offline.
 */
export function getLocalTransactions(moduleName: string = 'nutrition'): Transaction[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${moduleName}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(`Erro ao ler transações locais de ${moduleName}:`, e);
    return [];
  }
}

/**
 * Salva as transações localmente como backup persistente.
 */
export function setLocalTransactions(moduleName: string = 'nutrition', transactions: Transaction[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${moduleName}`, JSON.stringify(transactions));
  } catch (e) {
    console.warn(`Erro ao persistir transações locais de ${moduleName}:`, e);
  }
}

/**
 * Salva uma transação de despesa de maneira progressiva e resiliente.
 * Trata colunas ausentes (currency, notes, original_amount, exchange_rate, module),
 * restrições de foreign key de categorias recém-criadas e restrições de recorrência.
 */
export async function saveExpenseTransaction(
  newExpense: ExpensePayload,
  moduleName: string = 'nutrition'
): Promise<Transaction> {
  const formattedOriginal = newExpense.original_amount
    ? newExpense.original_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : newExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Garante que a descrição tenha o contexto de moeda se for MZN
  let finalDescription = newExpense.description;
  if (newExpense.currency === 'MZN' && !finalDescription.includes('MT')) {
    finalDescription = `${finalDescription} (${formattedOriginal} MT)`;
  }

  // Sanitiza category_id para null se for vazio
  const rawCategoryId = (newExpense.category_id && newExpense.category_id.trim() !== '') 
    ? newExpense.category_id.trim() 
    : null;

  // Garante data válida (formato YYYY-MM-DD)
  let validDate = newExpense.date;
  if (!validDate || !validDate.includes('-')) {
    validDate = new Date().toISOString().split('T')[0];
  }

  // Monta payload completo
  const fullPayload: any = {
    description: finalDescription,
    amount: Number(newExpense.amount),
    type: 'expense',
    category_id: rawCategoryId,
    date: validDate,
    status: newExpense.status || 'completed',
    account: newExpense.account || 'Conta Principal',
    expense_type: newExpense.expense_type || 'fixed',
    recurrence: newExpense.recurrence || 'none',
    module: moduleName,
    notes: newExpense.notes || null,
    currency: newExpense.currency || 'BRL',
    original_amount: newExpense.original_amount || newExpense.amount,
    exchange_rate: newExpense.exchange_rate || 1
  };

  let savedData: any = null;
  let lastError: any = null;

  // TENTATIVA 1: Inserção completa com todas as colunas
  try {
    const res1 = await supabase.from('finance_transactions').insert([fullPayload]).select();
    if (!res1.error && res1.data && res1.data[0]) {
      savedData = res1.data[0];
    } else if (res1.error) {
      lastError = res1.error;
    }
  } catch (err: any) {
    lastError = err;
  }

  // TENTATIVA 2: Se deu erro de coluna (notes, currency, original_amount, exchange_rate),
  // remove as colunas adicionais e tenta com as colunas base + module
  if (!savedData) {
    const payloadNoCurrencyNotes: any = {
      description: finalDescription,
      amount: Number(newExpense.amount),
      type: 'expense',
      category_id: rawCategoryId,
      date: validDate,
      status: newExpense.status || 'completed',
      account: newExpense.account || 'Conta Principal',
      expense_type: newExpense.expense_type || 'fixed',
      recurrence: newExpense.recurrence || 'none',
      module: moduleName
    };

    try {
      const res2 = await supabase.from('finance_transactions').insert([payloadNoCurrencyNotes]).select();
      if (!res2.error && res2.data && res2.data[0]) {
        savedData = res2.data[0];
      } else if (res2.error) {
        lastError = res2.error;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  // TENTATIVA 3: Se deu erro de coluna module, remove module
  if (!savedData && lastError && (lastError.message?.includes('module') || lastError.message?.includes('column'))) {
    const payloadNoModule: any = {
      description: finalDescription,
      amount: Number(newExpense.amount),
      type: 'expense',
      category_id: rawCategoryId,
      date: validDate,
      status: newExpense.status || 'completed',
      account: newExpense.account || 'Conta Principal',
      expense_type: newExpense.expense_type || 'fixed',
      recurrence: newExpense.recurrence || 'none'
    };

    try {
      const res3 = await supabase.from('finance_transactions').insert([payloadNoModule]).select();
      if (!res3.error && res3.data && res3.data[0]) {
        savedData = res3.data[0];
      } else if (res3.error) {
        lastError = res3.error;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  // TENTATIVA 4: Se deu erro de Foreign Key na category_id (ex: categoria recém-criada localmente)
  if (!savedData && lastError && (
    lastError.message?.includes('foreign key') || 
    lastError.message?.includes('violates foreign key constraint') ||
    lastError.code === '23503'
  )) {
    console.warn('Erro de Foreign Key na categoria. Tentando salvar com category_id nulo...');
    const payloadNoCat: any = {
      description: finalDescription,
      amount: Number(newExpense.amount),
      type: 'expense',
      category_id: null,
      date: validDate,
      status: newExpense.status || 'completed',
      account: newExpense.account || 'Conta Principal',
      expense_type: newExpense.expense_type || 'fixed',
      recurrence: newExpense.recurrence || 'none',
      module: moduleName
    };

    try {
      const res4 = await supabase.from('finance_transactions').insert([payloadNoCat]).select();
      if (!res4.error && res4.data && res4.data[0]) {
        savedData = res4.data[0];
      } else if (res4.error && res4.error.message?.includes('column')) {
        // Tenta sem module também
        delete payloadNoCat.module;
        const res4b = await supabase.from('finance_transactions').insert([payloadNoCat]).select();
        if (!res4b.error && res4b.data && res4b.data[0]) {
          savedData = res4b.data[0];
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  // TENTATIVA 5: Se deu erro de Check Constraint na recorrência (ex: semiannual em banco antigo)
  if (!savedData && lastError && (
    lastError.message?.includes('check constraint') || 
    lastError.code === '23514'
  )) {
    console.warn('Erro de restrição de recorrência. Ajustando para "monthly"...');
    const payloadSafeRecurrence: any = {
      description: `${finalDescription} [${newExpense.recurrence}]`,
      amount: Number(newExpense.amount),
      type: 'expense',
      category_id: null,
      date: validDate,
      status: 'completed',
      account: newExpense.account || 'Conta Principal',
      expense_type: newExpense.expense_type || 'fixed',
      recurrence: 'monthly'
    };

    try {
      const res5 = await supabase.from('finance_transactions').insert([payloadSafeRecurrence]).select();
      if (!res5.error && res5.data && res5.data[0]) {
        savedData = res5.data[0];
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  // Monta objeto de retorno final garantindo tipagem
  let resultTx: Transaction;

  if (savedData) {
    resultTx = {
      ...(savedData as Transaction),
      currency: newExpense.currency || 'BRL',
      original_amount: newExpense.original_amount || newExpense.amount,
      exchange_rate: newExpense.exchange_rate || 1,
      module: moduleName,
      notes: newExpense.notes
    };
  } else {
    // Se tudo no Supabase falhou (ex: sem conexão, credenciais locais ou tabela inacessível)
    console.warn('Falha persistente no Supabase, gerando ID local seguro:', lastError);
    resultTx = {
      id: 'local_tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      description: finalDescription,
      amount: Number(newExpense.amount),
      type: 'expense',
      category_id: rawCategoryId || undefined,
      date: validDate,
      status: newExpense.status || 'completed',
      account: newExpense.account || 'Conta Principal',
      expense_type: newExpense.expense_type || 'fixed',
      recurrence: newExpense.recurrence || 'none',
      module: moduleName,
      notes: newExpense.notes,
      currency: newExpense.currency || 'BRL',
      original_amount: newExpense.original_amount || newExpense.amount,
      exchange_rate: newExpense.exchange_rate || 1
    };
  }

  // Salva no cache persistente local para NUNCA perder os dados adicionados
  const existingLocal = getLocalTransactions(moduleName);
  const updatedLocal = [resultTx, ...existingLocal.filter(t => t.id !== resultTx.id)];
  setLocalTransactions(moduleName, updatedLocal);

  return resultTx;
}

/**
 * Garante que os custos fixos recorrentes (aluguel, folha, serviços, etc.)
 * tenham seus lançamentos gerados para o mês atual com status 'pending' (a pagar),
 * permitindo que a gestão financeira "comece novamente" na virada de cada mês.
 */
export async function ensureCurrentMonthRecurringExpenses(
  transactions: Transaction[],
  targetModule?: string
): Promise<Transaction[]> {
  if (!transactions || transactions.length === 0) return transactions;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // 1. Filtra gastos fixos recorrentes
  const recurringFixed = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (t.expense_type !== 'fixed') return false;
    if (targetModule && t.module && t.module !== 'global' && t.module !== targetModule) return false;
    const rec = t.recurrence || 'monthly';
    return rec !== 'none';
  });

  if (recurringFixed.length === 0) return transactions;

  // 2. Agrupa pelo identificador único do gasto fixo para pegar a última definição
  const templateMap = new Map<string, Transaction>();
  recurringFixed.forEach(t => {
    const desc = (t.description || '').trim().toLowerCase();
    const mod = (t.module || 'global').trim().toLowerCase();
    const acc = (t.account || '').trim().toLowerCase();
    const key = `${desc}:::${mod}:::${acc}`;

    const existing = templateMap.get(key);
    if (!existing || (t.date || '') > (existing.date || '')) {
      templateMap.set(key, t);
    }
  });

  // 3. Para cada modelo de gasto fixo, verifica se já existe lançamento no mês atual
  const missingRecurringExpenses: Transaction[] = [];

  for (const [key, template] of templateMap.entries()) {
    const alreadyExistsInCurrentMonth = transactions.some(t => {
      if (t.type !== 'expense') return false;
      const tMonth = t.date ? t.date.substring(0, 7) : '';
      if (tMonth !== currentMonthKey) return false;
      
      const desc = (t.description || '').trim().toLowerCase();
      const mod = (t.module || 'global').trim().toLowerCase();
      const acc = (t.account || '').trim().toLowerCase();
      return `${desc}:::${mod}:::${acc}` === key;
    });

    if (!alreadyExistsInCurrentMonth) {
      // O template deve ser de um mês anterior
      const templateMonth = template.date ? template.date.substring(0, 7) : '';
      if (templateMonth && templateMonth < currentMonthKey) {
        // Extrai o dia de vencimento original
        let dueDay = 10;
        if (template.date) {
          const parts = template.date.split('-');
          if (parts.length === 3) {
            const parsedDay = parseInt(parts[2], 10);
            if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
              dueDay = Math.min(parsedDay, 28);
            }
          }
        }
        const newDate = `${currentMonthKey}-${String(dueDay).padStart(2, '0')}`;

        const basePayload: any = {
          description: template.description,
          amount: Number(template.amount),
          type: 'expense',
          category_id: template.category_id || null,
          date: newDate,
          status: 'pending', // Começa como pendente/a pagar no novo mês!
          account: template.account || 'Conta Principal',
          expense_type: 'fixed',
          recurrence: template.recurrence || 'monthly',
          module: template.module || 'global'
        };

        const fullPayload: any = {
          ...basePayload,
          currency: template.currency || 'BRL',
          original_amount: template.original_amount ?? template.amount,
          exchange_rate: template.exchange_rate ?? 1,
          notes: template.notes ? `[Renovação automática para ${currentMonthKey}] ${template.notes}` : `Renovação automática para ${currentMonthKey}`
        };

        let createdTx: Transaction | null = null;

        try {
          // Insere no Supabase para persistir o novo ciclo
          let { data, error } = await supabase.from('finance_transactions').insert([fullPayload]).select();
          if (error && error.message?.includes('column')) {
            const retry = await supabase.from('finance_transactions').insert([basePayload]).select();
            data = retry.data;
            error = retry.error;
          }
          if (error && (error.message?.includes('foreign key') || error.code === '23503')) {
            const retryNoCat = await supabase.from('finance_transactions').insert([{ ...basePayload, category_id: null }]).select();
            data = retryNoCat.data;
            error = retryNoCat.error;
          }

          if (data && data[0]) {
            createdTx = data[0] as Transaction;
          }
        } catch (dbErr) {
          console.warn('Erro ao inserir renovação de custo fixo no Supabase:', dbErr);
        }

        if (!createdTx) {
          createdTx = {
            id: `local_recurring_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            ...fullPayload
          };
        }

        missingRecurringExpenses.push(createdTx);
      }
    }
  }

  if (missingRecurringExpenses.length === 0) {
    return transactions;
  }

  const combined = [...missingRecurringExpenses, ...transactions].sort((a, b) => {
    const timeA = new Date(a.date || '').getTime() || 0;
    const timeB = new Date(b.date || '').getTime() || 0;
    return timeB - timeA;
  });

  return combined;
}

/**
 * Carrega as transações do módulo com mesclagem e sincronização segura entre Supabase e LocalStorage.
 */
export async function fetchModuleTransactions(moduleName: string = 'nutrition'): Promise<Transaction[]> {
  const localList = getLocalTransactions(moduleName);

  try {
    let txs: any[] = [];
    
    // Tenta carregar com filtro de module
    const { data: moduleData, error: moduleError } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('module', moduleName)
      .order('date', { ascending: false });

    if (!moduleError && moduleData) {
      txs = moduleData;
    } else {
      // Se deu erro (ex: coluna module não existe), tenta carregar tudo
      const { data: allData, error: allError } = await supabase
        .from('finance_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!allError && allData) {
        // Se a coluna module existir no resultado, filtra. Se não, traz tudo ou filtra por contexto
        txs = allData.filter((t: any) => !t.module || t.module === moduleName);
      }
    }

    // Mescla itens do Supabase com os locais
    const dbIds = new Set(txs.map(t => t.id));
    
    // Itens locais que ainda não estão no banco (ex: salvos offline ou com id local_)
    const pendingLocal = localList.filter(l => !dbIds.has(l.id) && l.id.startsWith('local_tx_'));

    // Atualiza local storage com o que veio do banco + pendentes locais
    const merged = [
      ...pendingLocal,
      ...txs.map(t => {
        // Preserva metadados locais de moeda/notas se o banco não tiver
        const localMatch = localList.find(l => l.id === t.id);
        return {
          ...t,
          currency: (t.currency && String(t.currency).trim()) ? t.currency : (localMatch?.currency || 'BRL'),
          original_amount: (t.original_amount != null) ? t.original_amount : localMatch?.original_amount,
          exchange_rate: (t.exchange_rate != null) ? t.exchange_rate : localMatch?.exchange_rate,
          notes: t.notes || localMatch?.notes
        };
      })
    ];

    setLocalTransactions(moduleName, merged);
    return merged;
  } catch (err) {
    console.warn(`Erro ao buscar transações de ${moduleName} do Supabase, usando cache local:`, err);
    return localList;
  }
}

/**
 * Remove transação do Supabase e do LocalStorage.
 */
export async function deleteModuleTransaction(id: string, moduleName: string = 'nutrition') {
  try {
    if (!id.startsWith('local_tx_')) {
      await supabase.from('finance_transactions').delete().eq('id', id);
    }
  } catch (e) {
    console.warn('Erro ao deletar no Supabase:', e);
  } finally {
    const localList = getLocalTransactions(moduleName);
    setLocalTransactions(moduleName, localList.filter(t => t.id !== id));
  }
}

/**
 * Alterna status da transação no Supabase e no LocalStorage.
 */
export async function toggleModuleTransactionStatus(
  id: string, 
  nextStatus: 'completed' | 'pending', 
  moduleName: string = 'nutrition'
) {
  try {
    if (!id.startsWith('local_tx_')) {
      await supabase.from('finance_transactions').update({ status: nextStatus }).eq('id', id);
    }
  } catch (e) {
    console.warn('Erro ao atualizar status no Supabase:', e);
  } finally {
    const localList = getLocalTransactions(moduleName);
    setLocalTransactions(moduleName, localList.map(t => t.id === id ? { ...t, status: nextStatus } : t));
  }
}

/**
 * Atualiza dados de pagamento no Supabase e no LocalStorage.
 */
export async function updateModuleTransactionPayment(
  id: string,
  updates: {
    status?: 'completed' | 'pending';
    amount?: number;
    original_amount?: number;
    exchange_rate?: number;
    currency?: 'BRL' | 'MZN';
    date?: string;
    notes?: string;
    category_id?: string;
    description?: string;
  },
  moduleName: string = 'nutrition'
) {
  try {
    if (!id.startsWith('local_tx_')) {
      const payload: any = {
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
        ...(updates.currency ? { currency: updates.currency } : {}),
        ...(updates.date ? { date: updates.date } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        ...(updates.category_id !== undefined ? { category_id: updates.category_id } : {}),
        ...(updates.description ? { description: updates.description } : {})
      };

      let { error } = await supabase.from('finance_transactions').update({
        ...payload,
        ...(updates.original_amount !== undefined ? { original_amount: updates.original_amount } : {}),
        ...(updates.exchange_rate !== undefined ? { exchange_rate: updates.exchange_rate } : {})
      }).eq('id', id);

      if (error && error.message?.includes('column')) {
        await supabase.from('finance_transactions').update(payload).eq('id', id);
      }
    }
  } catch (e) {
    console.warn('Erro ao atualizar pagamento no Supabase:', e);
  } finally {
    const localList = getLocalTransactions(moduleName);
    setLocalTransactions(moduleName, localList.map(t => t.id === id ? { ...t, ...updates } : t));
  }
}
