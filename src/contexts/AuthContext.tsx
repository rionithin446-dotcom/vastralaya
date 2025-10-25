import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userType: 'customer' | 'retailer' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  retailerSignIn: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'customer' | 'retailer' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserType('customer');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserType('customer');
      } else {
        setUserType(null);
      }
    });

    const storedRetailer = localStorage.getItem('retailer_session');
    if (storedRetailer) {
      setUserType('retailer');
      setLoading(false);
    }

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUserType('customer');
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('customers')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone_number: phone || null,
        });

      if (profileError) throw profileError;
    }
    setUserType('customer');
  };

  const signOut = async () => {
    if (userType === 'retailer') {
      localStorage.removeItem('retailer_session');
      setUserType(null);
    } else {
      await supabase.auth.signOut();
    }
    setUser(null);
    setUserType(null);
  };

  const retailerSignIn = async (email: string, password: string) => {
    const { data, error } = await supabase.rpc('verify_retailer_login', {
      p_email: email,
      p_password: password,
    });

    if (error || !data) {
      throw new Error('Invalid credentials');
    }

    localStorage.setItem('retailer_session', JSON.stringify({ email, timestamp: Date.now() }));
    setUserType('retailer');
  };

  const value = {
    user,
    userType,
    loading,
    signIn,
    signUp,
    signOut,
    retailerSignIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
