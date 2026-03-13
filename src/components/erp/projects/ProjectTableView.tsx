import React from 'react';
import { Project, ProjectStatus } from '../../../lib/mockData';
import { PlayCircle, Clock, CheckCircle2, PauseCircle, Calendar, MoreHorizontal, DollarSign, BarChart3, Shield, Globe } from 'lucide-react';

interface ProjectTableViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectTableView({ projects, onProjectClick }: ProjectTableViewProps) {
  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return { label: 'Ativo', icon: PlayCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'planning':
        return { label: 'Planejamento', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' };
      case 'completed':
        return { label: 'Concluído', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'on-hold':
        return { label: 'Pausado', icon: PauseCircle, color: 'text-slate-600', bg: 'bg-slate-50' };
      default:
        return { label: status, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50' };
    }
  };

  const calculateCost = (project: Project) => {
    return project.tasks.reduce((sum, task) => sum + task.cost, 0);
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <p className="text-slate-500">Nenhum projeto encontrado para esta visualização.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projeto</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridade</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progresso</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamento</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {projects.map(project => {
              const status = getStatusConfig(project.status);
              const totalCost = calculateCost(project);
              const costProgress = (totalCost / project.budget) * 100;
              
              return (
                <tr 
                  key={project.id} 
                  onClick={() => onProjectClick(project)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${project.isPrivate ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        {project.isPrivate ? <Shield size={16} /> : <BarChart3 size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{project.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold">{project.category}</span>
                          <span>•</span>
                          <span>Início: {new Date(project.start_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.bg} ${status.color} border-current opacity-80`}>
                      <status.icon size={12} />
                      {status.label}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      project.priority === 'high' ? 'bg-rose-100 text-rose-700' : 
                      project.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {project.priority === 'high' ? 'Alta' : project.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-32">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-700">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-xs font-bold text-slate-900">R$ {totalCost.toLocaleString('pt-BR')}</div>
                      <div className="text-[10px] text-slate-400">Meta: R$ {project.budget.toLocaleString('pt-BR')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
