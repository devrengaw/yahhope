import React from 'react';
import { Projects } from './Projects';

export function WorkspaceProjects() {
  return (
    <div className="flex-1 bg-slate-50 h-full flex flex-col p-8 overflow-auto">
      <Projects workspaceMode={true} />
    </div>
  );
}
