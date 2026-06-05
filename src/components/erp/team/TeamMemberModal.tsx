import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TeamMember, TeamMemberRole, TeamMemberStatus, mockUserCategories } from '../../../lib/mockData';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<TeamMember, 'id'>) => void;
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

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setEmail(editingMember.email);
      setPhone(editingMember.phone);
      setRole(editingMember.role);
      setStatus(editingMember.status);
      setJoinDate(editingMember.join_date);
      setDepartment(editingMember.department || '');
      setCategoryId(editingMember.category_id || '');
      setSelectedPermissions(editingMember.permissions || ['dashboard']);
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

  const availableModules = [
    { id: 'dashboard', label: 'Painel Geral' },
    { id: 'patients', label: 'Pacientes/Beneficiários' },
    { id: 'attendance', label: 'Atendimentos' },
    { id: 'inventory', label: 'Estoque/Suprimentos' },
    { id: 'finance', label: 'Financeiro' },
    { id: 'projects', label: 'Projetos' },
    { id: 'team', label: 'Equipe' },
    { id: 'calendar', label: 'Agenda' },
    { id: 'settings', label: 'Configurações' },
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !phone || !joinDate) return;

    onSave({
      name,
      email,
      phone,
      role,
      status,
      join_date: joinDate,
      department,
      category_id: categoryId || undefined,
      permissions: selectedPermissions
    });
    
    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setRole('volunteer');
    setStatus('active');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setDepartment('');
    setCategoryId('');
    setSelectedPermissions(['dashboard']);
    onClose();
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

          <div className="grid grid-cols-2 gap-4">
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
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as TeamMemberRole)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                required
              >
                <option value="volunteer">Voluntário(a)</option>
                <option value="social_worker">Assistente Social</option>
                <option value="nurse">Enfermeiro(a)</option>
                <option value="doctor">Médico(a)</option>
                <option value="acs">ACS (Agente Comunitário de Saúde)</option>
                <option value="coordinator">Coordenador(a)</option>
                <option value="admin">Administrador(a)</option>
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

          <div className="grid grid-cols-2 gap-4">
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
              {mockUserCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">As categorias são gerenciadas em Configurações Globais.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Acessos Permitidos (Módulos)</label>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {availableModules.map(module => (
                <label key={module.id} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(module.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, module.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== module.id));
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
            <p className="text-[10px] text-slate-500 italic">Usuários verão apenas os módulos selecionados acima.</p>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              {editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
