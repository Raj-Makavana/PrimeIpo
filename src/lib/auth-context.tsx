'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  setCustomUser: (user: any) => void;
  /** Open the global Sign In / Sign Up popup from anywhere in the app */
  openAuthModal: (mode?: 'signin' | 'signup') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  setCustomUser: () => {},
  openAuthModal: () => {},
});

const STORAGE_KEY = 'primeipo_custom_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Global Auth Modal state ──────────────────────────────────────────────
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const openAuthModal = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  useEffect(() => {
    let resolved = false;

    // Handle Google redirect result first (for mobile redirect flow)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          localStorage.removeItem(STORAGE_KEY);
          syncUserToDb(result.user);
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/no-current-user') {
          console.error('[Google Redirect Error]:', err);
        }
      });

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      resolved = true;

      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem(STORAGE_KEY);
        syncUserToDb(firebaseUser);
        setLoading(false);
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.uid && parsed?.email) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
        setUser(null);
        setLoading(false);
      }
    });

    // Safety timeout: if Firebase hasn't responded in 3s, stop loading
    const timeout = setTimeout(() => {
      if (!resolved) {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.uid && parsed?.email) {
              setUser(parsed);
            }
          }
        } catch {}
        setLoading(false);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const syncUserToDb = async (firebaseUser: any) => {
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
      console.error('[PrimeIPO] Failed to sync user to DB:', e);
    }
  };

  const setCustomUser = (customUser: any) => {
    if (!customUser?.uid || !customUser?.email) return;
    setUser(customUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customUser));
    } catch {}
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  // Lazy import AuthModal to avoid circular deps at module level
  const [AuthModalComponent, setAuthModalComponent] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    import('@/components/AuthModal').then((mod) => {
      setAuthModalComponent(() => mod.AuthModal);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, setCustomUser, openAuthModal }}>
      {children}
      {/* Global Auth Popup — always mounted, opened via openAuthModal() */}
      {AuthModalComponent && authModalOpen && (
        <AuthModalComponent
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => setAuthModalOpen(false)}
        />
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
