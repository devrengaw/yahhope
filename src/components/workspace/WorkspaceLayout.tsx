import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { ClickUpProvider } from '../../contexts/ClickUpContext';

export function WorkspaceLayout() {
  return (
    <ClickUpProvider>
      <div className="flex h-full w-full bg-white overflow-hidden text-slate-800 antialiased font-sans">
        <WorkspaceSidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <Outlet />
        </main>
      </div>
    </ClickUpProvider>
  );
}
