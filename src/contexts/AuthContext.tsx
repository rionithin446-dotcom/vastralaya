import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface RetailerData {
  retailer_id: string;
  email: string;
  token: string;
  expires_at: string;
}

interface AuthContextType {
  user: User | null;
  userType: 'customer' | 'retailer' | null;
  loading: boolean;
  retailerData: RetailerData | null;
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
  const [retailerData, setRetailerData] = useState<RetailerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedRetailerToken = localStorage.getItem('retailer_token');

      if (storedRetailerToken) {
        try {
          const { data, error } = await supabase.rpc('verify_retailer_session', {
            p_token: storedRetailerToken,
          });

          if (!error && data && data.valid) {
            setRetailerData({
              retailer_id: data.retailer_id,
              email: data.email,
              token: storedRetailerToken,
              expires_at: '',
            });
            setUserType('retailer');
            setLoading(false);
            return;
          } else {
            localStorage.removeItem('retailer_token');
          }
        } catch (err) {
          console.error('Error verifying retailer session:', err);
          localStorage.removeItem('retailer_token');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserType('customer');
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!retailerData) {
        setUser(session?.user ?? null);
        if (session?.user) {
          setUserType('customer');
        } else {
          setUserType(null);
        }
      }
    });

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
    if (userType === 'retailer' && retailerData) {
      try {
        await supabase.rpc('logout_retailer_session', {
          p_token: retailerData.token,
        });
      } catch (err) {
        console.error('Error logging out retailer:', err);
      }
      localStorage.removeItem('retailer_token');
      setRetailerData(null);
      setUserType(null);
    } else {
      await supabase.auth.signOut();
      setUser(null);
      setUserType(null);
    }
  };

  const retailerSignIn = async (email: string, password: string) => {
    const { data, error } = await supabase.rpc('verify_retailer_login_enhanced', {
      p_email: email,
      p_password: password,
    });

    if (error) {
      throw new Error('Login failed. Please try again.');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Invalid credentials');
    }

    const retailerInfo: RetailerData = {
      retailer_id: data.retailer_id,
      email: data.email,
      token: data.token,
      expires_at: data.expires_at,
    };

    localStorage.setItem('retailer_token', data.token);
    setRetailerData(retailerInfo);
    setUserType('retailer');
  };

  const value = {
    user,
    userType,
    loading,
    retailerData,
    signIn,
    signUp,
    signOut,
    retailerSignIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
