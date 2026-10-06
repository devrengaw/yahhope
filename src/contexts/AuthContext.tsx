import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type Role = 'ADMIN' | 'USER' | 'SPONSOR' | 'OBSERVER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
  avatar?: string;
  avatar_url?: string;
  phone?: string;
  about?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  registerWithEmail: (name: string, email: string, password?: string) => Promise<boolean>;
  sendPasswordResetEmail: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string; avatar_url?: string; about?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getPermissionsForRole = (role: Role) => {
  if (role === 'ADMIN') {
    return ['dashboard', 'patients', 'attendance', 'waiting-list', 'updates', 'inventory', 'visits', 'management', 'projects', 'finance', 'team', 'calendar', 'chat', 'blog', 'email-templates', 'impact-feed', 'messages', 'fundraising', 'local-projects', 'users', 'gifts', 'store', 'settings', 'nutrition-finance'];
  }
  if (role === 'SPONSOR') {
    return ['portal'];
  }
  if (role === 'OBSERVER') {
    return ['patients'];
  }
  return ['dashboard', 'patients', 'attendance', 'waiting-list', 'inventory', 'management', 'atendimento', 'messages', 'updates', 'visits'];
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on load
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleSessionUser(session.user);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (e.g. login, logout, Google OAuth callback)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleSessionUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSessionUser = async (authUser: any) => {
    try {
      // 1. Fetch user from our public.users table (case insensitive)
      const { data: publicUser, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', authUser.email)
        .maybeSingle();

      let finalUser = publicUser;

      // 2. If it doesn't exist, auto-register them
      if (!publicUser) {
        // Special case: if the email is the admin email, give them ADMIN role automatically
        const isMasterAdmin = authUser.email.toLowerCase() === 'contato@yahhope.com';
        
        const newUser = {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          email: authUser.email,
          role: isMasterAdmin ? 'ADMIN' : 'SPONSOR'
        };

        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (insertError) {
          console.error("Error creating public user:", insertError);
          alert(`Erro ao vincular perfil de usuário: ${insertError.message}`);
          setLoading(false);
          return;
        }
        finalUser = insertedUser;
      } else if (publicUser.id !== authUser.id) {
        // If the email exists but the ID is different (e.g. they deleted and recreated auth user)
        // We should update the public.users record with the new auth ID
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ id: authUser.id })
          .eq('email', publicUser.email)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating public user ID:", updateError);
          // If we can't update, we just continue with publicUser to at least allow login
        } else {
          finalUser = updatedUser;
        }
      }

      // 3. Build the User object for context (with fallback to auth metadata if table columns aren't populated yet)
      const roleStr = (finalUser.role || 'SPONSOR').toUpperCase() as Role;
      const avatarImg = finalUser.avatar_url || finalUser.avatar || authUser.user_metadata?.avatar_url;
      const phoneVal = finalUser.phone || authUser.user_metadata?.phone;
      const aboutVal = finalUser.about || authUser.user_metadata?.about;

      const contextUser: User = {
        id: finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        role: roleStr,
        permissions: roleStr === 'OBSERVER' ? ['patients'] : ((finalUser.permissions && Array.isArray(finalUser.permissions)) ? finalUser.permissions : getPermissionsForRole(roleStr)),
        avatar: avatarImg || (finalUser.name ? finalUser.name[0].toUpperCase() : 'U'),
        avatar_url: avatarImg || undefined,
        phone: phoneVal || undefined,
        about: aboutVal || undefined
      };

      setUser(contextUser);
    } catch (err) {
      console.error("Error handling session user:", err);
      alert('Erro interno ao carregar perfil do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string): Promise<boolean> => {
    if (!password) return false;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };

  const loginWithGoogle = async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
  };

  const registerWithEmail = async (name: string, email: string, password?: string): Promise<boolean> => {
    if (!password) return false;
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (authError || !authData.user) {
      console.error("Error signing up:", authError);
      return false;
    }

    // Immediately insert into public.users as SPONSOR.
    // Auth Listener might also try to do this, but doing it here guarantees it before redirect.
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      name,
      email,
      role: 'SPONSOR'
    });

    if (dbError) {
      console.error("Error inserting public user on register:", dbError);
    }

    return true;
  };

  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });
    if (error) {
      console.error("Error sending reset password email:", error);
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: { name?: string; phone?: string; avatar_url?: string; about?: string }): Promise<boolean> => {
    if (!user) return false;

    // Immediately update local state for responsive UI
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        name: updates.name !== undefined ? updates.name : prev.name,
        phone: updates.phone !== undefined ? updates.phone : prev.phone,
        avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : prev.avatar_url,
        avatar: updates.avatar_url !== undefined ? updates.avatar_url : prev.avatar,
        about: updates.about !== undefined ? updates.about : prev.about
      };
    });

    try {
      const dbPayload: Record<string, any> = {};
      if (updates.name !== undefined) dbPayload.name = updates.name;
      if (updates.phone !== undefined) dbPayload.phone = updates.phone;
      if (updates.avatar_url !== undefined) {
        dbPayload.avatar_url = updates.avatar_url;
        dbPayload.avatar = updates.avatar_url;
      }
      if (updates.about !== undefined) dbPayload.about = updates.about;

      // Update public.users table
      const { error } = await supabase
        .from('users')
        .update(dbPayload)
        .eq('id', user.id);

      if (error) {
        console.warn('Could not update users table directly, attempting email match:', error);
        await supabase
          .from('users')
          .update(dbPayload)
          .eq('email', user.email);
      }

      // Also update auth user metadata (always works even if SQL columns don't exist yet)
      try {
        const metaUpdates: Record<string, any> = {};
        if (updates.name !== undefined) metaUpdates.full_name = updates.name;
        if (updates.avatar_url !== undefined) metaUpdates.avatar_url = updates.avatar_url;
        if (updates.phone !== undefined) metaUpdates.phone = updates.phone;
        if (updates.about !== undefined) metaUpdates.about = updates.about;

        await supabase.auth.updateUser({
          data: metaUpdates
        });
      } catch (metaErr) {
        console.warn('Could not update user metadata:', metaErr);
      }

      return true;
    } catch (err) {
      console.error('Error updating user profile:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, loginWithGoogle, registerWithEmail, sendPasswordResetEmail, logout, updateProfile }}>
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
