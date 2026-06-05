import React from 'react';
import { Project, ProjectStatus } from '../../../lib/mockData';
import { Calendar, CheckCircle2, Clock, PauseCircle, PlayCircle } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectList({ projects, onProjectClick }: ProjectListProps) {
  
  const getStatusConfig = (status: ProjectStatus) => {
    // ... same logic ...
  };

  const getProjectCost = (project: Project) => {
    return project.tasks.reduce((acc, task) => acc + task.cost, 0);
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <p className="text-slate-500 mb-2">Nenhum projeto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map(project => {
        const statusConfig = {
          active: { label: 'Em Andamento', icon: PlayCircle, colors: 'bg-emerald-50 text-emerald-700 border-emerald-200', progressColor: 'bg-emerald-500' },
          planning: { label: 'Em Planejamento', icon: Clock, colors: 'bg-amber-50 text-amber-700 border-amber-200', progressColor: 'bg-amber-500' },
          completed: { label: 'Concluído', icon: CheckCircle2, colors: 'bg-purple-50 text-purple-700 border-purple-200', progressColor: 'bg-purple-500' },
          'on-hold': { label: 'Pausado', icon: PauseCircle, colors: 'bg-slate-50 text-slate-700 border-slate-200', progressColor: 'bg-slate-400' }
        }[project.status] || { label: project.status, icon: Clock, colors: 'bg-slate-50 text-slate-700 border-slate-200', progressColor: 'bg-slate-500' };

        const Icon = statusConfig.icon;
        const currentCost = getProjectCost(project);

        return (
          <div 
            key={project.id} 
            onClick={() => onProjectClick(project)}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md hover:border-blue-200 transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.colors}`}>
                <Icon size={14} />
                {statusConfig.label}
              </span>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Custo Realizado</div>
                <div className="text-sm font-bold text-emerald-600">
                  R$ {currentCost.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                project.priority === 'high' ? 'bg-rose-100 text-rose-700' : 
                project.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 
                'bg-emerald-100 text-emerald-700'
              }`}>
                {project.priority === 'high' ? 'Alta' : project.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">
                {project.category}
              </span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{project.name}</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-grow">{project.description}</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">Progresso</span>
                  <span className="font-bold text-slate-900">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${statusConfig.progressColor} transition-all duration-500`} 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Inicio: {new Date(project.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="font-medium text-slate-400">
                  Orç: R$ {project.budget.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

