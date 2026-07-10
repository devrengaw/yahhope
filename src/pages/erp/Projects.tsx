import React, { useState } from 'react';
import { Briefcase, Plus, LayoutGrid, Kanban, List } from 'lucide-react';
import { ProjectSummary } from '../../components/erp/projects/ProjectSummary';
import { ProjectList } from '../../components/erp/projects/ProjectList';
import { ProjectKanban } from '../../components/erp/projects/ProjectKanban';
import { ProjectTableView } from '../../components/erp/projects/ProjectTableView';
import { ProjectModal } from '../../components/erp/projects/ProjectModal';
import { ProjectDetails } from '../../components/erp/projects/ProjectDetails';
import { Project } from '../../lib/mockData';
import { useProjects } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';

export function Projects({ workspaceMode = false }: { workspaceMode?: boolean }) {
  const { projects, addProject, updateProject } = useProjects();
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleSaveProject = (newProject: Project) => {
    addProject(newProject);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    updateProject(updatedProject.id, updatedProject);
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  const visibleProjects = projects.filter(p => {
    // Check if user is participating
    const isInvitee = p.invitees.includes(user?.id || '') || p.invitees.includes(user?.name || '');
    let isAssigned = false;
    if (!isInvitee) {
      const peopleColumns = (p.columns || []).filter(c => c.type === 'people').map(c => c.id);
      isAssigned = p.tasks.some(t => {
        return peopleColumns.some(colId => {
          const assigned = t.values?.[colId] || [];
          return assigned.includes(user?.id) || assigned.includes(user?.name);
        });
      });
    }
    
    const isParticipating = isInvitee || isAssigned;

    if (workspaceMode) {
      return isParticipating;
    }

    // In global mode (admin), show all non-private projects OR private projects the user participates in
    if (!p.isPrivate) return true;
    return isParticipating;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="text-blue-600" size={28} />
            Projetos
          </h1>
          <p className="text-slate-500 mt-1">Gestão de projetos e iniciativas da YAHope</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Grade"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização Kanban"
            >
              <Kanban size={20} />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-grow sm:flex-grow-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Novo Projeto
          </button>
        </div>
      </div>

      <ProjectSummary projects={visibleProjects} />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold text-slate-900">Seus Projetos</h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">
            {viewMode === 'grid' ? 'Grade' : viewMode === 'list' ? 'Lista' : 'Kanban'}
          </span>
        </div>
        
        {viewMode === 'grid' && (
          <ProjectList projects={visibleProjects} onProjectClick={setSelectedProject} />
        )}
        {viewMode === 'list' && (
          <ProjectTableView projects={visibleProjects} onProjectClick={setSelectedProject} />
        )}
        {viewMode === 'kanban' && (
          <ProjectKanban projects={visibleProjects} onProjectClick={setSelectedProject} />
        )}
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
      />

      {selectedProject && (
        <ProjectDetails 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
          onUpdateProject={handleUpdateProject}
        />
      )}
    </div>
  );
}
