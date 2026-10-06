export interface PaymentAccount {
  id: string;
  name: string;
  description?: string;
  project_id?: string; // ID do projeto vinculado (ex: 'nutrition', 'global', ou ID de Project)
  color?: string;
  is_default?: boolean;
}

const STORAGE_KEY = 'yah_hope_finance_payment_accounts_v1';

export const DEFAULT_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  { id: 'acc_main', name: 'Conta Principal', description: 'Operações e Custos Globais', project_id: 'global', color: 'indigo', is_default: true },
  { id: 'acc_nutri', name: 'Conta Projetos', description: 'Projetos Setoriais / Nutrição', project_id: 'nutrition', color: 'amber' },
  { id: 'acc_reserve', name: 'Fundo de Reserva', description: 'Reserva e Emergências', project_id: 'global', color: 'emerald' },
  { id: 'acc_comm', name: 'Conta Comunicação', description: 'Ações de Marketing e Comunicação', project_id: 'communication', color: 'purple' },
];

/**
 * Lê as contas de pagamento armazenadas. Se não houver, inicializa com as contas padrão.
 */
export function getLocalPaymentAccounts(): PaymentAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLocalPaymentAccounts(DEFAULT_PAYMENT_ACCOUNTS);
      return DEFAULT_PAYMENT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Erro ao ler contas de pagamento do localStorage:', err);
  }
  return DEFAULT_PAYMENT_ACCOUNTS;
}

/**
 * Grava as contas de pagamento no localStorage.
 */
export function saveLocalPaymentAccounts(accounts: PaymentAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Erro ao salvar contas de pagamento no localStorage:', err);
  }
}

/**
 * Salva ou atualiza uma conta de pagamento.
 */
export function savePaymentAccount(account: PaymentAccount): PaymentAccount[] {
  const current = getLocalPaymentAccounts();
  const index = current.findIndex(a => a.id === account.id || a.name.toLowerCase() === account.name.toLowerCase());
  let updated: PaymentAccount[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...account };
  } else {
    updated = [...current, account];
  }
  saveLocalPaymentAccounts(updated);
  return updated;
}
