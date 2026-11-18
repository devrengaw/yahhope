import { supabase } from '../lib/supabase';

export interface OrganizationSettings {
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  locale: string;
  sponsorship_quota_cost?: number;
  max_sponsors_per_child?: number;
  instagram_url?: string;
  youtube_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
}

const STORAGE_KEY = 'yah_hope_org_settings_v2';

export const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  name: 'YAH Hope International',
  website: 'https://yahhope.org',
  email: 'contato@yahhope.org',
  phone: '+55 11 99999-9999',
  address: 'Rua da Esperança, 123 - São Paulo, SP',
  timezone: 'America/Sao_Paulo',
  locale: 'pt-BR',
  sponsorship_quota_cost: 90.00,
  max_sponsors_per_child: 2,
  instagram_url: 'https://instagram.com',
  youtube_url: 'https://youtube.com',
  facebook_url: 'https://facebook.com',
  linkedin_url: 'https://linkedin.com'
};

export function normalizeExternalUrl(url?: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('org-settings-updated', { detail: settings }));
    }
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
        locale: data.locale || local.locale,
        sponsorship_quota_cost: data.sponsorship_quota_cost !== undefined && data.sponsorship_quota_cost !== null 
          ? Number(data.sponsorship_quota_cost) 
          : local.sponsorship_quota_cost,
        max_sponsors_per_child: data.max_sponsors_per_child !== undefined && data.max_sponsors_per_child !== null 
          ? Number(data.max_sponsors_per_child) 
          : local.max_sponsors_per_child,
        instagram_url: data.instagram_url !== undefined && data.instagram_url !== null ? data.instagram_url : local.instagram_url,
        youtube_url: data.youtube_url !== undefined && data.youtube_url !== null ? data.youtube_url : local.youtube_url,
        facebook_url: data.facebook_url !== undefined && data.facebook_url !== null ? data.facebook_url : local.facebook_url,
        linkedin_url: data.linkedin_url !== undefined && data.linkedin_url !== null ? data.linkedin_url : local.linkedin_url
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

export async function saveOrgSettings(settings: OrganizationSettings): Promise<{ success: boolean; error?: string; warning?: string }> {
  // 1. Salva localmente com garantia imediata
  saveLocalOrgSettings(settings);

  // 2. Persiste no Supabase
  try {
    const payload: any = {
      id: 'default',
      name: settings.name,
      website: settings.website,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      timezone: settings.timezone,
      locale: settings.locale,
      sponsorship_quota_cost: settings.sponsorship_quota_cost ?? 90,
      max_sponsors_per_child: settings.max_sponsors_per_child ?? 2,
      instagram_url: settings.instagram_url ?? '',
      youtube_url: settings.youtube_url ?? '',
      facebook_url: settings.facebook_url ?? '',
      linkedin_url: settings.linkedin_url ?? '',
      updated_at: new Date().toISOString()
    };

    let { error } = await supabase
      .from('organization_settings')
      .upsert(payload, { onConflict: 'id' });

    let warning: string | undefined;
    const optionalCols = [
      'sponsorship_quota_cost',
      'max_sponsors_per_child',
      'instagram_url',
      'youtube_url',
      'facebook_url',
      'linkedin_url',
      'updated_at'
    ];
    const socialCols = ['instagram_url', 'youtube_url', 'facebook_url', 'linkedin_url'];
    const fallbackPayload = { ...payload };
    let attempts = 0;

    // Remove apenas a(s) coluna(s) ausente(s) reportada(s) pelo Supabase
    while (error && error.message?.includes('column') && attempts < optionalCols.length) {
      attempts++;
      const missingCol = optionalCols.find(col => col in fallbackPayload && error!.message.includes(col));
      if (!missingCol) break;

      if (socialCols.includes(missingCol)) {
        warning = `A coluna "${missingCol}" ainda não está visível no Supabase (schema cache). Execute add_social_links_to_organization_settings.sql ou "NOTIFY pgrst, 'reload schema';" no SQL Editor do Supabase.`;
      }
      delete fallbackPayload[missingCol];
      const retry = await supabase.from('organization_settings').upsert(fallbackPayload, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.warn('Aviso: erro ao salvar no Supabase, mantido em cache local:', error.message);
      return { success: true, error: error.message, warning };
    }
    return { success: true, warning };
  } catch (err: any) {
    console.warn('Exceção ao salvar organization_settings:', err);
    return { success: true, error: err?.message };
  }
}
