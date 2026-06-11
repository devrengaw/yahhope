import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './src/pages/public/Login';
import { AuthProvider } from './src/contexts/AuthContext';

try {
  const html = renderToString(
    <AuthProvider>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthProvider>
  );
  console.log('SUCCESS, length:', html.length);
} catch (e) {
  console.error('ERROR:', e);
}
