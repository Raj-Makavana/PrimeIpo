'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, CheckCircle2, Zap, AlertCircle, Info, Clock, TrendingUp, ListPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const ALERT_TYPES = [
  {
    id: 'newIpoAlerts',
    icon: ListPlus,
    iconColor: 'text-blue-400',
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/40',
    title: 'New IPO Announcements',
    subtitle: 'Email sent when a brand-new Mainboard or SME IPO is filed with SEBI',
    example: '📢 New IPO Alert: Zepto files for ₹3,500 Cr IPO. Bidding opens 15/10/2026.',
  },
  {
    id: 'allotmentAlerts',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/40',
    title: 'Allotment Day Reminder',
    subtitle: 'Email reminder on the morning of allotment finalization date for each IPO you follow',
    example: '🎯 Allotment Day: Purple Style Labs allotment finalizes today (03/09/2026). Check now!',
  },
  {
    id: 'gmpSurgeAlerts',
    icon: TrendingUp,
    iconColor: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/40',
    title: 'GMP Surge Alert (>25% Premium)',
    subtitle: 'Instant email when Grey Market Premium crosses 25%+ on any open or upcoming IPO',
    example: '🚀 High GMP Alert: Rays of Belief GMP surged to 31% (₹74 above issue price).',
  },
  {
    id: 'listingAlerts',
    icon: Zap,
    iconColor: 'text-purple-400',
    bg: 'bg-purple-950/40',
    border: 'border-purple-800/40',
    title: 'Listing Day Notification',
    subtitle: 'Email alert on listing day with estimated listing price based on final GMP',
    example: '📈 Listing Day: Deepa Jewellers lists today. Expected price ₹212 (+19.8% GMP gain).',
  },
];

export default function AlertsPage() {
  const { user } = useAuth();
  const userId = user?.uid || 'guest_user';

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    newIpoAlerts: true,
    allotmentAlerts: true,
    gmpSurgeAlerts: true,
    listingAlerts: true,
    pushAlerts: true,
  });
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        const res = await fetch(`/api/alerts?userId=${userId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setUserEmail(json.data.email || user?.email || '');
          setPrefs({
            newIpoAlerts: json.data.newIpoAlerts ?? true,
            allotmentAlerts: json.data.allotmentAlerts ?? true,
            gmpSurgeAlerts: json.data.gmpSurgeAlerts ?? true,
            listingAlerts: json.data.listingAlerts ?? true,
            pushAlerts: json.data.pushAlerts ?? true,
          });
        } else {
          setUserEmail(user?.email || '');
        }
      } catch (err) {
        console.error('Failed to load alert settings:', err);
        setUserEmail(user?.email || '');
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          emailAlerts: true,
          pushAlerts: prefs.pushAlerts,
          gmpSurgeAlerts: prefs.gmpSurgeAlerts,
          allotmentAlerts: prefs.allotmentAlerts,
          newIpoAlerts: prefs.newIpoAlerts,
          listingAlerts: prefs.listingAlerts,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      } else {
        setError(json.error || 'Failed to save preferences');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

      {/* Page Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">IPO Alert Center</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Get instant email notifications for new IPOs, allotment dates, GMP surges, and listing day alerts.
            </p>
          </div>
        </div>

        {/* How it works banner */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/20 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>How Alerts Work</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300">
            <li className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Email Alerts</strong>: We send real emails to your registered address for each trigger you enable below.</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Timing</strong>: Alerts are dispatched daily at 8:00 AM IST for date-based events, and within minutes for GMP surges.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">No spam</strong>: Emails only sent when a genuine trigger occurs. You can enable/disable each type independently.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Success/Error banners */}
      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Alert preferences saved! You will receive emails at <strong>{userEmail || 'your registered address'}</strong>.</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Email input */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              Delivery Email Address
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              Database Synced
            </span>
          </div>
          <p className="text-[11px] text-slate-400">All enabled alerts will be sent to this email address. Make sure it is correct.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 flex items-center rounded-xl bg-slate-900 border border-slate-700 focus-within:border-indigo-500 px-3 py-2.5 transition-colors">
              <Mail className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="email"
                placeholder="investor@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-600 font-medium"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!userEmail || !userEmail.includes('@')) {
                  setError('Please enter a valid email address first.');
                  return;
                }
                setSaving(true);
                setError('');
                try {
                  const res = await fetch('/api/alerts/test-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 5000);
                  } else {
                    setError(data.error || 'Failed to dispatch test alert');
                  }
                } catch (e: any) {
                  setError(e.message || 'Error triggering test alert');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !userEmail}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shrink-0 flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Send Test Alert</span>
            </button>
          </div>
        </div>

        {/* Alert Types */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Email Alert Types</h3>
          <p className="text-[11px] text-slate-400">Toggle each alert type. A preview shows the exact email you will receive.</p>

          <div className="space-y-3">
            {ALERT_TYPES.map(({ id, icon: Icon, iconColor, bg, border, title, subtitle, example }) => (
              <div
                key={id}
                className={`p-4 rounded-xl border ${border} ${prefs[id] ? bg : 'bg-slate-900/40 border-slate-800'} transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 shrink-0 ${prefs[id] ? iconColor : 'text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className={`font-semibold text-xs block ${prefs[id] ? 'text-white' : 'text-slate-500'}`}>{title}</span>
                      <span className="text-[11px] text-slate-400">{subtitle}</span>
                      {prefs[id] && (
                        <div className="mt-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] text-slate-300 font-mono">
                          {example}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className={`shrink-0 w-11 h-6 rounded-full transition-all border ${
                      prefs[id]
                        ? 'bg-indigo-600 border-indigo-500'
                        : 'bg-slate-800 border-slate-700'
                    } relative`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        prefs[id] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In-browser push */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white">In-Browser Push Notifications</h3>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="font-semibold text-xs text-white block">Real-time Browser Alerts</span>
              <span className="text-[11px] text-slate-400">Receive pop-up alerts while browsing PrimeIPO (requires browser permission)</span>
            </div>
            <button
              type="button"
              onClick={() => toggle('pushAlerts')}
              className={`shrink-0 w-11 h-6 rounded-full transition-all border ${
                prefs.pushAlerts ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'
              } relative`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  prefs.pushAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Bell className="w-4 h-4" />
          {saving ? 'Saving Preferences...' : 'Save Alert Preferences'}
        </button>
      </form>
    </div>
  );
}
