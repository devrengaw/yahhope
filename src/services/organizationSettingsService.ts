import { supabase } from '../lib/supabase';

export interface OrganizationSettings {
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  locale: string;
}

const STORAGE_KEY = 'yah_hope_org_settings_v2';

export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  name: 'YAH Hope International',
  website: 'https://yahhope.org',
  email: 'contato@yahhope.org',
  phone: '+55 11 99999-9999',
  address: 'Rua da Esperança, 123 - São Paulo, SP',
  timezone: 'America/Sao_Paulo',
  locale: 'pt-BR'
};

export function getLocalOrgSettings(): OrganizationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ORG_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Erro ao ler configurações do localStorage:', err);
  }
  return DEFAULT_ORG_SETTINGS;
}

export function saveLocalOrgSettings(settings: OrganizationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Erro ao gravar configurações no localStorage:', err);
  }
}

export async function fetchAndSyncOrgSettings(): Promise<OrganizationSettings> {
  const local = getLocalOrgSettings();

  try {
    const { data, error } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.warn('Erro ao consultar organization_settings no Supabase (usando local):', error.message);
      return local;
    }

    if (data) {
      const remoteSettings: OrganizationSettings = {
        name: data.name || local.name,
        website: data.website || local.website,
        email: data.email || local.email,
        phone: data.phone || local.phone,
        address: data.address || local.address,
        timezone: data.timezone || local.timezone,
        locale: data.locale || local.locale
      };
      saveLocalOrgSettings(remoteSettings);
      return remoteSettings;
    } else {
      // Se não existe a linha no banco, salva a local lá (auto-heal)
      supabase
        .from('organization_settings')
        .upsert({ id: 'default', ...local }, { onConflict: 'id' })
        .then(() => console.log('Configurações locais inicializadas no Supabase'));
    }
  } catch (err) {
    console.warn('Exceção ao buscar configurações da organização:', err);
  }

  return local;
}

export async function saveOrgSettings(settings: OrganizationSettings): Promise<{ success: boolean; error?: string }> {
  // 1. Salva localmente com garantia imediata
  saveLocalOrgSettings(settings);

  // 2. Persiste no Supabase
  try {
    const { error } = await supabase
      .from('organization_settings')
      .upsert({
        id: 'default',
        name: settings.name,
        website: settings.website,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        timezone: settings.timezone,
        locale: settings.locale,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Aviso: erro ao salvar no Supabase, mantido em cache local:', error.message);
      return { success: true, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Exceção ao salvar organization_settings:', err);
    return { success: true, error: err?.message };
  }
}
