import React from 'react';
import { Inbox } from 'lucide-react';

export function WorkspaceInbox() {
  return (
    <div className="flex-1 bg-white h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Inbox className="text-blue-600" size={28} /> Caixa de Entrada
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Sua Caixa de Entrada está vazia</h2>
          <p className="text-slate-500">
            Aqui você receberá notificações importantes, menções em tarefas e atualizações de projetos e equipes.
          </p>
        </div>
      </div>
    </div>
  );
}
