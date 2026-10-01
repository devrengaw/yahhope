import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { ClickUpProvider } from '../../contexts/ClickUpContext';
import { FolderKanban } from 'lucide-react';

export function WorkspaceLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <ClickUpProvider>
      <div className="flex h-full w-full bg-white overflow-hidden text-slate-800 antialiased font-sans relative">
        <WorkspaceSidebar 
          isMobileOpen={isMobileSidebarOpen} 
          onClose={() => setIsMobileSidebarOpen(false)} 
        />

        {/* Backdrop para mobile no Workspace */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-all duration-300 cursor-pointer animate-in fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          {/* Subcabeçalho Mobile para abrir o menu do workspace */}
          <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <button
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FolderKanban size={14} className="text-amber-500" />
              <span>Espaços & Canais</span>
            </button>
          </div>
          <Outlet />
        </main>
      </div>
    </ClickUpProvider>
  );
}
