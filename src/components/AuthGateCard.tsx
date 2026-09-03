'use client';

import React from 'react';
import { Lock, Sparkles, LogIn, UserPlus, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AuthGateCardProps {
  title?: string;
  description?: string;
  badge?: string;
  feature?: string;
}

export const AuthGateCard: React.FC<AuthGateCardProps> = ({
  title = 'Sign In to Access Complete IPO Intelligence',
  description = 'Join PrimeIPO to unlock live GMP trends, category subscription breakdowns, company strengths & risks, and AI investment verdicts.',
  badge = 'PrimeIPO Member Exclusive',
  feature = 'IPO Details & Analysis',
}) => {
  const { openAuthModal } = useAuth();

  return (
    <div className="glass-card rounded-3xl p-8 sm:p-12 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-slate-900/95 to-slate-950 shadow-2xl relative overflow-hidden text-center max-w-2xl mx-auto my-8">
      {/* Glow ambient decoration */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -mt-20" />

      <div className="relative z-10 space-y-6">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/40">
          <Lock className="w-8 h-8" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{badge}</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Features Included List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto text-left pt-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Live Grey Market Premium (GMP)</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Real-Time Subscription Demand</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Key Strengths &amp; Risk Analysis</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Audited Financial Statements</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => openAuthModal('signin')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Unlock {feature}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => openAuthModal('signup')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Create Free Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
