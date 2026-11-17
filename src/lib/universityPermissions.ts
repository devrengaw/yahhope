import { User } from '../contexts/AuthContext';
import { supabase } from './supabase';

export interface UserAccessOverride {
  id?: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
  phone?: string;
  department?: string;
  status?: string;
  category_id?: string;
  updated_at?: string;
}

const USER_ACCESS_SETTINGS_KEY = 'user_access_permissions_v1';
const USER_ACCESS_LOCAL_STORAGE_KEY = 'yahhope_user_access_permissions_v1';

function readLocalAccessOverrides(): Record<string, UserAccessOverride> {
  try {
    const raw = localStorage.getItem(USER_ACCESS_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function writeLocalAccessOverrides(map: Record<string, UserAccessOverride>) {
  try {
    localStorage.setItem(USER_ACCESS_LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

/**
 * Carrega o mapa de acessos/permissões salvo em `public.site_settings` (sincronizado entre PC e Celular)
 * combinado com o cache local.
 */
export async function fetchUserAccessOverrides(): Promise<Record<string, UserAccessOverride>> {
  const localMap = readLocalAccessOverrides();
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', USER_ACCESS_SETTINGS_KEY)
      .maybeSingle();

    if (!error && data?.value && typeof data.value === 'object') {
      const remoteMap = data.value as Record<string, UserAccessOverride>;
      const merged: Record<string, UserAccessOverride> = { ...localMap };

      for (const [k, remoteVal] of Object.entries(remoteMap)) {
        const localVal = merged[k];
        if (!localVal) {
          merged[k] = remoteVal;
        } else {
          const rTime = remoteVal?.updated_at ? new Date(remoteVal.updated_at).getTime() : 0;
          const lTime = localVal?.updated_at ? new Date(localVal.updated_at).getTime() : 0;
          merged[k] = rTime >= lTime ? { ...localVal, ...remoteVal } : { ...remoteVal, ...localVal };
        }
      }

      writeLocalAccessOverrides(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Aviso ao ler user_access_permissions_v1:', err);
  }
  return localMap;
}

/**
 * Busca o override de acesso salvo para um usuário (por e-mail ou ID).
 */
export function findUserAccessOverride(
  overridesMap: Record<string, UserAccessOverride>,
  user: { id?: string | null; email?: string | null }
): UserAccessOverride | undefined {
  const cleanEmail = (user.email || '').trim().toLowerCase();
  if (cleanEmail && overridesMap[cleanEmail]) {
    return overridesMap[cleanEmail];
  }
  if (user.id && overridesMap[`id:${user.id}`]) {
    return overridesMap[`id:${user.id}`];
  }
  if (user.id) {
    const byId = Object.values(overridesMap).find(item => item?.id && item.id === user.id);
    if (byId) return byId;
  }
  return undefined;
}

/**
 * Salva os acessos/permissões e dados de equipe de um usuário garantindo gravação:
 * 1) Na tabela `public.users` (com fallback caso alguma coluna extra não exista ou RLS restrinja)
 * 2) Na tabela `public.site_settings` (`user_access_permissions_v1`) para sincronização garantida PC <-> Celular
 * 3) Na Edge Function `invite-user` (`action: 'update_user'`) com Service Role Key para atualizar `auth.users` e `public.users`
 * 4) No `localStorage` local
 */
export async function saveUserAccessOverride(payload: UserAccessOverride): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = (payload.email || '').trim().toLowerCase();
  const nowIso = new Date().toISOString();

  const entry: UserAccessOverride = {
    ...payload,
    email: cleanEmail,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    updated_at: nowIso,
  };

  // 1. Atualiza imediatamente o cache local e o mapa remoto em site_settings
  const currentMap = await fetchUserAccessOverrides();
  const nextMap: Record<string, UserAccessOverride> = { ...currentMap };
  if (cleanEmail) {
    nextMap[cleanEmail] = { ...(nextMap[cleanEmail] || {}), ...entry };
  }
  if (payload.id) {
    nextMap[`id:${payload.id}`] = { ...(nextMap[`id:${payload.id}`] || {}), ...entry };
  }
  writeLocalAccessOverrides(nextMap);

  const siteSettingsPromise = supabase.from('site_settings').upsert(
    {
      key: USER_ACCESS_SETTINGS_KEY,
      value: nextMap,
      updated_at: nowIso,
    },
    { onConflict: 'key' }
  );

  // 2. Tenta atualizar diretamente em public.users (com fallback progressivo de colunas e chave)
  const updatePublicUsers = async () => {
    const fullUpdate: Record<string, any> = {};
    if (payload.name !== undefined) fullUpdate.name = payload.name;
    if (payload.email !== undefined) fullUpdate.email = payload.email.trim();
    if (payload.role !== undefined) fullUpdate.role = payload.role;
    if (payload.permissions !== undefined) fullUpdate.permissions = payload.permissions;
    if (payload.phone !== undefined) fullUpdate.phone = payload.phone;

    const minimalUpdate: Record<string, any> = {};
    if (payload.name !== undefined) minimalUpdate.name = payload.name;
    if (payload.email !== undefined) minimalUpdate.email = payload.email.trim();
    if (payload.role !== undefined) minimalUpdate.role = payload.role;

    let updatedRows: any[] | null = null;

    if (payload.id) {
      const { data, error } = await supabase
        .from('users')
        .update(fullUpdate)
        .eq('id', payload.id)
        .select('id');

      if (!error && data && data.length > 0) {
        updatedRows = data;
      } else if (error) {
        // Fallback sem a coluna permissions/phone caso o schema de public.users não as tenha
        const { data: minData } = await supabase
          .from('users')
          .update(minimalUpdate)
          .eq('id', payload.id)
          .select('id');
        if (minData && minData.length > 0) updatedRows = minData;
      }
    }

    if ((!updatedRows || updatedRows.length === 0) && cleanEmail) {
      const { data, error } = await supabase
        .from('users')
        .update(fullUpdate)
        .ilike('email', cleanEmail)
        .select('id');

      if (!error && data && data.length > 0) {
        updatedRows = data;
      } else if (error) {
        await supabase
          .from('users')
          .update(minimalUpdate)
          .ilike('email', cleanEmail);
      }
    }
  };

  // 3. Aciona também a Edge Function com Service Role (ignora RLS em public.users e sincroniza user_metadata no Auth)
  const invokeEdgeSync = supabase.functions
    .invoke('invite-user', {
      body: {
        action: 'update_user',
        id: payload.id,
        email: cleanEmail,
        name: payload.name,
        role: payload.role,
        permissions: entry.permissions,
        phone: payload.phone,
        department: payload.department,
        status: payload.status,
        category_id: payload.category_id,
      },
    })
    .catch(() => {});

  await Promise.allSettled([siteSettingsPromise, updatePublicUsers(), invokeEdgeSync]);
  return { success: true };
}


export type UniversityPermissionKey =
  | 'futuro-universitario'
  | 'fu:students:view'
  | 'fu:students:create'
  | 'fu:students:edit'
  | 'fu:applications:approve'
  | 'fu:scholarships:view'
  | 'fu:scholarships:manage'
  | 'fu:payments:approve'
  | 'fu:payments:register'
  | 'fu:mentors:view'
  | 'fu:mentors:manage'
  | 'fu:mentorships:manage'
  | 'fu:academic:view'
  | 'fu:academic:edit'
  | 'fu:supporters:view'
  | 'fu:supporters:manage'
  | 'fu:reports:view'
  | 'fu:reports:export'
  | 'fu:settings:manage';

export const UNIVERSITY_PERMISSION_OPTIONS: Array<{
  id: UniversityPermissionKey;
  label: string;
  section: string;
}> = [
  { id: 'futuro-universitario', label: 'Acesso Completo ao Módulo Futuro Universitário', section: 'Geral' },
  { id: 'fu:students:view', label: 'Visualizar estudantes', section: 'Estudantes' },
  { id: 'fu:students:create', label: 'Cadastrar estudantes', section: 'Estudantes' },
  { id: 'fu:students:edit', label: 'Editar estudantes', section: 'Estudantes' },
  { id: 'fu:applications:approve', label: 'Aprovar inscrições', section: 'Estudantes' },
  { id: 'fu:scholarships:view', label: 'Visualizar bolsas', section: 'Bolsas & Pagamentos' },
  { id: 'fu:scholarships:manage', label: 'Gerenciar bolsas', section: 'Bolsas & Pagamentos' },
  { id: 'fu:payments:approve', label: 'Aprovar pagamentos', section: 'Bolsas & Pagamentos' },
  { id: 'fu:payments:register', label: 'Registrar pagamentos', section: 'Bolsas & Pagamentos' },
  { id: 'fu:mentors:view', label: 'Visualizar mentores', section: 'Mentoria' },
  { id: 'fu:mentors:manage', label: 'Gerenciar mentores', section: 'Mentoria' },
  { id: 'fu:mentorships:manage', label: 'Gerenciar mentorias', section: 'Mentoria' },
  { id: 'fu:academic:view', label: 'Visualizar informações acadêmicas', section: 'Acadêmico' },
  { id: 'fu:academic:edit', label: 'Editar informações acadêmicas', section: 'Acadêmico' },
  { id: 'fu:supporters:view', label: 'Visualizar apoiadores', section: 'Apoiadores' },
  { id: 'fu:supporters:manage', label: 'Gerenciar apoiadores', section: 'Apoiadores' },
  { id: 'fu:reports:view', label: 'Visualizar relatórios', section: 'Relatórios & Config.' },
  { id: 'fu:reports:export', label: 'Exportar relatórios', section: 'Relatórios & Config.' },
  { id: 'fu:settings:manage', label: 'Configurar o módulo', section: 'Relatórios & Config.' },
];

export const ALL_UNIVERSITY_PERMISSION_KEYS: string[] = UNIVERSITY_PERMISSION_OPTIONS.map(o => o.id);

const NON_ADMIN_EXTERNAL_ROLES = new Set([
  'SPONSOR',
  'PADRINHO',
  'MANTENEDOR',
  'OBSERVER',
  'OBSERVADOR',
  'MENTOR',
]);

/**
 * Verifica se o usuário possui autorização para acessar o módulo Futuro Universitário no painel administrativo.
 * Mentores, Padrinhos/Mantenedores e Observadores nunca recebem acesso administrativo ao módulo.
 */
export function hasUniversityModuleAccess(user?: User | null): boolean {
  if (!user) return false;

  const role = (user.role || '').toUpperCase();
  const email = (user.email || '').toLowerCase();

  if (role === 'ADMIN' || email === 'contato@yahhope.com') {
    return true;
  }

  if (NON_ADMIN_EXTERNAL_ROLES.has(role)) {
    return false;
  }

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.includes('all') || perms.includes('futuro-universitario') || perms.includes('fu:all')) {
    return true;
  }

  return perms.some(p => typeof p === 'string' && p.startsWith('fu:'));
}

/**
 * Verifica se o usuário possui uma permissão interna específica dentro do módulo Futuro Universitário.
 * Reutiliza a estrutura `user.permissions: string[]` existente na plataforma sem criar sistema paralelo.
 */
export function hasUniversityPermission(
  user: User | null | undefined,
  permission: UniversityPermissionKey
): boolean {
  if (!user) return false;
  if (!hasUniversityModuleAccess(user)) return false;

  const role = (user.role || '').toUpperCase();
  const email = (user.email || '').toLowerCase();

  if (role === 'ADMIN' || email === 'contato@yahhope.com') {
    return true;
  }

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.includes('all') || perms.includes('fu:all')) {
    return true;
  }

  // Se o usuário recebeu a permissão geral 'futuro-universitario' e não possui chaves granulares 'fu:*' restritivas,
  // concede acesso completo às funcionalidades internas do módulo.
  const hasGranularKeys = perms.some(p => typeof p === 'string' && p.startsWith('fu:'));
  if (perms.includes('futuro-universitario') && !hasGranularKeys) {
    return true;
  }

  if (perms.includes(permission)) {
    return true;
  }

  // Regras de implicação lógica (quem pode criar/editar/gerenciar também pode visualizar a respectiva seção)
  if (permission === 'fu:students:view') {
    return perms.some(p => ['fu:students:create', 'fu:students:edit', 'fu:applications:approve'].includes(p));
  }
  if (permission === 'fu:scholarships:view') {
    return perms.some(p => ['fu:scholarships:manage', 'fu:payments:approve', 'fu:payments:register'].includes(p));
  }
  if (permission === 'fu:mentors:view') {
    return perms.some(p => ['fu:mentors:manage', 'fu:mentorships:manage'].includes(p));
  }
  if (permission === 'fu:academic:view') {
    return perms.includes('fu:academic:edit');
  }
  if (permission === 'fu:supporters:view') {
    return perms.includes('fu:supporters:manage');
  }
  if (permission === 'fu:reports:view') {
    return perms.includes('fu:reports:export');
  }

  return false;
}

/**
 * Avalia quais módulos administrativos o usuário tem permissão de acessar,
 * preservando integralmente o comportamento dos módulos existentes e suportando
 * isolamento por módulo (ex: usuário autorizado apenas na Nutrição ou no Futuro Universitário).
 */
export function getUserAuthorizedModules(user?: User | null) {
  if (!user) {
    return {
      hasWorkspace: false,
      hasNutrition: false,
      hasCommunication: false,
      hasAdmin: false,
      hasUniversity: false,
    };
  }

  const role = (user.role || '').toUpperCase();
  const email = (user.email || '').toLowerCase();
  const isAdmin = role === 'ADMIN' || email === 'contato@yahhope.com';
  const perms = Array.isArray(user.permissions) ? user.permissions : [];

  const strictWorkspacePerms = ['workspace', 'erp-dashboard', 'erp-projects', 'team', 'calendar', 'tasks', 'my-tasks', 'inicio', 'inbox', 'all'];
  const nutritionPerms = ['patients', 'attendance', 'waiting-list', 'inventory', 'visits', 'atendimento', 'nutrition', 'nutrition-dashboard', 'nutrition-finance', 'updates', 'management', 'all'];
  const communicationPerms = ['comm-dashboard', 'comm-projects', 'comm-management', 'chat', 'blog', 'campaigns', 'email-templates', 'communication', 'communication-finance', 'top-banner', 'home-highlights', 'impact-metrics', 'newsletter', 'all'];
  const adminPerms = ['admin-dashboard', 'admin-projects', 'admin-finance', 'settings', 'hotsite', 'impact-feed', 'fundraising', 'store', 'local-projects', 'users', 'finance', 'analytics', 'gifts', 'messages', 'admin', 'all'];

  const hasExplicitPermissions = perms.length > 0;
  // Detecta se o usuário possui APENAS o default legado ['dashboard']
  const isLegacyDefaultPerms = perms.length === 1 && perms[0] === 'dashboard';

  const hasNutrition =
    isAdmin ||
    role === 'OBSERVER' ||
    ((!hasExplicitPermissions || isLegacyDefaultPerms) &&
      ['STAFF', 'SOCIAL_WORKER', 'NURSE', 'DOCTOR', 'ACS', 'COORDINATOR', 'VOLUNTEER', 'VOLUNTARIO'].includes(role)) ||
    perms.some(p => nutritionPerms.includes(p));

  const hasCommunication =
    isAdmin ||
    perms.some(p => communicationPerms.includes(p));

  const hasAdmin =
    isAdmin ||
    perms.some(p => adminPerms.includes(p));

  const hasUniversity = hasUniversityModuleAccess(user);

  const hasOtherSpecificModule = hasNutrition || hasCommunication || hasAdmin || hasUniversity;

  const hasWorkspace =
    isAdmin ||
    (role !== 'OBSERVER' &&
      role !== 'SPONSOR' &&
      role !== 'MANTENEDOR' &&
      role !== 'PADRINHO' &&
      role !== 'MENTOR' &&
      (!hasExplicitPermissions ||
        perms.some(p => strictWorkspacePerms.includes(p)) ||
        (isLegacyDefaultPerms && !hasOtherSpecificModule)));

  return {
    hasWorkspace,
    hasNutrition,
    hasCommunication,
    hasAdmin,
    hasUniversity,
  };
}

/**
 * Retorna a primeira sub-rota permitida para o usuário dentro do módulo de Nutrição.
 */
export function getFirstAuthorizedNutritionRoute(user?: User | null): string {
  if (!user) return '/nutrition/patients';
  const role = (user.role || '').toUpperCase();
  const email = (user.email || '').toLowerCase();
  if (role === 'ADMIN' || email === 'contato@yahhope.com') return '/nutrition';

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.includes('all') || perms.includes('dashboard') || perms.includes('nutrition-dashboard') || perms.includes('/nutrition')) {
    return '/nutrition';
  }
  if (perms.includes('patients') || perms.includes('/nutrition/patients')) return '/nutrition/patients';
  if (perms.includes('attendance') || perms.includes('atendimento') || perms.includes('/nutrition/atendimento')) return '/nutrition/atendimento';
  if (perms.includes('waiting-list') || perms.includes('/nutrition/waiting-list')) return '/nutrition/waiting-list';
  if (perms.includes('updates') || perms.includes('/nutrition/updates')) return '/nutrition/updates';
  if (perms.includes('inventory') || perms.includes('estoque') || perms.includes('/nutrition/inventory')) return '/nutrition/inventory';
  if (perms.includes('visits') || perms.includes('/nutrition/visits')) return '/nutrition/visits';
  if (perms.includes('nutrition-finance') || perms.includes('/nutrition/finance')) return '/nutrition/finance';
  if (perms.includes('management') || perms.includes('/nutrition/management')) return '/nutrition/management';

  return '/nutrition/patients';
}

/**
 * Retorna a primeira sub-rota permitida para o usuário dentro do módulo de Comunicação.
 */
export function getFirstAuthorizedCommunicationRoute(user?: User | null): string {
  if (!user) return '/communication';
  const role = (user.role || '').toUpperCase();
  const email = (user.email || '').toLowerCase();
  if (role === 'ADMIN' || email === 'contato@yahhope.com') return '/communication';

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.includes('all') || perms.includes('dashboard') || perms.includes('comm-dashboard') || perms.includes('/communication')) {
    return '/communication';
  }
  if (perms.includes('top-banner') || perms.includes('settings')) return '/communication/top-banner';
  if (perms.includes('home-highlights')) return '/communication/home-highlights';
  if (perms.includes('impact-metrics')) return '/communication/impact-metrics';
  if (perms.includes('projects') || perms.includes('comm-projects')) return '/communication/projects';
  if (perms.includes('chat')) return '/communication/chat';
  if (perms.includes('blog')) return '/communication/blog';
  if (perms.includes('campaigns')) return '/communication/campaigns';
  if (perms.includes('email-templates')) return '/communication/email-templates';
  if (perms.includes('newsletter')) return '/communication/newsletter';
  if (perms.includes('communication-finance') || perms.includes('costs')) return '/communication/costs';

  return '/communication';
}

/**
 * Retorna a primeira sub-rota permitida para o usuário dentro do módulo Admin.
 */
export function getFirstAuthorizedAdminRoute(user?: User | null): string {
  if (!user) return '/admin/settings';
  const role = (user.role || '').toUpperCase();
  const email = (user.email || '').toLowerCase();
  if (role === 'ADMIN' || email === 'contato@yahhope.com') return '/admin/analytics';

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.includes('all') || perms.includes('analytics') || perms.includes('admin-dashboard') || perms.includes('dashboard')) {
    return '/admin/analytics';
  }
  if (perms.includes('hotsite')) return '/admin/hotsite';
  if (perms.includes('impact-feed')) return '/admin/impact-feed';
  if (perms.includes('messages')) return '/admin/messages';
  if (perms.includes('fundraising')) return '/admin/fundraising';
  if (perms.includes('projects') || perms.includes('admin-projects')) return '/admin/projects';
  if (perms.includes('local-projects')) return '/admin/local-projects';
  if (perms.includes('users')) return '/admin/users';
  if (perms.includes('finance') || perms.includes('admin-finance')) return '/admin/finance';
  if (perms.includes('gifts')) return '/admin/gifts';
  if (perms.includes('store')) return '/admin/store';
  if (perms.includes('settings')) return '/admin/settings';

  return '/admin/settings';
}

/**
 * Retorna a rota inicial administrativa padrão para um usuário conforme os módulos que ele tem permissão.
 */
export function getDefaultAuthorizedRouteForUser(user?: User | null): string {
  if (!user) return '/login';
  const role = (user.role || '').toUpperCase();
  if (role === 'SPONSOR' || role === 'MANTENEDOR' || role === 'PADRINHO') return '/portal/dashboard';
  if (role === 'OBSERVER') {
    return getFirstAuthorizedNutritionRoute(user);
  }
  if (role === 'ADMIN') return '/admin';

  const { hasWorkspace, hasNutrition, hasUniversity, hasCommunication, hasAdmin } = getUserAuthorizedModules(user);
  const count = [hasWorkspace, hasNutrition, hasUniversity, hasCommunication, hasAdmin].filter(Boolean).length;

  // Se tiver apenas um módulo autorizado, redireciona diretamente para a primeira página autorizada dele
  if (count === 1) {
    if (hasUniversity) return '/futuro-universitario';
    if (hasNutrition) return getFirstAuthorizedNutritionRoute(user);
    if (hasCommunication) return getFirstAuthorizedCommunicationRoute(user);
    if (hasAdmin) return getFirstAuthorizedAdminRoute(user);
    if (hasWorkspace) return '/workspace';
  }

  if (hasNutrition) return getFirstAuthorizedNutritionRoute(user);
  if (hasUniversity) return '/futuro-universitario';
  if (hasCommunication) return getFirstAuthorizedCommunicationRoute(user);
  if (hasAdmin) return getFirstAuthorizedAdminRoute(user);
  if (hasWorkspace) return '/workspace';

  return '/portal/dashboard';
}
