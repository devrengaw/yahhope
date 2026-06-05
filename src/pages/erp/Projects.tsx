import React, { useState } from 'react';
import { Briefcase, Plus, LayoutGrid, Kanban, List } from 'lucide-react';
import { ProjectSummary } from '../../components/erp/projects/ProjectSummary';
import { ProjectList } from '../../components/erp/projects/ProjectList';
import { ProjectKanban } from '../../components/erp/projects/ProjectKanban';
import { ProjectTableView } from '../../components/erp/projects/ProjectTableView';
import { ProjectModal } from '../../components/erp/projects/ProjectModal';
import { ProjectDetails } from '../../components/erp/projects/ProjectDetails';
import { mockProjects, Project } from '../../lib/mockData';

const CURRENT_USER_ID = '1';

export function Projects() {
  const [projects, setProjects] = useState<Project[]>(
    [...mockProjects].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
