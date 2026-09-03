'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import {
  X,
  LogIn,
  UserPlus,
  KeyRound,
  AlertCircle,
  RefreshCw,
  Mail,
  CheckCircle2,
  ArrowRight,
  User as UserIcon,
  Lock,
  Sparkles,
} from 'lucide-react';

const isMobileBrowser = () =>
  typeof window !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
}) => {
  const { setCustomUser } = useAuth();

  // Mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);

  // Sign In method: 'otp' | 'password'
  const [signInMethod, setSignInMethod] = useState<'otp' | 'password'>('otp');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Sub-steps
  const [otpStep, setOtpStep] = useState<'input' | 'verify'>('input');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');

  // Status & Feedback
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<any>(null);

  // Sync initial mode if changed
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setInfoMessage('');
    }
  }, [isOpen, initialMode]);

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

  // Handle Google redirect result on mobile
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
          console.error('[Google Redirect Error]:', err);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const resetFormState = () => {
    setError('');
    setInfoMessage('');
    setOtpCode('');
    setPassword('');
    setConfirmPassword('');
    setOtpStep('input');
    setForgotStep('email');
    setAcceptedTerms(false);
  };

  // 1. Google 1-Tap Auth
  const handleGoogleAuth = async () => {
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
        setError('Google sign-in was cancelled.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Email OTP (for Sign In)
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
        throw new Error(data.error || 'Failed to send verification email.');
      }
      setOtpStep('verify');
      setInfoMessage(`We sent a 6-digit code to ${cleanEmail}. Check your inbox or spam.`);
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Unable to send email OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Email OTP (Sign In)
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

  // 4. Sign In with Email & Password
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: cleanEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sign in failed.');
      }

      if (data.user) {
        setCustomUser(data.user);
        if (onSuccess) onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Create Account (Sign Up with Confirm Password)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions and Educational Disclaimer to create your account.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: cleanName,
          email: cleanEmail,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Account creation failed.');
      }

      if (data.user) {
        setCustomUser(data.user);
        if (onSuccess) onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password: Step 1 - Send OTP
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot-send-otp',
          email: cleanEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reset code.');
      }

      setForgotStep('reset');
      setInfoMessage(`We sent a 6-digit reset code to ${cleanEmail}.`);
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Unable to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Forgot Password: Step 2 - Verify OTP & Reset Password
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit reset code sent to your email.');
      return;
    }

    if (password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: cleanEmail,
          code: otpCode.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Password reset failed.');
      }

      // Switch back to Sign In mode with success notification
      setMode('signin');
      setSignInMethod('password');
      setOtpStep('input');
      setForgotStep('email');
      setOtpCode('');
      setPassword('');
      setConfirmPassword('');
      setInfoMessage('Password reset successfully! You can now sign in with your new password.');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl w-full max-w-md p-6 sm:p-8 relative border border-slate-700/80 shadow-2xl bg-slate-950/95 max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>


        {/* Modal Header */}
        <div className="text-center mb-6">
          {mode === 'signin' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400 shadow-inner">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Sign In to PrimeIPO</h3>
              <p className="text-xs text-slate-400 mt-1">
                Access your saved family PANs, allotment results, and live GMP.
              </p>
            </>
          )}

          {mode === 'signup' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-3 text-violet-400 shadow-inner">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Create Your Account</h3>
              <p className="text-xs text-slate-400 mt-1">
                Join thousands of smart investors tracking India&apos;s IPO market.
              </p>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Reset Your Password</h3>
              <p className="text-xs text-slate-400 mt-1">
                {forgotStep === 'email'
                  ? "Enter your registered email to receive a 6-digit OTP code."
                  : `Enter the code sent to ${email} and choose a new password.`}
              </p>
            </>
          )}
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

        {/* ── VIEW 1: SIGN IN ──────────────────────────────────────────────── */}
        {mode === 'signin' && (
          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleAuth}
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
              <span className="text-xs text-slate-500 uppercase font-mono text-[10px]">or sign in with</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Switch between OTP vs Password */}
            <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSignInMethod('otp');
                  resetFormState();
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  signInMethod === 'otp'
                    ? 'bg-slate-800 text-indigo-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Email OTP (Instant)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignInMethod('password');
                  resetFormState();
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  signInMethod === 'password'
                    ? 'bg-slate-800 text-indigo-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Email & Password
              </button>
            </div>

            {/* Sign In via Email OTP */}
            {signInMethod === 'otp' && (
              otpStep === 'input' ? (
                <form onSubmit={handleSendEmailOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Your Email Address
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-within:border-indigo-500 transition-colors">
                      <span className="px-3.5 py-3 bg-slate-800 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        autoFocus
                        className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.includes('@')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
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
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-center tracking-[0.6em] text-2xl font-mono focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
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
                        Didn&apos;t get code? Resend Email
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('input');
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
            )}

            {/* Sign In via Email & Password */}
            {signInMethod === 'password' && (
              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-within:border-indigo-500 transition-colors">
                    <span className="px-3.5 py-3 bg-slate-800 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoFocus
                      className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        resetFormState();
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-within:border-indigo-500 transition-colors">
                    <span className="px-3.5 py-3 bg-slate-800 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In to PrimeIPO'}
                </button>
              </form>
            )}

            {/* Footer link to create account */}
            <div className="pt-2 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    resetFormState();
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Create an Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── VIEW 2: CREATE ACCOUNT (SIGN UP) ─────────────────────────────── */}
        {mode === 'signup' && (
          <div className="space-y-4">
            {/* 1-Tap Google Sign Up */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all hover:scale-[1.01] shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Connecting...' : 'Sign Up with Google'}</span>
            </button>

            <div className="relative flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500 uppercase font-mono text-[10px]">or with details</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name / Username
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-within:border-indigo-500 transition-colors">
                  <span className="px-3.5 py-3 bg-slate-800 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Raj Makavana"
                    autoFocus
                    className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-within:border-indigo-500 transition-colors">
                  <span className="px-3.5 py-3 bg-slate-800 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Create Password (min 6 chars)
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-within:border-indigo-500 transition-colors">
                  <span className="px-3.5 py-3 bg-slate-800 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className={`flex rounded-xl overflow-hidden border bg-slate-900 transition-colors ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-rose-600 focus-within:border-rose-500'
                    : 'border-slate-700 focus-within:border-indigo-500'
                }`}>
                  <span className="px-3.5 py-3 bg-slate-800 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Terms & Conditions Agreement Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer shrink-0"
                />
                <label htmlFor="terms-checkbox" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
                  >
                    Terms &amp; Conditions
                  </a>{' '}
                  and acknowledge that all details shown on this website are strictly for <strong>educational purposes only</strong>, not investment or financial advice.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !acceptedTerms || (confirmPassword ? password !== confirmPassword : false)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Account & Get Started</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    resetFormState();
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── VIEW 3: FORGOT PASSWORD ──────────────────────────────────────── */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            {forgotStep === 'email' ? (
              <form onSubmit={handleForgotSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Registered Email
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 focus-within:border-indigo-500 transition-colors">
                    <span className="px-3.5 py-3 bg-slate-800 text-slate-400 text-sm flex items-center border-r border-slate-700 shrink-0">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoFocus
                      className="w-full px-3.5 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    We will send a 6-digit verification code to reset your password.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      resetFormState();
                    }}
                    className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !email.includes('@')}
                    className="w-2/3 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotResetPassword} className="space-y-3.5">
                {/* OTP Code */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-center tracking-[0.5em] text-xl font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('email');
                      setError('');
                    }}
                    className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6 || password !== confirmPassword}
                    className="w-2/3 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : '✓ Reset Password'}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  resetFormState();
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
