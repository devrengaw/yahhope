import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TeamsList } from './TeamsList';
import { TeamHub } from './TeamHub';

export function TeamsContainer() {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <Routes>
        <Route index element={<TeamsList />} />
        <Route path=":teamId" element={<TeamHub />} />
      </Routes>
    </div>
  );
}
