'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import { X, LogIn, AlertCircle, RefreshCw, Mail, CheckCircle2, ArrowRight } from 'lucide-react';

const isMobileBrowser = () =>
  typeof window !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { setCustomUser } = useAuth();
  const [authType, setAuthType] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<any>(null);

  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle Google redirect result on page load (for mobile redirect flow)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          if (onSuccess) onSuccess(result.user);
          onClose();
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/no-current-user') {
          console.error('Redirect result error:', err);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  // 1. Google 1-Tap Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      if (isMobileBrowser()) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        if (onSuccess) onSuccess(result.user);
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was closed.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Real Email OTP via Resend
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await fetch('/api/auth/email-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification email.');
      }
      setStep('verify');
      setInfoMessage(`We sent a 6-digit verification code to ${cleanEmail}. Please check your inbox (and spam folder).`);
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Unable to send email OTP. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify 6-Digit Email OTP
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/email-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      if (data.user) {
        setCustomUser(data.user);
        if (onSuccess) onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Fallback Email + Password Auth
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || password.length < 6) {
      setError('Please enter your email and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = isSignUp
        ? await createUserWithEmailAndPassword(auth, cleanEmail, password)
        : await signInWithEmailAndPassword(auth, cleanEmail, password);
      if (onSuccess) onSuccess(result.user);
      onClose();
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account already exists for this email. Click "Sign in" below.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/user-not-found': 'No account found. Click "Create an account" below.',
        'auth/wrong-password': 'Incorrect password.',
      };
      setError(messages[err.code] || err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl w-full max-w-md p-6 sm:p-8 relative border border-slate-700/80 shadow-2xl bg-slate-950/90">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400 shadow-inner">
            <LogIn className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Sign In to PrimeIPO</h3>
          <p className="text-xs text-slate-400 mt-1">
            Save family PANs, track allotment results, and get live IPO alerts.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-indigo-950/80 border border-indigo-700 text-indigo-200 text-xs flex items-start gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* 1-Tap Google Sign In */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all hover:scale-[1.01] shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase font-mono text-[10px]">or with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Email OTP Verification Mode */}
          {authType === 'otp' ? (
            step === 'input' ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Email Address
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900/90 focus-within:border-indigo-500 transition-colors">
                    <span className="px-3.5 py-3 bg-slate-800/90 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoFocus
                      autoComplete="email"
                      className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    We will send a real 6-digit OTP to your email inbox for instant sign-in.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.includes('@')}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Email OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthType('password');
                      setError('');
                    }}
                    className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    Or sign in with Password →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Enter 6-Digit Email Code
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2.5">
                    Sent to <strong className="text-white">{email}</strong>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-center tracking-[0.6em] text-2xl font-mono focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  />
                </div>

                <div className="text-center py-1">
                  {resendTimer > 0 ? (
                    <p className="text-[11px] text-slate-500">
                      Resend code in <span className="text-indigo-400 font-semibold">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={loading}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                    >
                      Didn&apos;t get the code? Resend Email
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setError('');
                      setOtpCode('');
                    }}
                    className="w-1/3 py-3 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-all"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-2/3 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : '✓ Verify & Sign In'}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Email + Password Option */
            <form onSubmit={handlePasswordAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoFocus
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('otp');
                    setError('');
                  }}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Back to OTP
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "New here? Create an account"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
