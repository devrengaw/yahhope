import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TeamMember, TeamMemberRole, TeamMemberStatus } from '../../../lib/mockData';
import { supabase } from '../../../lib/supabase';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<TeamMember, 'id'>) => Promise<void> | void;
  editingMember?: TeamMember | null;
}

export function TeamMemberModal({ isOpen, onClose, onSave, editingMember }: TeamMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<TeamMemberRole>('volunteer');
  const [status, setStatus] = useState<TeamMemberStatus>('active');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['dashboard']);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      supabase.from('user_categories').select('id, name').order('name').then(({ data }) => {
        if (data) setCategories(data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setEmail(editingMember.email);
      setPhone(editingMember.phone === '-' ? '' : (editingMember.phone || ''));
      setRole(editingMember.role);
      setStatus(editingMember.status);
      setJoinDate(editingMember.join_date);
      setDepartment(editingMember.department || '');
      setCategoryId(editingMember.category_id || '');
      const existingPerms = Array.isArray(editingMember.permissions) ? editingMember.permissions : [];
      if (existingPerms.length > 0) {
        setSelectedPermissions(existingPerms);
      } else if (String(editingMember.role).toLowerCase() === 'observer') {
        setSelectedPermissions(['patients']);
      } else {
        setSelectedPermissions(['dashboard']);
      }
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('volunteer');
      setStatus('active');
      setJoinDate(new Date().toISOString().split('T')[0]);
      setDepartment('');
      setCategoryId('');
      setSelectedPermissions(['dashboard']);
    }
  }, [editingMember, isOpen]);

  const moduleGroups = [
    {
      name: 'Gestão YAH Hope (Admin)',
      modules: [
        { id: 'analytics', label: 'Dashboard de Acessos' },
        { id: 'hotsite', label: 'Hotsite da Campanha' },
        { id: 'impact-feed', label: 'Feed de Impacto' },
        { id: 'messages', label: 'Mensagens' },
        { id: 'fundraising', label: 'Financeiro (Captação)' },
        { id: 'admin-projects', label: 'Projetos Globais' },
        { id: 'local-projects', label: 'Projetos Locais' },
        { id: 'users', label: 'Usuários' },
        { id: 'admin-finance', label: 'Financeiro' },
        { id: 'gifts', label: 'Presentes' },
        { id: 'store', label: 'Gestão da Loja' },
        { id: 'settings', label: 'Configurações' },
      ]
    },
    {
      name: 'Comunicação',
      modules: [
        { id: 'comm-dashboard', label: 'Dashboard' },
        { id: 'top-banner', label: 'Aviso do Topo' },
        { id: 'home-highlights', label: 'Destaques Home' },
        { id: 'impact-metrics', label: 'Cards de Impacto' },
        { id: 'comm-projects', label: 'Projetos' },
        { id: 'chat', label: 'Chat' },
        { id: 'blog', label: 'Blog' },
        { id: 'campaigns', label: 'Disparo de E-mails' },
        { id: 'email-templates', label: 'Templates de email' },
        { id: 'newsletter', label: 'Inscritos na Newsletter' },
        { id: 'communication-finance', label: 'Custos Fixos e Variados' },
        { id: 'comm-management', label: 'Gestão' },
      ]
    },
    {
      name: 'Nutrição Infantil',
      modules: [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'patients', label: 'Crianças' },
        { id: 'attendance', label: 'Atendimento' },
        { id: 'waiting-list', label: 'Fila de Espera' },
        { id: 'updates', label: 'Atualizações apoiador' },
        { id: 'inventory', label: 'Estoque' },
        { id: 'visits', label: 'Visitas' },
        { id: 'nutrition-finance', label: 'Custos Fixos e Variados (Finanças)' },
        { id: 'management', label: 'Gestão' },
      ]
    },
    {
      name: 'Futuro Universitário',
      modules: [
        { id: 'futuro-universitario', label: 'Acesso Completo ao Módulo' },
        { id: 'fu:students:view', label: 'Visualizar estudantes' },
        { id: 'fu:students:create', label: 'Cadastrar estudantes' },
        { id: 'fu:students:edit', label: 'Editar estudantes' },
        { id: 'fu:applications:approve', label: 'Aprovar inscrições' },
        { id: 'fu:scholarships:view', label: 'Visualizar bolsas' },
        { id: 'fu:scholarships:manage', label: 'Gerenciar bolsas' },
        { id: 'fu:payments:approve', label: 'Aprovar pagamentos' },
        { id: 'fu:payments:register', label: 'Registrar pagamentos' },
        { id: 'fu:mentors:view', label: 'Visualizar mentores' },
        { id: 'fu:mentors:manage', label: 'Gerenciar mentores' },
        { id: 'fu:mentorships:manage', label: 'Gerenciar mentorias' },
        { id: 'fu:academic:view', label: 'Visualizar informações acadêmicas' },
        { id: 'fu:academic:edit', label: 'Editar informações acadêmicas' },
        { id: 'fu:supporters:view', label: 'Visualizar apoiadores' },
        { id: 'fu:supporters:manage', label: 'Gerenciar apoiadores' },
        { id: 'fu:reports:view', label: 'Visualizar relatórios' },
        { id: 'fu:reports:export', label: 'Exportar relatórios' },
        { id: 'fu:settings:manage', label: 'Configurar o módulo' },
      ]
    },
    {
      name: 'Gestão de Projetos (ERP / Workspace)',
      modules: [
        { id: 'workspace', label: 'Meu Workspace / Início' },
        { id: 'my-tasks', label: 'Minhas Tarefas' },
        { id: 'erp-projects', label: 'Projetos' },
        { id: 'calendar', label: 'Agenda' },
        { id: 'inbox', label: 'Caixa de Entrada' },
        { id: 'team', label: 'Equipe' },
      ]
    }
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !joinDate) return;

    setIsSaving(true);
    try {
      await onSave({
        name,
        email,
        phone: phone.trim() || '-',
        role,
        status,
        join_date: joinDate,
        department,
        category_id: categoryId || undefined,
        permissions: role === 'observer'
          ? (selectedPermissions.length > 0 ? selectedPermissions : ['patients'])
          : selectedPermissions
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {editingMember ? 'Editar Membro da Equipe' : 'Novo Membro da Equipe'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="joao@yahope.org"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+55 11 99999-9999"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
              <select
                value={role}
                onChange={e => {
                  const newRole = e.target.value as TeamMemberRole;
                  setRole(newRole);
                  if (newRole === 'observer') {
                    setSelectedPermissions(['patients']);
                  }
                }}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                required
              >
                <option value="volunteer">Voluntário(a)</option>
                <option value="social_worker">Assistente Social</option>
                <option value="nurse">Enfermeiro(a)</option>
                <option value="doctor">Médico(a)</option>
                <option value="acs">ACS (Agente Comunitário de Saúde)</option>
                <option value="coordinator">Coordenador(a)</option>
                <option value="observer">Observador(a) de Saúde</option>
                <option value="admin">Administrador(a)</option>
                <option value="SPONSOR">Padrinho (Site)</option>
                <option value="MANTENEDOR">Mantenedor (Site)</option>
                <option value="USER">Conta do Site (Usuário)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="Ex: Atendimento Clínico"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Entrada</label>
              <input
                type="date"
                value={joinDate}
                onChange={e => setJoinDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TeamMemberStatus)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                required
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="on_leave">Em Licença</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria de Usuário</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
            >
              <option value="">Nenhuma Categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">As categorias são gerenciadas em Configurações Globais.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Acessos Permitidos (Módulos)</label>
              <button
                type="button"
                onClick={() => setSelectedPermissions([])}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Desmarcar todos
              </button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {moduleGroups.map((group) => {
                const groupIds = group.modules.map(m => m.id);
                const allGroupSelected = groupIds.every(id => selectedPermissions.includes(id));

                return (
                <div key={group.name} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800 text-sm">{group.name}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        if (allGroupSelected) {
                          setSelectedPermissions(prev => prev.filter(p => !groupIds.includes(p)));
                        } else {
                          setSelectedPermissions(prev => Array.from(new Set([...prev, ...groupIds])));
                        }
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      {allGroupSelected ? 'Limpar grupo' : 'Marcar todos'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.modules.map(module => (
                      <label key={module.id} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(module.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissions(prev => Array.from(new Set([...prev, module.id])));
                              } else {
                                setSelectedPermissions(prev => prev.filter(p => p !== module.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                          {module.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
            
            <p className="text-[10px] text-slate-500 italic mt-2">Usuários verão apenas os módulos e botões selecionados acima (no computador e no celular).</p>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
