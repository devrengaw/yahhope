import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Globe, CheckCircle, Clock } from 'lucide-react';
import { YAHHopeProject, mockYAHHopeProjects } from '../../lib/mockData';
import { LocalProjectModal } from './LocalProjectModal';

export function LocalProjectsSettings() {
  const [projects, setProjects] = useState<YAHHopeProject[]>(mockYAHHopeProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<YAHHopeProject | null>(null);

  const handleSave = (newProjectData: Omit<YAHHopeProject, 'id' | 'created_at'>) => {
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...newProjectData } : p));
    } else {
      const newProject: YAHHopeProject = {
        ...newProjectData,
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      };
      setProjects([newProject, ...projects]);
    }
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleEdit = (project: YAHHopeProject) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto local?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const openNewModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider"><Globe size={14} /> Ativo</span>;
      case 'planned':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider"><Clock size={14} /> Planejado</span>;
      case 'completed':
        return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider"><CheckCircle size={14} /> Concluído</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Projetos Locais YAH Hope</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Gerencie os projetos locais exibidos na página pública.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <Plus size={18} /> Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
            <div className="h-48 overflow-hidden relative">
              <img 
                src={project.image_url} 
                alt={project.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute top-4 right-4">
                {getStatusBadge(project.status)}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">{project.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-grow">{project.description}</p>
              
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handleEdit(project)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(project.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Globe className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Nenhum projeto cadastrado</h3>
            <p className="text-slate-500 max-w-sm mt-2">Clique no botão "Novo Projeto" para adicionar o primeiro projeto local da YAH Hope.</p>
          </div>
        )}
      </div>

      <LocalProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingProject={editingProject}
      />
    </div>
  );
}
