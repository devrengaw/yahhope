import { supabase } from '../lib/supabase';

export const ACCOUNTABILITY_2026_DOMAIN = 'prestacao2026.yahhope.com';
export const ACCOUNTABILITY_2026_URL = 'https://prestacao2026.yahhope.com';
export const ACCOUNTABILITY_2026_PATH = '/prestacao2026';

export interface AccountabilityConfig {
  mode: 'establishing' | 'published';
  title: string;
  subtitle: string;
  thankYouMessage: string;
  showLiveNumbers: boolean;
  showProjectsBreakdown: boolean;
  showMonthlyTimeline: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'yah_hope_accountability_2026_config_v1';
const SETTINGS_ID = 'accountability_2026_config';

export const DEFAULT_ACCOUNTABILITY_CONFIG: AccountabilityConfig = {
  mode: 'establishing',
  title: 'Prestação de Contas e Transparência 2026',
  subtitle: 'Acompanhe de forma íntegra nossas entradas, nossas saídas, o saldo em caixa e cada projeto executado pela YAH Hope.',
  thankYouMessage:
    'Muito obrigado por caminhar conosco! Se você chegou aqui pelo QR Code do nosso Cartão de Agradecimento, saiba que cada vida alcançada é fruto da sua generosidade e confiança.',
  showLiveNumbers: false,
  showProjectsBreakdown: true,
  showMonthlyTimeline: true,
  updatedAt: new Date().toISOString()
};

export function getLocalAccountabilityConfig(): AccountabilityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ACCOUNTABILITY_CONFIG;
    return { ...DEFAULT_ACCOUNTABILITY_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ACCOUNTABILITY_CONFIG;
  }
}

export async function fetchAccountabilityConfig(): Promise<AccountabilityConfig> {
  const local = getLocalAccountabilityConfig();
  try {
    const { data, error } = await supabase
      .from('organization_settings')
      .select('address')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    if (!error && data?.address) {
      const parsed = JSON.parse(data.address);
      const merged: AccountabilityConfig = { ...DEFAULT_ACCOUNTABILITY_CONFIG, ...parsed };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {
    // Fallback silencioso para localStorage
  }
  return local;
}

export async function saveAccountabilityConfig(config: AccountabilityConfig): Promise<AccountabilityConfig> {
  const updated: AccountabilityConfig = {
    ...config,
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  try {
    await supabase.from('organization_settings').upsert(
      {
        id: SETTINGS_ID,
        name: 'Accountability 2026 Config',
        website: ACCOUNTABILITY_2026_URL,
        address: JSON.stringify(updated),
        updated_at: updated.updatedAt
      },
      { onConflict: 'id' }
    );
  } catch {
    // Fallback local já salvo
  }

  return updated;
}

export function getAccountabilityQrCodeUrl(size = 600): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=16&ecc=H&data=${encodeURIComponent(ACCOUNTABILITY_2026_URL)}&color=0f172a&bgcolor=ffffff`;
}
