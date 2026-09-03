'use client';

import React, { useState, useEffect } from 'react';
import { IpoData } from '@/lib/api-fetcher';
import { StatusBadge } from '@/components/StatusBadge';
import { RegistrarBadge } from '@/components/RegistrarBadge';
import { formatDate } from '@/components/IpoCard';
import { CheckSquare, Plus, Trash2, ShieldCheck, Zap, ExternalLink, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

import { AuthGateCard } from '@/components/AuthGateCard';

export default function AllotmentPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid || 'guest_user';
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [pans, setPans] = useState<any[]>([]);
  const [selectedIpoId, setSelectedIpoId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add new PAN modal state
  const [newPan, setNewPan] = useState('');
  const [newLabel, setNewLabel] = useState('Self');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Allotment Check States
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ipoRes, panRes] = await Promise.all([fetch('/api/ipos'), fetch(`/api/pans?userId=${userId}`)]);

      const ipoData = await ipoRes.json();
      const panData = await panRes.json();

      if (ipoData.success) {
        setIpos(ipoData.data || []);
        if (ipoData.data.length > 0) setSelectedIpoId(ipoData.data[0].id);
      }
      if (panData.success) {
        setPans(panData.data || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]);

  if (!user && !authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <AuthGateCard
          title="Sign In to Access Multi-PAN Allotment Checker"
          description="Save family PAN cards securely with AES-256 encryption and check allotment status in 1 click across Link Intime, KFintech, and Bigshare."
          badge="Investor Exclusive"
          feature="Allotment Checker"
        />
      </div>
    );
  }

  const handleAddPan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPan || newPan.trim().length !== 10) {
      setAddError('Please enter a valid 10-character PAN number e.g. ABCDE1234F');
      return;
    }

    setAddLoading(true);
    setAddError('');

    try {
      const res = await fetch('/api/pans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: newPan, label: newLabel, userId }),
      });
      const data = await res.json();

      if (data.success) {
        setNewPan('');
        setNewLabel('Self');
        loadData();
      } else {
        setAddError(data.error || 'Failed to save PAN');
      }
    } catch (err: any) {
      setAddError(err.message || 'Error saving PAN');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeletePan = async (id: string) => {
    try {
      await fetch(`/api/pans?id=${id}`, { method: 'DELETE' });
      setPans(pans.filter((p) => p.id !== id));
    } catch (err) {}
  };

  const handleCheckAllSavedPans = async () => {
    if (!selectedIpoId || pans.length === 0) return;

    setChecking(true);
    setResults([]);

    const selectedIpo = ipos.find((i) => i.id === selectedIpoId);
    const newResults: any[] = [];

    for (const p of pans) {
      try {
        const res = await fetch('/api/allotment/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ipoId: selectedIpoId,
            panHash: p.panHash,
            registrar: selectedIpo?.registrar,
            companyName: selectedIpo?.companyName,
          }),
        });

        const data = await res.json();
        newResults.push({ label: p.label, maskedPan: p.maskedPan, ...data });
      } catch (err) {
        newResults.push({ label: p.label, maskedPan: p.maskedPan, success: false, error: 'Request error' });
      }
    }

    setResults(newResults);
    setChecking(false);
  };

  const selectedIpoObj = ipos.find((i) => i.id === selectedIpoId);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Multi-PAN Allotment Checker</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Check status for yourself + family members in one click across Bigshare, KFintech, Link Intime, Cameo & Skyline.
            </p>
          </div>
        </div>

        {/* Section 4 Disclaimer Note */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Routed through official registrar. Bigshare IPOs are checked automatically; others open a pre-filled page per PAN to solve captcha safely.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Manage Family PANs */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Saved Family PANs</span>
              <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                {pans.length} SAVED
              </span>
            </h3>

            {/* Add PAN Form */}
            <form onSubmit={handleAddPan} className="space-y-3 pt-2">
              {addError && <p className="text-xs text-rose-400">{addError}</p>}
              <div>
                <input
                  type="text"
                  placeholder="Label e.g. Self, Dad, Mom"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="10-Digit PAN (ABCDE1234F)"
                  value={newPan}
                  onChange={(e) => setNewPan(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs tracking-wider uppercase placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>{addLoading ? 'Encrypting & Saving...' : 'Save Encrypted PAN'}</span>
              </button>
            </form>

            {/* Saved List */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {pans.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No saved PANs yet. Add one above!</p>
              ) : (
                pans.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-white block">{p.label}</span>
                      <span className="text-[11px] font-mono text-indigo-300">{p.maskedPan}</span>
                    </div>
                    <button
                      onClick={() => handleDeletePan(p.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Multi-PAN Allotment Checker */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <h3 className="text-lg font-bold text-white">1-Click Allotment Query</h3>

            {/* Select IPO */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Target IPO</label>
              <select
                value={selectedIpoId}
                onChange={(e) => setSelectedIpoId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {ipos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.companyName} ({i.type.toUpperCase()}) — Closes {formatDate(i.closeDate)} — {i.registrar}
                  </option>
                ))}
              </select>
            </div>

            {selectedIpoObj && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Official Registrar</span>
                  <span className="text-slate-100 font-bold text-sm">{selectedIpoObj.registrar}</span>
                </div>
                <RegistrarBadge registrar={selectedIpoObj.registrar} />
              </div>
            )}

            <button
              onClick={handleCheckAllSavedPans}
              disabled={checking || pans.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking {pans.length} Saved PANs...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Check All {pans.length} Saved PANs in 1-Click</span>
                </>
              )}
            </button>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
              <h4 className="text-sm font-bold text-white">Allotment Status Results</h4>
              <div className="space-y-3">
                {results.map((res, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{res.label}</span>
                        <span className="text-xs font-mono text-slate-400">({res.maskedPan})</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Source: {res.source === 'cache' ? 'Cached Result (Instant)' : res.source === 'registrar_auto' ? 'Bigshare Auto' : 'Registrar Portal'}
                      </span>
                    </div>

                    {res.requiresCaptcha ? (
                      <a
                        href={res.redirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all self-start sm:self-auto"
                      >
                        <span>Open Registrar & Captcha</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                          res.data?.status === 'allotted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {res.data?.status === 'allotted' ? `🎉 ALLOTTED (${res.data.shares} Shares)` : 'NOT ALLOTTED'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
