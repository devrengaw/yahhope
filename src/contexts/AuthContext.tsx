import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role, permissions?: string[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, role: Role, permissions?: string[]) => {
    // Simulated login logic
    const defaultPermissions = role === 'ADMIN' 
      ? ['dashboard', 'patients', 'attendance', 'inventory', 'management', 'finance', 'projects', 'team', 'calendar', 'settings']
      : permissions || ['dashboard'];

    setUser({ 
      id: Math.random().toString(36).substring(2, 9), 
      name: email.split('@')[0], 
      email, 
      role, 
      permissions: defaultPermissions,
      avatar: email[0].toUpperCase() 
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
