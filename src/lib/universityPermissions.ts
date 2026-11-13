import { User } from '../contexts/AuthContext';

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
 * isolamento por módulo (ex: usuário autorizado apenas no Futuro Universitário).
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

  const workspacePerms = ['workspace', 'projects', 'team', 'calendar', 'tasks', 'my-tasks', 'inicio', 'inbox', 'dashboard', 'all'];
  const nutritionPerms = ['patients', 'attendance', 'waiting-list', 'inventory', 'visits', 'atendimento', 'nutrition', 'nutrition-finance', 'updates', 'all'];
  const communicationPerms = ['projects', 'chat', 'blog', 'campaigns', 'email-templates', 'communication', 'communication-finance', 'top-banner', 'home-highlights', 'impact-metrics', 'newsletter', 'all'];
  const adminPerms = ['settings', 'hotsite', 'impact-feed', 'fundraising', 'store', 'local-projects', 'users', 'finance', 'analytics', 'top-banner', 'home-highlights', 'impact-metrics', 'gifts', 'admin', 'all'];

  const hasExplicitPermissions = perms.length > 0;
  // Detecta se o usuário possui APENAS permissões específicas de módulos restritos (sem o default legado ['dashboard'])
  const isLegacyDefaultPerms = perms.length === 1 && perms[0] === 'dashboard';

  const hasWorkspace =
    isAdmin ||
    (role !== 'OBSERVER' &&
      role !== 'SPONSOR' &&
      role !== 'MENTOR' &&
      (!hasExplicitPermissions || perms.some(p => workspacePerms.includes(p))));

  const hasNutrition =
    isAdmin ||
    role === 'OBSERVER' ||
    ((!hasExplicitPermissions || isLegacyDefaultPerms) &&
      ['STAFF', 'SOCIAL_WORKER', 'NURSE', 'DOCTOR', 'ACS', 'COORDINATOR'].includes(role)) ||
    perms.some(p => nutritionPerms.includes(p));

  const hasCommunication =
    isAdmin ||
    perms.some(p => communicationPerms.includes(p));

  const hasAdmin =
    isAdmin ||
    perms.some(p => adminPerms.includes(p));

  const hasUniversity = hasUniversityModuleAccess(user);

  return {
    hasWorkspace,
    hasNutrition,
    hasCommunication,
    hasAdmin,
    hasUniversity,
  };
}

/**
 * Retorna a rota inicial administrativa padrão para um usuário conforme os módulos que ele tem permissão.
 */
export function getDefaultAuthorizedRouteForUser(user?: User | null): string {
  if (!user) return '/login';
  const role = (user.role || '').toUpperCase();
  if (role === 'SPONSOR' || role === 'MANTENEDOR' || role === 'PADRINHO') return '/portal/dashboard';
  if (role === 'OBSERVER') return '/nutrition/patients';
  if (role === 'ADMIN') return '/admin';

  const { hasWorkspace, hasNutrition, hasUniversity, hasCommunication, hasAdmin } = getUserAuthorizedModules(user);
  const count = [hasWorkspace, hasNutrition, hasUniversity, hasCommunication, hasAdmin].filter(Boolean).length;

  // Se tiver apenas um módulo autorizado, redireciona diretamente para ele
  if (count === 1) {
    if (hasUniversity) return '/futuro-universitario';
    if (hasNutrition) return '/nutrition';
    if (hasCommunication) return '/communication';
    if (hasAdmin) return '/admin/settings';
    if (hasWorkspace) return '/workspace';
  }

  if (hasWorkspace) return '/workspace';
  if (hasUniversity) return '/futuro-universitario';
  if (hasNutrition) return '/nutrition';
  if (hasCommunication) return '/communication';
  if (hasAdmin) return '/admin/settings';

  return '/portal/dashboard';
}
