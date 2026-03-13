import React from 'react';
import { Project, ProjectStatus } from '../../../lib/mockData';
import { PlayCircle, Clock, CheckCircle2, PauseCircle, Calendar } from 'lucide-react';

interface ProjectKanbanProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectKanban({ projects, onProjectClick }: ProjectKanbanProps) {
  const columns: { status: ProjectStatus; label: string; bg: string; text: string; icon: any }[] = [
    { status: 'planning', label: 'Planejamento', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    { status: 'active', label: 'Em Andamento', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: PlayCircle },
    { status: 'on-hold', label: 'Pausado', bg: 'bg-slate-100', text: 'text-slate-600', icon: PauseCircle },
    { status: 'completed', label: 'Concluído', bg: 'bg-purple-50', text: 'text-purple-700', icon: CheckCircle2 },
  ];

  const getProjectCost = (project: Project) => {
    return project.tasks.reduce((acc, task) => acc + task.cost, 0);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 -mx-1 px-1 min-h-[500px]">
      {columns.map(column => {
        const columnProjects = projects.filter(p => p.status === column.status);
        const Icon = column.icon;

        return (
          <div key={column.status} className="flex-shrink-0 w-80 flex flex-col gap-4">
            <div className={`p-3 rounded-xl border border-slate-100 flex items-center justify-between ${column.bg}`}>
              <div className="flex items-center gap-2">
                <Icon size={18} className={column.text} />
                <h3 className={`font-bold ${column.text}`}>{column.label}</h3>
              </div>
              <span className="bg-white/50 px-2.5 py-0.5 rounded-full text-sm font-bold text-slate-600">
                {columnProjects.length}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {columnProjects.length === 0 ? (
                <div className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-sm">
                  Nenhum projeto
                </div>
              ) : (
                columnProjects.map(project => (
                  <div 
                    key={project.id} 
                    onClick={() => onProjectClick(project)}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${
                        project.priority === 'high' ? 'bg-rose-100 text-rose-700' : 
                        project.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {project.priority === 'high' ? 'Alta' : project.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-[4px] uppercase">
                        {project.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{project.name}</h4>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">{project.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500 font-medium">Progresso</span>
                          <span className="text-slate-900 font-bold">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              column.status === 'active' ? 'bg-emerald-500' : 
                              column.status === 'completed' ? 'bg-purple-500' :
                              column.status === 'planning' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <Calendar size={12} />
                          {new Date(project.start_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-[11px] font-bold text-slate-900">
                          R$ {getProjectCost(project).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
