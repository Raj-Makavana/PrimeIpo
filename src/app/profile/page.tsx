'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/AuthModal';
import {
  User, Mail, Phone, LogOut, Shield, Bell, CheckSquare,
  ChevronRight, Flame, Star, TrendingUp, Award
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-24 bg-slate-800 rounded-3xl" />
        <div className="h-48 bg-slate-800/70 rounded-3xl" />
        <div className="h-32 bg-slate-800/50 rounded-3xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-fade-in">
          {/* Not logged in illustration */}
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <User className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Sign In to PrimeIpo</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sign in to save your family PANs, track allotment results, and get instant IPO alerts.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              Sign In / Create Account
            </button>
            <p className="text-xs text-slate-500">Google OAuth or Phone OTP — takes 10 seconds</p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-3 pt-4 text-left">
            {[
              { icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800', title: 'Multi-PAN Allotment', desc: 'Check all family PANs in one click' },
              { icon: Bell, color: 'text-indigo-400', bg: 'bg-indigo-950/60 border-indigo-800', title: 'Instant IPO Alerts', desc: 'GMP surge & allotment day notifications' },
              { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/60', title: 'AES-256 PAN Encryption', desc: 'Your PAN numbers are always encrypted' },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className={`flex items-center gap-3 p-4 rounded-xl border ${bg}`}>
                <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                <div>
                  <span className="text-sm font-semibold text-white block">{title}</span>
                  <span className="text-xs text-slate-400">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </>
    );
  }

  // ─── Logged-in Profile View ───────────────────────────────────────────
  const displayName = user.displayName || user.phoneNumber || user.email?.split('@')[0] || 'Investor';
  const initials = displayName.substring(0, 2).toUpperCase();

  const stats = [
    { label: 'IPOs Tracked', value: '—', icon: Flame, color: 'text-orange-400' },
    { label: 'Saved PANs', value: '—', icon: CheckSquare, color: 'text-emerald-400' },
    { label: 'Allotments Won', value: '—', icon: Award, color: 'text-indigo-400' },
    { label: 'Alerts Active', value: '3', icon: Bell, color: 'text-violet-400' },
  ];

  const quickLinks = [
    { label: 'My Saved PANs', href: '/allotment', icon: CheckSquare, badge: 'Manage' },
    { label: 'IPO Alerts Preferences', href: '/alerts', icon: Bell, badge: 'Edit' },
    { label: 'Sector Explorer', href: '/sectors', icon: TrendingUp, badge: 'Browse' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          {/* Avatar */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-20 h-20 rounded-3xl ring-4 ring-indigo-500/30 shadow-xl"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-indigo-600/25">
              {initials}
            </div>
          )}

          {/* Name & Account info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white truncate">{displayName}</h1>
            <div className="mt-2 space-y-1">
              {user.email && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {user.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
              <Star className="w-3.5 h-3.5" />
              <span>IPO Investor Account</span>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
              <Icon className={`w-4 h-4 mx-auto ${color}`} />
              <span className="text-lg font-extrabold text-white block">{value}</span>
              <span className="text-[10px] text-slate-400 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-card rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
        <h2 className="px-5 py-4 text-sm font-bold text-white">Quick Access</h2>
        {quickLinks.map(({ label, href, icon: Icon, badge }) => (
          <a
            key={href}
            href={href}
            className="flex items-center justify-between px-5 py-4 hover:bg-slate-900/60 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center">
                <Icon className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">{badge}</span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
          </a>
        ))}
      </div>

      {/* Security section */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Security & Privacy
        </h2>
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/80 leading-relaxed">
          Your PAN numbers are encrypted with AES-256 before storage. We never store or log your raw PAN in plain text. Allotment checks are routed directly through official registrar portals only.
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={logout}
        className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-rose-500/50 hover:bg-rose-950/20 text-slate-300 hover:text-rose-400 font-semibold text-sm transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out of PrimeIpo
      </button>
    </div>
  );
}
