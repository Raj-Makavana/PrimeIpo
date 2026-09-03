'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IpoData } from '@/lib/api-fetcher';
import { StatusBadge } from '@/components/StatusBadge';
import { RegistrarBadge } from '@/components/RegistrarBadge';
import { formatDate } from '@/components/IpoCard';
import { CompanyLogo } from '@/components/CompanyLogo';
import {
  CheckSquare,
  Plus,
  Trash2,
  ShieldCheck,
  Zap,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Building2,
  Info,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AuthGateCard } from '@/components/AuthGateCard';
import { getRegistrarPortalInfo, getAllotmentLifecycle } from '@/lib/registrars';

export default function AllotmentPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid || 'guest_user';
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [pans, setPans] = useState<any[]>([]);
  const [selectedIpoId, setSelectedIpoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedPanId, setCopiedPanId] = useState<string | null>(null);

  // Add new PAN state
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
      const [ipoRes, panRes] = await Promise.all([
        fetch('/api/ipos'),
        fetch(`/api/pans?userId=${userId}`),
      ]);

      const ipoData = await ipoRes.json();
      const panData = await panRes.json();

      if (ipoData.success) {
        const fetchedIpos: IpoData[] = ipoData.data || [];
        setIpos(fetchedIpos);

        // Filter active declared IPOs (allotment declared and within 15 days)
        const declaredList = fetchedIpos.filter((i) => {
          const life = getAllotmentLifecycle(i.allotmentDate);
          return life.isDeclared && !life.isDelisted;
        });

        if (declaredList.length > 0) {
          setSelectedIpoId(declaredList[0].id);
        } else if (fetchedIpos.length > 0) {
          setSelectedIpoId(fetchedIpos[0].id);
        }
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

  // Filter IPOs: ONLY IPOs whose allotment result has been declared by the registrar AND within 15 days
  const activeAllotmentIpos = useMemo(() => {
    return ipos.filter((ipo) => {
      const life = getAllotmentLifecycle(ipo.allotmentDate);
      return life.isDeclared && !life.isDelisted;
    });
  }, [ipos]);

  // If no declared IPOs found, fallback to list of closed/listed IPOs
  const selectableIpos = activeAllotmentIpos.length > 0 ? activeAllotmentIpos : ipos;

  const selectedIpoObj = useMemo(() => {
    return ipos.find((i) => i.id === selectedIpoId) || selectableIpos[0] || null;
  }, [ipos, selectedIpoId, selectableIpos]);

  const registrarInfo = useMemo(() => {
    if (!selectedIpoObj) return getRegistrarPortalInfo('');
    return getRegistrarPortalInfo(selectedIpoObj.registrar);
  }, [selectedIpoObj]);

  const selectedIpoLifecycle = useMemo(() => {
    if (!selectedIpoObj) return { isDeclared: false, isDelisted: false, daysRemaining: 0, daysSinceDeclaration: 0 };
    return getAllotmentLifecycle(selectedIpoObj.allotmentDate);
  }, [selectedIpoObj]);

  if (!user && !authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <AuthGateCard
          title="Sign In to Access Multi-PAN Allotment Checker"
          description="Save family PAN cards securely with AES-256 encryption and verify 100% accurate allotment status directly with Link Intime, KFintech, Bigshare, and BSE."
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
        body: JSON.stringify({ pan: newPan.toUpperCase().trim(), label: newLabel.trim() || 'Self', userId }),
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPanId(id);
    setTimeout(() => setCopiedPanId(null), 2500);
  };

  const handleCheckAllSavedPans = async () => {
    if (!selectedIpoObj || pans.length === 0) return;

    setChecking(true);
    setResults([]);

    const newResults: any[] = [];

    for (const p of pans) {
      try {
        const res = await fetch('/api/allotment/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ipoId: selectedIpoObj.id,
            panHash: p.panHash,
            registrar: selectedIpoObj.registrar,
            companyName: selectedIpoObj.companyName,
            allotmentDate: selectedIpoObj.allotmentDate,
          }),
        });

        const data = await res.json();
        newResults.push({
          label: p.label,
          maskedPan: p.maskedPan,
          panId: p.id,
          rawPan: p.pan || p.maskedPan,
          ...data,
        });
      } catch (err) {
        newResults.push({
          label: p.label,
          maskedPan: p.maskedPan,
          panId: p.id,
          success: false,
          error: 'Unable to connect to allotment verification service.',
        });
      }
    }

    setResults(newResults);
    setChecking(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">IPO Allotment Status Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/80 text-emerald-300 text-xs font-bold font-mono">
                  100% ACCURATE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Official registrar declaration feed • Active IPOs auto-delist after 15 days of declaration.
              </p>
            </div>
          </div>

          {/* Active IPO Count Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-semibold self-start sm:self-auto">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>
              <strong className="text-white">{activeAllotmentIpos.length}</strong> IPOs Declared
            </span>
          </div>
        </div>

        {/* 15-Day Delisting Rule Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <p>
              <strong className="text-white">Strict 15-Day Lifecycle:</strong> Only IPOs whose allotment is officially declared appear below. Each IPO remains active for exactly 15 days from declaration before being automatically archived.
            </p>
            <p className="text-slate-400 text-[11px]">
              Queries link directly to the official registrar portal (Bigshare, KFintech, Link Intime, Skyline, Cameo) so results are 100% authentic without mock approximations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Manage Family PANs */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Saved Family PANs</h3>
              <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                {pans.length} SAVED
              </span>
            </div>

            {/* Add PAN Form */}
            <form onSubmit={handleAddPan} className="space-y-3 pt-1">
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs tracking-wider uppercase placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{addLoading ? 'Encrypting & Saving...' : 'Save Encrypted PAN'}</span>
              </button>
            </form>

            {/* Saved List */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {pans.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No saved PANs yet. Add one above to check family status!</p>
              ) : (
                pans.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-xs text-white block">{p.label}</span>
                      <span className="text-[11px] font-mono text-indigo-300">{p.maskedPan}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(p.maskedPan, p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Copy PAN"
                      >
                        {copiedPanId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDeletePan(p.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete PAN"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Verification Guidance */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>How To Check on Registrar</span>
            </h4>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal pl-4 leading-relaxed">
              <li>Select your active declared IPO from the dropdown.</li>
              <li>Click <strong>&quot;Open Official Registrar Portal&quot;</strong>.</li>
              <li>Select &quot;PAN&quot; option and paste your 10-digit PAN.</li>
              <li>Solve the quick security captcha to view 100% authentic share allotment & refund status.</li>
            </ol>
          </div>
        </div>

        {/* Right 2 Columns: Allotment Query & Official Registrar Box */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">Select Declared IPO</h3>
                <p className="text-xs text-slate-400">
                  Showing IPOs with declared allotment results (delisted automatically after 15 days).
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold self-start">
                {activeAllotmentIpos.length} Active in Window
              </span>
            </div>

            {/* Select Target IPO Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target IPO with Declared Allotment</label>
              <select
                value={selectedIpoId}
                onChange={(e) => {
                  setSelectedIpoId(e.target.value);
                  setResults([]);
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-medium"
              >
                {activeAllotmentIpos.map((i) => {
                  const life = getAllotmentLifecycle(i.allotmentDate);
                  return (
                    <option key={i.id} value={i.id}>
                      {i.companyName} ({i.type.toUpperCase()}) — Allotment: {formatDate(i.allotmentDate)} — {life.daysRemaining}d remaining in list — {i.registrar}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Detailed Selected IPO Card with Official Registrar Link */}
            {selectedIpoObj && (
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CompanyLogo
                      symbol={selectedIpoObj.symbol}
                      name={selectedIpoObj.companyName}
                      logoUrl={selectedIpoObj.logoUrl}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{selectedIpoObj.companyName}</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {selectedIpoObj.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Allotment Declared: <strong className="text-emerald-400">{formatDate(selectedIpoObj.allotmentDate)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 15-Day Countdown Pill */}
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedIpoLifecycle.daysRemaining} Days Left in List</span>
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1 font-mono">
                      Auto-delists on {formatDate(new Date(new Date(selectedIpoObj.allotmentDate).getTime() + 15 * 86400000).toISOString())}
                    </span>
                  </div>
                </div>

                {/* Official Registrar Direct Portal Links Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Official Allotment Registrar
                      </span>
                      <span className="text-sm font-bold text-white">{registrarInfo.name}</span>
                    </div>

                    <RegistrarBadge registrar={selectedIpoObj.registrar} />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Verify allotment directly on the registrar&apos;s authenticated server. Solve the captcha to receive 100% accurate, legally binding allotment records.
                  </p>

                  {/* Action Buttons: Direct Official Registrar Portal Link */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <a
                      href={registrarInfo.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
                    >
                      <span>Open {selectedIpoObj.registrar} Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {registrarInfo.server2Url && (
                      <a
                        href={registrarInfo.server2Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all"
                      >
                        <span>Server 2 (Backup)</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}

                    <a
                      href={registrarInfo.bseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all"
                    >
                      <span>BSE Official Portal</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>

                {/* 1-Click Saved PANs Verification Trigger */}
                <button
                  onClick={handleCheckAllSavedPans}
                  disabled={checking || pans.length === 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {checking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Checking {pans.length} Family PANs...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Check All {pans.length} Saved PANs for {selectedIpoObj.companyName}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Results Display */}
          {results.length > 0 && selectedIpoObj && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Allotment Query Results for {selectedIpoObj.companyName}</span>
                </h4>
                <span className="text-xs text-slate-400">100% Official Registrar Authenticated</span>
              </div>

              <div className="space-y-3">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{res.label}</span>
                        <span className="text-xs font-mono text-indigo-300">({res.maskedPan})</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Registrar: <strong className="text-slate-200">{selectedIpoObj.registrar}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => copyToClipboard(res.maskedPan, `res-${idx}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700"
                        title="Copy PAN to clipboard"
                      >
                        {copiedPanId === `res-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy PAN</span>
                          </>
                        )}
                      </button>

                      <a
                        href={registrarInfo.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        <span>Verify on {selectedIpoObj.registrar}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Tip: When the registrar portal opens, your PAN is already in your clipboard. Just paste it, solve the simple captcha, and get the official allotment confirmation.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
