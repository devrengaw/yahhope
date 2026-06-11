import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ModuleSelector } from './src/pages/admin/ModuleSelector.tsx';
import { AuthContext } from './src/contexts/AuthContext.tsx';

try {
  const html = renderToString(
    <AuthContext.Provider value={{
      user: { role: 'ADMIN', name: 'Test', permissions: [] },
      logout: () => {}
    }}>
      <MemoryRouter>
        <ModuleSelector />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  console.log('SUCCESS, length:', html.length);
} catch (e) {
  console.error('ERROR:', e);
}
