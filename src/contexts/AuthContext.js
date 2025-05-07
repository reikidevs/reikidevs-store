import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '../utils/supabaseClient';

// Buat context untuk autentikasi
const AuthContext = createContext();

// Provider component untuk autentikasi
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check user session saat pertama kali load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser || null);
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Jalankan check pertama
    checkUser();

    // Setup listener untuk perubahan auth state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          const user = session?.user;
          setUser(user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Cleanup listener saat component unmount
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Value yang akan dishare lewat context
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook untuk mengakses context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
