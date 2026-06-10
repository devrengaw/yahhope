import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export type Role = 'ADMIN' | 'USER' | 'SPONSOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
  avatar?: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => User | null;
  logout: () => void;
  registerUser: (name: string, email: string, password?: string, role?: Role, permissions?: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('yah_hope_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load or initialize users DB
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('yah_hope_all_users');
      if (savedUsers) {
        return JSON.parse(savedUsers);
      } else {
        // Initialize with default admin if none exists
        const defaultAdmin: User = {
          id: '1',
          name: 'Super Admin',
          email: 'contato@yahhope.com',
          role: 'ADMIN',
          password: 'admin',
          permissions: ['dashboard', 'patients', 'attendance', 'inventory', 'management', 'finance', 'projects', 'team', 'calendar', 'settings', 'impact-feed', 'messages', 'gifts'],
          avatar: 'S'
        };
        localStorage.setItem('yah_hope_all_users', JSON.stringify([defaultAdmin]));
        return [defaultAdmin];
      }
    } catch {
      return [];
    }
  });

  const login = (email: string, password?: string): User | null => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if there is a legacy password for admin
    const legacyAdminPassword = localStorage.getItem('yah_hope_admin_password');
    
    // Find user in mock DB
    const foundUserIndex = allUsers.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    const foundUser = foundUserIndex >= 0 ? allUsers[foundUserIndex] : null;
    
    if (!foundUser) return null;
    
    let isPasswordValid = false;
    
    if (foundUser.password === password) {
      isPasswordValid = true;
    } else if (normalizedEmail === 'contato@yahhope.com' && legacyAdminPassword && legacyAdminPassword === password) {
      // Migrate old password
      isPasswordValid = true;
      const updatedUsers = [...allUsers];
      updatedUsers[foundUserIndex].password = password;
      setAllUsers(updatedUsers);
      localStorage.setItem('yah_hope_all_users', JSON.stringify(updatedUsers));
    }
    
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    const userToReturn = userWithoutPassword as User;
    setUser(userToReturn);
    localStorage.setItem('yah_hope_user', JSON.stringify(userToReturn));
    return userToReturn;
  };

  const registerUser = (name: string, email: string, password?: string, role: Role = 'USER', customPermissions?: string[]): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    if (allUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return false; // Email already exists
    }

    const defaultPermissions = role === 'ADMIN' 
      ? ['dashboard', 'patients', 'attendance', 'inventory', 'management', 'finance', 'projects', 'team', 'calendar', 'settings', 'impact-feed', 'messages', 'gifts']
      : role === 'SPONSOR' 
        ? ['portal'] 
        : ['dashboard', 'patients', 'attendance', 'waiting-list', 'inventory', 'management', 'atendimento', 'messages', 'updates', 'visits'];

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      email: normalizedEmail,
      password,
      role,
      permissions: customPermissions || defaultPermissions,
      avatar: name[0].toUpperCase()
    };

    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem('yah_hope_all_users', JSON.stringify(updatedUsers));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('yah_hope_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, registerUser }}>
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
