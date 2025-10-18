import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomUser {
  id: string;
  email: string;
  nome: string;
  username?: string;
  matricula?: string;
  tipo_usuario: string;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Initialize user state from localStorage synchronously to avoid flash
const getInitialUser = () => {
  const storedUser = localStorage.getItem('authUser');
  return storedUser ? JSON.parse(storedUser) : null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(getInitialUser);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        user_identifier: email,
        user_password: password
      });

      if (error) {
        return { error };
      }

      const result = data as any;
      if (result?.success) {
        const userData = result.user;
        setUser(userData);
        localStorage.setItem('authUser', JSON.stringify(userData));
        return { error: null };
      } else {
        return { error: { message: result?.message || 'Credenciais inválidas' } };
      }
    } catch (error) {
      return { error };
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
