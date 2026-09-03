'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';

// Detect mobile browser (popup blocked on mobile Safari/Chrome)
const isMobileBrowser = () =>
  typeof window !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
import { X, LogIn, Phone, AlertCircle, RefreshCw, KeyRound, ShieldAlert, Sparkles, Mail } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { setCustomUser } = useAuth();
  const [method, setMethod] = useState<'choose' | 'phone' | 'email'>('choose');
  const [emailMode, setEmailMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [error, setError] = useState('');
  const [firebaseErrorHint, setFirebaseErrorHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
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
      clearRecaptcha();
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

  const clearRecaptcha = () => {
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } catch {}
    // Remove all old recaptcha containers from body
    const oldContainers = document.querySelectorAll('[id^="recaptcha-anchor-"]');
    oldContainers.forEach((el) => {
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch {}
    });
  };

  const getOrCreateRecaptcha = (): RecaptchaVerifier => {
    clearRecaptcha();

    // Use a guaranteed fresh, unique ID every single invocation
    const uniqueId = `recaptcha-anchor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const container = document.createElement('div');
    container.id = uniqueId;
    document.body.appendChild(container);

    const verifier = new RecaptchaVerifier(auth, uniqueId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        clearRecaptcha();
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (emailMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = emailMode === 'signup'
        ? await createUserWithEmailAndPassword(auth, normalizedEmail, password)
        : await signInWithEmailAndPassword(auth, normalizedEmail, password);
      onSuccess?.(result.user);
      onClose();
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account already exists for this email.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a stronger password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(messages[err.code] || 'Unable to authenticate with email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Enter the email address used for your account.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/email-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to send reset code.');
      setEmailMode('forgot');
      setStep('verify');
      setError('Reset code sent. Check your email.');
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Unable to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(emailOtp)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 6 || password !== confirmPassword) {
      setError(password.length < 6 ? 'Password must be at least 6 characters.' : 'Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/email-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: emailOtp, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to reset password.');
      setEmailMode('login');
      setStep('input');
      setPassword('');
      setConfirmPassword('');
      setEmailOtp('');
      setError('Password reset. Sign in with your new password.');
    } catch (err: any) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setFirebaseErrorHint(null);
    try {
      if (isMobileBrowser()) {
        // Mobile: use redirect (popup is blocked by mobile browsers)
        await signInWithRedirect(auth, googleProvider);
        // Page will redirect — no further code runs here
      } else {
        // Desktop: popup works fine
        const result = await signInWithPopup(auth, googleProvider);
        if (onSuccess) onSuccess(result.user);
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was closed.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized Domains.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  // 1. Send Real SMS via Firebase native Phone Auth
  const handleSendRealSms = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setFirebaseErrorHint(null);

    const formattedPhone = `+91${cleaned.slice(-10)}`;

    try {
      const appVerifier = getOrCreateRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('verify');
      startResendTimer();
    } catch (err: any) {
      console.error('Firebase signInWithPhoneNumber error:', err);
      clearRecaptcha();

      // Check if Firebase blocked SMS region for India (+91)
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('SMS unable to be sent until this region enabled') ||
        err.message?.includes('OPERATION_NOT_ALLOWED')
      ) {
        setFirebaseErrorHint('region_policy');
        setError(
          'Firebase SMS Blocked: Google requires enabling India (+91) under "SMS Region Policy" in Firebase Console.'
        );
      } else if (err.code === 'auth/too-many-requests') {
        setError('SMS limit reached. Please wait a few minutes or use instant sign-in.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid mobile number format. Please check the digits.');
      } else {
        setError(err.message || 'Failed to send SMS. Check your Firebase console settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify the SMS OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit OTP code received on your mobile.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (confirmationResult) {
        // Native Firebase Phone Verification
        const result = await confirmationResult.confirm(otpCode);
        if (onSuccess) onSuccess(result.user);
        onClose();
      } else {
        // Backend verification fallback
        const cleaned = phoneNumber.replace(/\D/g, '');
        const res = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: cleaned, otpCode }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invalid OTP code.');
        }
        if (data.user) {
          setCustomUser(data.user);
          if (onSuccess) onSuccess(data.user);
          onClose();
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please check the SMS on your phone.');
      } else if (err.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new SMS.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Fallback Instant Sign In (Bypasses Firebase SMS block for testing)
  const handleInstantSignIn = async () => {
    const cleaned = phoneNumber.replace(/\D/g, '') || '6354101039';
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleaned, otpCode: '123456' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Instant sign in failed.');
      }
      if (data.user) {
        setCustomUser(data.user);
        if (onSuccess) onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Instant sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToInput = () => {
    setStep('input');
    setOtpCode('');
    setError('');
    setFirebaseErrorHint(null);
    clearRecaptcha();
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl w-full max-w-md p-6 sm:p-8 relative border border-slate-700/80 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400 shadow-inner">
            <LogIn className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Sign In to PrimeIPO</h3>
          <p className="text-xs text-slate-400 mt-1">
            Save family PANs, track allotment results, and get live IPO alerts.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step-by-step guidance if Firebase SMS Region is blocked */}
        {firebaseErrorHint === 'region_policy' && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-950/60 border border-amber-600/40 text-amber-200 text-xs space-y-2.5 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>How to Enable Real SMS on Your Phone:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-100">
              <li>In your open Firebase tab (primeipo-274b7):</li>
              <li>Go to <strong>Authentication</strong> → <strong>Settings</strong> tab</li>
              <li>Click <strong>SMS region policy</strong> → Select <strong>Allowlist</strong></li>
              <li>Check <strong>India (+91)</strong> and save!</li>
              <li className="pt-1 text-slate-300">
                <em>Or under Sign-in method → Phone → Add your number under &quot;Phone numbers for testing&quot; (code: 123456).</em>
              </li>
            </ol>
            <div className="pt-2 border-t border-amber-700/50">
              <button
                type="button"
                onClick={handleInstantSignIn}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Sign In while setting up (1-Click)</span>
              </button>
            </div>
          </div>
        )}

        {method === 'choose' ? (
          <div className="space-y-3.5">
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
              <span className="text-xs text-slate-500 uppercase font-mono text-[10px]">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <button
              onClick={() => {
                setMethod('email');
                setEmailMode('login');
                setError('');
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              <Mail className="w-4 h-4" />
              <span>Continue with Email</span>
            </button>

            <button
              onClick={() => {
                setMethod('phone');
                setError('');
                setFirebaseErrorHint(null);
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all hover:scale-[1.01] shadow-lg shadow-indigo-600/20"
            >
              <Phone className="w-4 h-4" />
              <span>Login with Mobile SMS OTP</span>
            </button>

            <p className="text-center text-[10px] text-slate-500 pt-2">
              By signing in, you agree to our Terms of Service & Privacy Policy.
            </p>
          </div>
        ) : method === 'email' ? (
          <div>
            {step === 'verify' && emailMode === 'forgot' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email verification code</label>
                  <p className="text-[11px] text-slate-400 mb-2.5">Enter the 6-digit code sent to <strong className="text-white">{email}</strong>.</p>
                  <input value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} autoFocus className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-center tracking-[0.6em] text-2xl font-mono focus:outline-none focus:border-indigo-500" />
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" autoComplete="new-password" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-indigo-500" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-indigo-500" />
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => { setStep('input'); setError(''); }} className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium">Back</button>
                  <button type="submit" disabled={loading || emailOtp.length < 6} className="w-2/3 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">{loading ? 'Resetting...' : 'Reset Password'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={emailMode === 'forgot' ? handleSendEmailOtp : handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus autoComplete="email" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                {emailMode !== 'forgot' && <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-indigo-500" />}
                {emailMode === 'signup' && <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete="new-password" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-indigo-500" />}
                {emailMode === 'login' && <button type="button" onClick={() => { setEmailMode('forgot'); setError(''); }} className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</button>}
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => { setMethod('choose'); setError(''); }} className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium">Back</button>
                  <button type="submit" disabled={loading} className="w-2/3 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50">{loading ? 'Please wait...' : emailMode === 'signup' ? 'Create Account' : emailMode === 'forgot' ? 'Send Email Code' : 'Sign In'}</button>
                </div>
                {emailMode !== 'forgot' && <button type="button" onClick={() => { setEmailMode(emailMode === 'login' ? 'signup' : 'login'); setError(''); }} className="w-full text-xs text-slate-400 hover:text-white">{emailMode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>}
              </form>
            )}
          </div>
        ) : (
          <div>
            {step === 'input' ? (
              <form onSubmit={handleSendRealSms} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Enter Indian Mobile Number for SMS
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900/90 focus-within:border-indigo-500 transition-colors">
                    <span className="px-3.5 py-3 bg-slate-800/90 text-slate-300 text-sm font-semibold border-r border-slate-700 shrink-0">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneNumber(val);
                      }}
                      placeholder="63541 01039"
                      maxLength={10}
                      autoFocus
                      autoComplete="tel"
                      className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600 tracking-wider font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Google Firebase sends a 6-digit SMS code directly to your mobile handset.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('choose');
                      setError('');
                      setPhoneNumber('');
                      setFirebaseErrorHint(null);
                    }}
                    className="w-1/3 py-3 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                    className="w-2/3 py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Sending SMS...
                      </span>
                    ) : (
                      'Send SMS to Phone →'
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-center">
                  <button
                    type="button"
                    disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                    onClick={async () => {
                      const cleaned = phoneNumber.replace(/\D/g, '');
                      if (!cleaned || cleaned.length < 10) {
                        setError('Please enter a valid 10-digit number.');
                        return;
                      }
                      setLoading(true);
                      setError('');
                      try {
                        const res = await fetch('/api/auth/otp/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phoneNumber: cleaned }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setConfirmationResult(null);
                          setStep('verify');
                          startResendTimer();
                          if (data.testOtp) {
                            setOtpCode(data.testOtp);
                            setError('');
                          }
                        } else {
                          setError(data.error || 'Failed to send OTP.');
                        }
                      } catch (e: any) {
                        setError(e.message || 'Error requesting code.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Or Sign in with Instant Code (Bypass SMS & reCAPTCHA)</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Enter 6-Digit SMS Code from Mobile
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2.5">
                    Sent via SMS to <strong className="text-white">+91 {phoneNumber.slice(-10)}</strong>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                    }}
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-center tracking-[0.6em] text-2xl font-mono focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  />
                </div>

                <div className="text-center py-1">
                  {resendTimer > 0 ? (
                    <p className="text-[11px] text-slate-500">
                      Resend SMS in <span className="text-indigo-400 font-semibold">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendRealSms}
                      disabled={loading}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                    >
                      Didn&apos;t get the SMS? Resend Code →
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleBackToInput}
                    className="w-1/3 py-3 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-all"
                  >
                    Change Number
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-2/3 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      '✓ Verify & Sign In'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
