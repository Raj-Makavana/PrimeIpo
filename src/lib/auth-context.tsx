'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, getRedirectResult, User } from 'firebase/auth';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  setCustomUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  setCustomUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore fallback phone user if logged in via OTP fallback
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('primeipo_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setLoading(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Process mobile Google redirect sign-in results globally
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          localStorage.removeItem('primeipo_user');
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/no-current-user') {
          console.error('[Google Redirect Error]:', err);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem('primeipo_user');
        setLoading(false);

        // Sync user profile to NeonDB
        try {
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              phone: firebaseUser.phoneNumber,
              phoneVerified: !!firebaseUser.phoneNumber,
              image: firebaseUser.photoURL,
            }),
          });
        } catch (e) {
          console.error('Failed to sync user to NeonDB:', e);
        }
      } else {
        // If not logged in with Firebase, check if local fallback user exists
        const savedUser = typeof window !== 'undefined' ? localStorage.getItem('primeipo_user') : null;
        if (!savedUser) {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setCustomUser = (customUser: any) => {
    setUser(customUser);
    try {
      localStorage.setItem('primeipo_user', JSON.stringify(customUser));
    } catch {}
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem('primeipo_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setCustomUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

