import React from 'react';
import { Project } from '../../../lib/mockData';
import { Briefcase, CheckCircle2, Clock, PlayCircle, DollarSign } from 'lucide-react';

interface ProjectSummaryProps {
  projects: Project[];
}

export function ProjectSummary({ projects }: ProjectSummaryProps) {
  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const planningCount = projects.filter(p => p.status === 'planning').length;
  
  const totalCost = projects.reduce((acc, p) => 
    acc + p.tasks.reduce((sum, task) => sum + task.cost, 0), 0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {/* Total Projects */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Total Projetos</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{projects.length}</p>
      </div>

      {/* Custo Total */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col border-l-4 border-l-emerald-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Custo Total</h3>
        </div>
        <p className="text-2xl font-bold text-slate-900 leading-none mb-1">R$ {totalCost.toLocaleString('pt-BR')}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Realizado acumulado</p>
      </div>

      {/* Em Andamento */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PlayCircle size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Em Andamento</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{activeCount}</p>
      </div>

      {/* Em Planejamento */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Em Planejamento</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{planningCount}</p>
      </div>

      {/* Concluídos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Concluídos</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{completedCount}</p>
      </div>
    </div>
  );
}
