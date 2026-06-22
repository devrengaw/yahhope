import React from 'react';
import { Briefcase } from 'lucide-react';

export function WorkspaceProjects() {
  return (
    <div className="flex-1 bg-white h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Briefcase className="text-blue-600" size={28} /> Visão Geral de Projetos
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Projetos Globais</h2>
          <p className="text-slate-500">
            Esta área será responsável por exibir o portfólio completo de todos os projetos ativos no YAH Hope.
          </p>
        </div>
      </div>
    </div>
  );
}
