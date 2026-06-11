import React from 'react';
import { renderToString } from 'react-dom/server';
import { Login } from './src/pages/public/Login.tsx';
import { MemoryRouter } from 'react-router-dom';

const AuthContext = React.createContext({
  loginWithEmail: async () => true,
  loginWithGoogle: async () => {},
  registerWithEmail: async () => true,
  user: null
});

// Mock useAuth from the file
jest.mock('./src/contexts/AuthContext', () => ({
  useAuth: () => ({
    loginWithEmail: async () => true,
    loginWithGoogle: async () => {},
    registerWithEmail: async () => true,
    user: null
  }),
  AuthContext: {}
}));

try {
  const html = renderToString(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
  console.log('SUCCESS, length:', html.length);
} catch (e) {
  console.error('ERROR:', e);
}
