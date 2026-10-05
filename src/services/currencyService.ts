/**
 * Serviço de Câmbio e Cotações para Conversão de Moedas (MZN <-> BRL)
 * Suporta Metical Moçambicano (MZN) e Real Brasileiro (BRL)
 */

export interface ExchangeRateResult {
  rate: number; // 1 MZN em BRL (ex: 0.0810)
  inverseRate: number; // 1 BRL em MZN (ex: 12.34)
  lastUpdated: string;
  source: 'api' | 'cache' | 'fallback';
}

const CACHE_KEY = 'yah_hope_mzn_brl_rate';
const CACHE_TIMESTAMP_KEY = 'yah_hope_mzn_brl_timestamp';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora de cache

// Cotação de fallback caso a rede esteja indisponível
const FALLBACK_MZN_TO_BRL = 0.08103;

/**
 * Busca a cotação oficial atualizada de MZN (Metical) para BRL (Real)
 */
export async function getMznToBrlRate(forceRefresh = false): Promise<ExchangeRateResult> {
  // 1. Verifica cache no localStorage se não for forceRefresh
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < CACHE_TTL_MS) {
          const rate = parseFloat(cached);
          if (!isNaN(rate) && rate > 0) {
            return {
              rate,
              inverseRate: Number((1 / rate).toFixed(2)),
              lastUpdated: new Date(parseInt(timestamp, 10)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              source: 'cache'
            };
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao ler cache de câmbio:', e);
    }
  }

  // 2. Tenta API primária: open.er-api.com (sem necessidade de API key, rápida e confiável)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/MZN', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates.BRL === 'number') {
        const rate = data.rates.BRL;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, rate.toString());
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        }
        return {
          rate,
          inverseRate: Number((1 / rate).toFixed(2)),
          lastUpdated: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          source: 'api'
        };
      }
    }
  } catch (err) {
    console.warn('Falha na API primária de câmbio, tentando secundária:', err);
  }

  // 3. Tenta API secundária: api.exchangerate-api.com v4
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/MZN');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates.BRL === 'number') {
        const rate = data.rates.BRL;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, rate.toString());
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        }
        return {
          rate,
          inverseRate: Number((1 / rate).toFixed(2)),
          lastUpdated: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          source: 'api'
        };
      }
    }
  } catch (err) {
    console.warn('Falha na API secundária de câmbio:', err);
  }

  // 4. Retorna fallback seguro
  return {
    rate: FALLBACK_MZN_TO_BRL,
    inverseRate: Number((1 / FALLBACK_MZN_TO_BRL).toFixed(2)),
    lastUpdated: 'Padrão / Estimada',
    source: 'fallback'
  };
}

/**
 * Converte valor de MZN para BRL com base na taxa fornecida
 */
export function convertMznToBrl(amountMzn: number, rate: number): number {
  if (isNaN(amountMzn) || amountMzn <= 0 || isNaN(rate) || rate <= 0) return 0;
  return Number((amountMzn * rate).toFixed(2));
}

/**
 * Converte valor de BRL para MZN com base na taxa fornecida
 */
export function convertBrlToMzn(amountBrl: number, rate: number): number {
  if (isNaN(amountBrl) || amountBrl <= 0 || isNaN(rate) || rate <= 0) return 0;
  return Number((amountBrl / rate).toFixed(2));
}
