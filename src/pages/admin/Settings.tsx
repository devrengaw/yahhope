import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Shield, 
  Globe, 
  Briefcase, 
  Plus, 
  LayoutGrid, 
  Kanban, 
  List,
  Mail,
  Camera,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { UserCategorySettings } from '../../components/admin/UserCategorySettings';
import { ProjectSummary } from '../../components/erp/projects/ProjectSummary';
import { ProjectList } from '../../components/erp/projects/ProjectList';
import { ProjectKanban } from '../../components/erp/projects/ProjectKanban';
import { ProjectTableView } from '../../components/erp/projects/ProjectTableView';
import { ProjectModal } from '../../components/erp/projects/ProjectModal';
import { ProjectDetails } from '../../components/erp/projects/ProjectDetails';
import { TeamSummary } from '../../components/erp/team/TeamSummary';
import { TeamList } from '../../components/erp/team/TeamList';
import { TeamMemberModal } from '../../components/erp/team/TeamMemberModal';
import { mockProjects, Project, mockTeamMembers, TeamMember } from '../../lib/mockData';
import { useLocation } from 'react-router-dom';

type SettingsTab = 'general' | 'projects' | 'users' | 'user-categories';

const CURRENT_USER_ID = '1';

export function Settings() {
  const location = useLocation();
  
  // Determine active tab based on URL path
  const getActiveTab = (): SettingsTab => {
    const path = location.pathname;
    if (path.includes('/projects')) return 'projects';
    if (path.includes('/users')) return 'users';
    if (path.includes('/categories')) return 'user-categories';
    if (path.includes('/settings')) return 'general';
    return 'projects'; // Default
  };

  const activeTab = getActiveTab();
  
  // Organization State
  const [orgInfo, setOrgInfo] = useState({
    name: 'YAH Hope International',
    website: 'https://yahhope.org',
    email: 'contato@yahhope.org',
    phone: '+55 11 99999-9999',
    address: 'Rua da Esperança, 123 - São Paulo, SP',
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR'
  });

  // Project State
  const [projects, setProjects] = useState<Project[]>(
    [...mockProjects].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // User/Team State
  const [members, setMembers] = useState<TeamMember[]>(
    [...mockTeamMembers].sort((a, b) => new Date(b.join_date).getTime() - new Date(a.join_date).getTime())
  );
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Handlers
  const handleOrgChange = (field: string, value: string) => {
    setOrgInfo(prev => ({ ...prev, [field]: value }));
  };

  // Project Handlers
  const handleSaveProject = (newProject: Project) => {
    const updated = [newProject, ...projects].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    setProjects(updated);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    const updated = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    setProjects(updated);
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  const visibleProjects = projects.filter(p => !p.isPrivate || p.invitees.includes(CURRENT_USER_ID));

  // User Handlers
  const handleSaveMember = (newMember: Omit<TeamMember, 'id'>) => {
    if (selectedMember) {
      // Update existing
      const updated = members.map(m => m.id === selectedMember.id ? { ...newMember, id: selectedMember.id } : m);
      setMembers(updated);
      setSelectedMember(null);
    } else {
      // Create new
      const member: TeamMember = {
        ...newMember,
        id: Math.random().toString(36).substring(2, 9),
      };
      const updated = [member, ...members].sort((a, b) => 
        new Date(b.join_date).getTime() - new Date(a.join_date).getTime()
      );
      setMembers(updated);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsUserModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-xl">
                <Shield className="text-white" size={24} />
              </div>
              YAH Hope Central
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Gestão administrativa e configurações globais.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === 'projects' && (
              <>
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center shrink-0">
                  <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20} /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}><List size={20} /></button>
                  <button onClick={() => setViewMode('kanban')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}><Kanban size={20} /></button>
                </div>
                <button onClick={() => setIsProjectModalOpen(true)} className="flex-grow sm:flex-grow-0 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-200">
                  <Plus size={20} /> Novo Projeto
                </button>
              </>
            )}
            {activeTab === 'users' && (
              <button onClick={() => setIsUserModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-[1.25rem] font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-200 w-full sm:w-auto justify-center">
                <Plus size={20} /> Novo Usuário
              </button>
            )}
            {activeTab === 'general' && (
              <button className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-[1.25rem] font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-200 w-full sm:w-auto justify-center">
                <Save size={20} /> Salvar Alterações
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[600px]">
          {activeTab === 'projects' && (
            <div className="space-y-8">
              <ProjectSummary projects={visibleProjects} />
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-8 text-left">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Projetos Ativos</h2>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] border border-slate-100">Visualização em {viewMode}</span>
                </div>
                {viewMode === 'grid' && <ProjectList projects={visibleProjects} onProjectClick={setSelectedProject} />}
                {viewMode === 'list' && <ProjectTableView projects={visibleProjects} onProjectClick={setSelectedProject} />}
                {viewMode === 'kanban' && <ProjectKanban projects={visibleProjects} onProjectClick={setSelectedProject} />}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              <TeamSummary members={members} />
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50">
                <h2 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tighter text-left">Diretório Global de Usuários</h2>
                <TeamList 
                  members={members} 
                  onEdit={handleEditMember}
                  onDelete={handleDeleteMember}
                />
              </div>
            </div>
          )}

          {activeTab === 'user-categories' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50">
              <UserCategorySettings />
            </div>
          )}

          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center group">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center p-6 border-2 border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                      <Globe className="text-slate-200" size={60} />
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-slate-800 transition-colors border-4 border-white active:scale-90">
                      <Camera size={20} />
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{orgInfo.name}</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Organização Global</p>
                  <div className="w-full mt-8 pt-8 border-t border-slate-50 space-y-4 text-left">
                    <div className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group/link">
                      <div className="p-2 bg-slate-50 rounded-xl group-hover/link:bg-slate-100"><ExternalLink size={16} /></div>
                      <span className="text-xs font-bold uppercase tracking-wider truncate">{orgInfo.website}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors">
                      <div className="p-2 bg-slate-50 rounded-xl"><Mail size={16} /></div>
                      <span className="text-xs font-bold uppercase tracking-wider truncate">{orgInfo.email}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 overflow-hidden relative group">
                  <div className="relative z-10 text-white">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-4">Informações Legais</h4>
                    <div className="space-y-6">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telefone Principal</p>
                        <p className="font-bold text-lg tracking-tight">{orgInfo.phone}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Endereço Sede</p>
                        <p className="text-sm font-medium leading-relaxed text-slate-200">{orgInfo.address}</p>
                      </div>
                    </div>
                  </div>
                  <Globe className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-white/10 transition-colors" size={200} />
                </div>
              </div>
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50">
                  <div className="flex items-center gap-3 mb-8 px-2">
                    <Globe className="text-slate-900" size={24} />
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Perfil da Organização</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nome da Organização</label><input type="text" value={orgInfo.name} onChange={(e) => handleOrgChange('name', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-100 transition-all text-sm outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Website</label><div className="relative group"><LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900" size={18} /><input type="text" value={orgInfo.website} onChange={(e) => handleOrgChange('website', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-5 py-4 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-100 transition-all text-sm outline-none" /></div></div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Idioma Padrão</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-100 transition-all text-sm outline-none appearance-none cursor-pointer">
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fuso Horário</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-100 transition-all text-sm outline-none appearance-none cursor-pointer">
                        <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                        <option value="UTC">UTC (Universal)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200 overflow-hidden relative group">
                  <div className="relative z-10">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-4">Informação do Sistema</h4>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed">
                      Este painel centraliza as configurações globais da sua instância YAH Hope.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={handleSaveProject} />
      {selectedProject && <ProjectDetails project={selectedProject} onClose={() => setSelectedProject(null)} onUpdateProject={handleUpdateProject} />}
      <TeamMemberModal 
        isOpen={isUserModalOpen} 
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedMember(null);
        }} 
        onSave={handleSaveMember}
        editingMember={selectedMember}
      />
    </div>
  );
}
