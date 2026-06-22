import React from 'react';
import { Megaphone, LayoutDashboard } from 'lucide-react';

export function WorkspaceHome() {
  return (
    <div className="flex-1 bg-slate-50 p-8 overflow-auto h-full">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Início</h1>
          <p className="text-slate-500 mt-1">Bem-vindo ao seu Workspace YAH Hope.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Mural de Avisos */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Megaphone size={16} /> Mural de Avisos
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 text-blue-800 rounded-xl">
                  <h3 className="font-bold text-sm mb-1">Reunião Geral</h3>
                  <p className="text-xs opacity-80">Hoje às 15:00 na sala principal.</p>
                </div>
                <div className="p-4 bg-rose-50 text-rose-800 rounded-xl">
                  <h3 className="font-bold text-sm mb-1">Fechamento do Mês</h3>
                  <p className="text-xs opacity-80">Por favor, atualizem suas tarefas até sexta-feira.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Personalizável */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <LayoutDashboard size={16} /> Dashboard
            </h2>
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <LayoutDashboard size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Dashboard Personalizável</h3>
              <p className="text-slate-500 max-w-sm">Esta área será construída posteriormente para que você possa adicionar widgets e gráficos personalizados da sua equipe.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
