import React, { useState } from 'react';
import { useClickUp } from '../../contexts/ClickUpContext';
import { Search, Folder, List, CheckSquare } from 'lucide-react';

export function GlobalSearchView() {
  const { tasks, lists, spaces } = useClickUp();
  const [query, setQuery] = useState('');

  const searchTerm = query.toLowerCase().trim();

  const filteredTasks = searchTerm ? tasks.filter(t => t.name.toLowerCase().includes(searchTerm)) : [];
  const filteredLists = searchTerm ? lists.filter(l => l.name.toLowerCase().includes(searchTerm)) : [];
  const filteredSpaces = searchTerm ? spaces.filter(s => s.name.toLowerCase().includes(searchTerm)) : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-8 overflow-auto">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        
        <div className="relative">
          <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            autoFocus
            type="text"
            placeholder="Pesquisar tarefas, listas ou espaços..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-200 bg-white text-lg font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
          />
        </div>

        {!searchTerm ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            Digite algo para começar a pesquisar no Workspace.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Tasks */}
            {filteredTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckSquare size={16} /> Tarefas
                </h3>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {filteredTasks.map(task => (
                    <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group">
                      <span className="font-medium text-slate-800 group-hover:text-blue-600">{task.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lists */}
            {filteredLists.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <List size={16} /> Listas
                </h3>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {filteredLists.map(list => (
                    <div key={list.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group">
                      <span className="font-medium text-slate-800 group-hover:text-blue-600">{list.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spaces */}
            {filteredSpaces.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Folder size={16} /> Espaços
                </h3>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {filteredSpaces.map(space => (
                    <div key={space.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: space.color }}>
                          {space.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800 group-hover:text-blue-600">{space.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredTasks.length === 0 && filteredLists.length === 0 && filteredSpaces.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-medium bg-white rounded-2xl border border-slate-200 shadow-sm">
                Nenhum resultado encontrado para "{query}"
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
