import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Globe, CheckCircle, Clock, Heart, RotateCcw, ExternalLink, CheckCircle2, BookOpen, MapPin, Lock, Image as ImageIcon } from 'lucide-react';
import { YAHHopeProject } from '../../lib/mockData';
import { useWebsiteProjects } from '../../contexts/WebsiteProjectsContext';
import { LocalProjectModal } from './LocalProjectModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import { cn } from '../../lib/utils';

export function LocalProjectsSettings() {
  const { projects, addProject, updateProject, deleteProject, resetToDefaults } = useWebsiteProjects();
  const { confirm } = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<YAHHopeProject | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async (newProjectData: Omit<YAHHopeProject, 'id' | 'created_at'>) => {
    if (editingProject) {
      await updateProject(editingProject.id, newProjectData);
      showToast('Projeto atualizado com sucesso!');
    } else {
      await addProject(newProjectData);
      showToast('Novo projeto cadastrado com sucesso!');
    }
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleEdit = (project: YAHHopeProject) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (await confirm(`Tem certeza que deseja excluir o projeto "${title}"?`)) {
      await deleteProject(id);
      showToast('Projeto excluído.');
    }
  };

  const handleReset = async () => {
    if (await confirm('Deseja restaurar os 4 projetos padrão da YAH Hope (Casa Nutri, Mentoria & Bolsas, Oficinas de Costura e Ação Humanitária)?')) {
      await resetToDefaults();
      showToast('Projetos padrão restaurados!');
    }
  };

  const openNewModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider"><Globe size={12} /> Em Andamento</span>;
      case 'planned':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-wider"><Clock size={12} /> Planejado</span>;
      case 'completed':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider"><CheckCircle size={12} /> Concluído</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-[#92BF78]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F49853] flex items-center justify-center border border-orange-200">
              <Heart size={18} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Projetos Locais & Frentes de Atuação</h2>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Os projetos abaixo são sincronizados em tempo real com a página <strong>/projetos</strong> e a seção <strong>"Frentes de Atuação"</strong> da Landing Page.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            title="Restaurar os 4 projetos padrão da YAH Hope"
          >
            <RotateCcw size={14} />
            <span>Restaurar Padrão</span>
          </button>

          <a 
            href="/projetos" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span>Ver /projetos</span>
            <ExternalLink size={12} className="text-slate-400" />
          </a>

          <button 
            onClick={openNewModal}
            className="bg-[#F49853] hover:bg-[#e0853d] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-orange-500/20 active:scale-95"
          >
            <Plus size={16} /> Novo Projeto
          </button>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="h-48 overflow-hidden relative bg-slate-900">
              <img 
                src={project.image_url} 
                alt={project.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                }}
              />
              <div className="absolute top-3 left-3">
                <span 
                  className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md"
                  style={{ backgroundColor: project.tag_color || '#F49853' }}
                >
                  {project.category || 'Projeto'}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                {getStatusBadge(project.status)}
              </div>
            </div>

            <div className="p-6 flex flex-col flex-grow justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-2 leading-snug line-clamp-2">{project.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-light mb-3">{project.description}</p>

                {/* Badges de recursos cadastrados */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {project.location && (
                    <span 
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                        project.location.toLowerCase().includes('brasil') || project.location.toLowerCase().includes('são paulo')
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      )} 
                      title={`Polo: ${project.location}`}
                    >
                      <span>{project.location.toLowerCase().includes('brasil') || project.location.toLowerCase().includes('são paulo') ? '🇧🇷' : '🇲🇿'}</span>
                      <span className="truncate max-w-[120px]">{project.location}</span>
                    </span>
                  )}
                  {project.full_description && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100" title="Possui história rica detalhada">
                      <BookOpen size={11} />
                      História Completa
                    </span>
                  )}
                  {project.gallery_images && project.gallery_images.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100" title={`${project.gallery_images.length} fotos na galeria`}>
                      <ImageIcon size={11} />
                      {project.gallery_images.length} fotos
                    </span>
                  )}
                  {project.admin_notes && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200" title="Possui anotações internas confidenciais">
                      <Lock size={10} className="text-amber-600" />
                      Nota Interna
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-mono">
                  Link: {project.link || '/projetos'}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEdit(project)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="Editar projeto"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id, project.title)}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Excluir projeto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Globe className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Nenhum projeto cadastrado</h3>
            <p className="text-slate-500 max-w-sm mt-2 text-xs">
              Clique no botão "Novo Projeto" ou "Restaurar Padrão" para recarregar as 4 iniciativas oficiais da YAH Hope.
            </p>
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
