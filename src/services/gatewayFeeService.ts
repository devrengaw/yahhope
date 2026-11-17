export interface GatewayFeeConfig {
  stripeCardPercent: number; // Padrão Stripe Brasil: 3.99%
  stripeCardFixedBrl: number; // Padrão Stripe Brasil: R$ 0.39
  stripePixPercent: number; // Padrão Stripe Brasil: 1.19%
  stripePixFixedBrl: number; // R$ 0.00
  useNetAmountInFinance: boolean; // Sempre usar valor líquido repassado no caixa
}

const FEE_CONFIG_STORAGE_KEY = 'yahhope_gateway_fee_config_v1';

export const DEFAULT_GATEWAY_FEE_CONFIG: GatewayFeeConfig = {
  stripeCardPercent: 3.99,
  stripeCardFixedBrl: 0.39,
  stripePixPercent: 1.19,
  stripePixFixedBrl: 0.0,
  useNetAmountInFinance: true
};

export function getGatewayFeeConfig(): GatewayFeeConfig {
  try {
    const raw = localStorage.getItem(FEE_CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_GATEWAY_FEE_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_GATEWAY_FEE_CONFIG;
}

export function saveGatewayFeeConfig(config: GatewayFeeConfig): GatewayFeeConfig {
  try {
    localStorage.setItem(FEE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {}
  return config;
}

export interface ResolvedGatewayAmounts {
  isGatewayTx: boolean;
  gatewayName: 'Stripe' | 'InfinitePay' | null;
  paymentMethod: 'pix' | 'credit_card' | 'other';
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  isExactFromApi: boolean;
}

/**
 * Identifica se um lançamento financeiro é uma entrada via Stripe (ou InfinitePay)
 * e retorna o Valor Bruto doado, a Taxa retida e o Valor Líquido efetivamente repassado ao caixa.
 */
export function resolveTransactionGatewayAmounts(
  tx: {
    id?: string;
    description?: string;
    amount?: number;
    type?: string;
    account?: string;
    currency?: string;
    original_amount?: number;
    notes?: string;
  },
  config: GatewayFeeConfig = DEFAULT_GATEWAY_FEE_CONFIG
): ResolvedGatewayAmounts {
  const rawAmt = Number(tx.amount || 0);
  const desc = String(tx.description || '');
  const descLower = desc.toLowerCase();
  const accLower = String(tx.account || '').toLowerCase();
  const notes = String(tx.notes || '');

  // Apenas receitas em BRL (não MZN e não repasses internos) passam por taxa de gateway de doação
  const isStripe = accLower.includes('stripe') || descLower.includes('stripe');
  const isInfinite = accLower.includes('infinite') || descLower.includes('infinitepay');

  if (tx.type !== 'income' || tx.currency === 'MZN' || (!isStripe && !isInfinite)) {
    return {
      isGatewayTx: false,
      gatewayName: null,
      paymentMethod: 'other',
      grossAmount: rawAmt,
      feeAmount: 0,
      netAmount: rawAmt,
      isExactFromApi: true
    };
  }

  const isPix = descLower.includes('(pix)') || descLower.includes('via pix') || accLower.includes('pix');
  const paymentMethod: 'pix' | 'credit_card' = isPix ? 'pix' : 'credit_card';
  const gatewayName: 'Stripe' | 'InfinitePay' = isStripe ? 'Stripe' : 'InfinitePay';

  // 1. Verifica se o lançamento JÁ veio com o valor líquido gravado pela API (via tag [STRIPE_NET] nas notas ou original_amount > amount)
  const netMatch = notes.match(/\[STRIPE_NET:gross=([0-9.]+),fee=([0-9.]+),net=([0-9.]+)\]/);
  if (netMatch) {
    const gross = Number(parseFloat(netMatch[1]).toFixed(2));
    const fee = Number(parseFloat(netMatch[2]).toFixed(2));
    const net = Number(parseFloat(netMatch[3]).toFixed(2));
    return {
      isGatewayTx: true,
      gatewayName,
      paymentMethod,
      grossAmount: gross,
      feeAmount: fee,
      netAmount: config.useNetAmountInFinance ? net : gross,
      isExactFromApi: true
    };
  }

  // Se original_amount estiver salvo em BRL maior que amount (significa que original_amount é o Bruto e amount já é o Líquido no banco)
  if (
    tx.original_amount !== undefined &&
    tx.original_amount !== null &&
    Number(tx.original_amount) > rawAmt &&
    tx.currency !== 'MZN'
  ) {
    const gross = Number(Number(tx.original_amount).toFixed(2));
    const net = Number(rawAmt.toFixed(2));
    const fee = Number(Math.max(0, gross - net).toFixed(2));
    return {
      isGatewayTx: true,
      gatewayName,
      paymentMethod,
      grossAmount: gross,
      feeAmount: fee,
      netAmount: config.useNetAmountInFinance ? net : gross,
      isExactFromApi: true
    };
  }

  // 2. Caso o lançamento no banco ainda esteja com o Valor Bruto cheio (ex: R$ 100,00 ou R$ 20,00 ou R$ 90,00),
  // calcula a taxa da Stripe conforme o método (PIX vs Cartão) para entregar o Valor Líquido Repassado real
  if (isStripe) {
    const gross = Number(rawAmt.toFixed(2));
    const pct = isPix ? config.stripePixPercent : config.stripeCardPercent;
    const fixed = isPix ? config.stripePixFixedBrl : config.stripeCardFixedBrl;
    const calculatedFee = Number(((gross * (pct / 100)) + (gross > 0 ? fixed : 0)).toFixed(2));
    const net = Number(Math.max(0, gross - calculatedFee).toFixed(2));

    return {
      isGatewayTx: true,
      gatewayName: 'Stripe',
      paymentMethod,
      grossAmount: gross,
      feeAmount: calculatedFee,
      netAmount: config.useNetAmountInFinance ? net : gross,
      isExactFromApi: false
    };
  }

  return {
    isGatewayTx: true,
    gatewayName: 'InfinitePay',
    paymentMethod,
    grossAmount: rawAmt,
    feeAmount: 0,
    netAmount: rawAmt,
    isExactFromApi: false
  };
}

export function buildStripeNetNoteTag(grossAmount: number, feeAmount: number, netAmount: number, existingNotes?: string): string {
  const cleanNotes = (existingNotes || '')
    .replace(/\[STRIPE_NET:[^\]]+\]/g, '')
    .replace(/\[Taxa Stripe:[^\]]+\]/g, '')
    .trim();

  const tag = `[STRIPE_NET:gross=${grossAmount.toFixed(2)},fee=${feeAmount.toFixed(2)},net=${netAmount.toFixed(2)}]`;
  return [cleanNotes, tag].filter(Boolean).join(' ');
}
