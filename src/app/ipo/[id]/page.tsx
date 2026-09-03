'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IpoData } from '@/lib/api-fetcher';
import { StatusBadge } from '@/components/StatusBadge';
import { GmpBadge } from '@/components/GmpBadge';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { RegistrarBadge } from '@/components/RegistrarBadge';
import { GmpTrendChart } from '@/components/GmpTrendChart';
import { SubscriptionChart } from '@/components/SubscriptionChart';
import { formatDate } from '@/components/IpoCard';
import { ArrowLeft, Calendar, Building2, Layers, CheckSquare, Zap, ExternalLink, ShieldCheck, AlertCircle, Award, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AiAnalysisCard } from '@/components/AiAnalysisCard';

export default function IpoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const userId = user?.uid || 'guest_user';

  const [ipo, setIpo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-analysis' | 'financials' | 'allotment'>('overview');

  // Allotment checker inline state
  const [pans, setPans] = useState<any[]>([]);
  const [selectedPanId, setSelectedPanId] = useState<string>('');
  const [customPan, setCustomPan] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  useEffect(() => {
    async function loadIpo() {
      try {
        const res = await fetch(`/api/ipos/${id}`);
        const data = await res.json();
        if (data.success) {
          setIpo(data.data);
        }
      } catch (err) {
        console.error('Failed to load IPO details:', err);
      } finally {
        setLoading(false);
      }
    }

    async function loadPans() {
      try {
        const res = await fetch(`/api/pans?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setPans(data.data || []);
          if (data.data.length > 0) setSelectedPanId(data.data[0].id);
        }
      } catch (err) {}
    }

    loadIpo();
    loadPans();
  }, [id, userId]);

  const handleCheckAllotment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipo) return;

    setCheckLoading(true);
    setCheckResult(null);

    let targetPan = customPan;
    let targetHash = '';

    if (selectedPanId) {
      const match = pans.find((p) => p.id === selectedPanId);
      if (match) targetHash = match.panHash;
    }

    try {
      const res = await fetch('/api/allotment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipoId: ipo.id,
          pan: targetPan || undefined,
          panHash: targetHash || undefined,
          registrar: ipo.registrar,
          companyName: ipo.companyName,
        }),
      });

      const data = await res.json();
      setCheckResult(data);
    } catch (err: any) {
      setCheckResult({ success: false, error: 'Failed to check allotment status.' });
    } finally {
      setCheckLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="h-44 bg-slate-800/80 rounded-2xl" />
        <div className="h-64 bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  if (!ipo) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">IPO Not Found</h2>
        <p className="text-slate-400 text-sm">The requested IPO could not be loaded.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const minInvestment = ipo.priceBandHigh * ipo.lotSize;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all IPOs</span>
      </button>

      {/* Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 p-3 flex items-center justify-center font-black text-xl text-indigo-400 shrink-0 shadow-inner">
              {ipo.symbol.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{ipo.companyName}</h1>
                <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded font-semibold uppercase">
                  {ipo.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{ipo.sector} Sector</span>
                <span>•</span>
                <span>Symbol: {ipo.symbol}</span>
              </p>
            </div>
          </div>

          <StatusBadge status={ipo.status} size="lg" />
        </div>

        {/* Key Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">
              {ipo.status === 'listed' ? 'Issue Price' : 'Price Band'}
            </span>
            <span className="text-base font-bold text-white mt-0.5 block">
              {ipo.priceBandHigh > 0
                ? ipo.priceBandLow === ipo.priceBandHigh
                  ? `₹${ipo.priceBandHigh}`
                  : `₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh}`
                : 'TBA (DRHP Filed)'}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">
              {ipo.status === 'listed' && ipo.priceBandHigh > 0 ? 'NSE / BSE Listing Price' : 'Lot Size'}
            </span>
            <span className={`text-base font-bold mt-0.5 block ${ipo.status === 'listed' ? 'text-purple-300' : 'text-white'}`}>
              {ipo.status === 'listed' && ipo.priceBandHigh > 0
                ? `₹${ipo.priceBandHigh + (ipo.gmpCurrent || 0)} (${ipo.gmpPct > 0 ? `+${ipo.gmpPct}%` : 'Par'})`
                : `${ipo.lotSize} Shares`}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">
              {ipo.status === 'listed' ? 'Listing Gain' : 'Min Retail Application'}
            </span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">
              {ipo.status === 'listed'
                ? `+₹${ipo.gmpCurrent} / Share (+${ipo.gmpPct}%)`
                : minInvestment > 0
                ? `₹${minInvestment.toLocaleString('en-IN')}`
                : 'TBA'}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">Issue Size</span>
            <span className="text-base font-bold text-indigo-300 mt-0.5 block">
              {ipo.issueSize > 0 ? `₹${ipo.issueSize} Cr` : 'TBA'}
            </span>
          </div>
        </div>

        {/* Live Badges + Registrar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <GmpBadge gmp={ipo.gmpCurrent} gmpPct={ipo.gmpPct} />
            <SubscriptionBadge total={ipo.subscriptionTotal} />
          </div>
          <RegistrarBadge registrar={ipo.registrar} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-1">
        {(['overview', 'ai-analysis', 'financials', 'allotment'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab === 'ai-analysis' ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Summary & Verdict</span>
              </>
            ) : tab === 'allotment' ? (
              'Allotment Status'
            ) : (
              tab.charAt(0).toUpperCase() + tab.slice(1)
            )}
          </button>
        ))}
      </div>

      {/* Tab: Dedicated AI Analysis */}
      {activeTab === 'ai-analysis' && (
        <div className="space-y-6">
          <AiAnalysisCard ipoId={ipo.id} />
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Featured AI 30-Second Briefing */}
          <AiAnalysisCard ipoId={ipo.id} />
          {/* Issue Dates Timeline */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              IPO Key Dates Schedule
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Bidding Opens</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">{formatDate(ipo.openDate)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Bidding Closes</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">{formatDate(ipo.closeDate)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Allotment Date</span>
                <span className="text-sm font-semibold text-emerald-400 mt-1 block">{formatDate(ipo.allotmentDate)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Listing Date</span>
                <span className="text-sm font-semibold text-purple-400 mt-1 block">{formatDate(ipo.listingDate)}</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GMP Trend Chart */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Live GMP Trend</h3>
                <span className="text-xs text-emerald-400 font-semibold">+₹{ipo.gmpCurrent} ({ipo.gmpPct}%)</span>
              </div>
              <GmpTrendChart data={ipo.gmpHistory} />
            </div>

            {/* Subscription Chart */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Live Subscription Breakdown</h3>
                <span className="text-xs text-indigo-400 font-semibold">{ipo.subscriptionTotal}× Total</span>
              </div>
              <SubscriptionChart
                qib={ipo.subscriptionQib}
                nii={ipo.subscriptionNii}
                retail={ipo.subscriptionRetail}
                employee={ipo.subscriptionEmployee}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financials & Peer Comparison */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Company Financial Performance (in ₹ Cr)</h3>
            {ipo.financials && ipo.financials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-lg">Financial Period</th>
                      <th className="p-3">Total Revenue</th>
                      <th className="p-3">Profit After Tax (PAT)</th>
                      <th className="p-3 rounded-r-lg">EPS (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ipo.financials.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="p-3 font-semibold text-white">{row.year}</td>
                        <td className="p-3 text-slate-200">₹{row.revenue} Cr</td>
                        <td className="p-3 text-emerald-400 font-medium">₹{row.pat} Cr</td>
                        <td className="p-3 text-slate-200">{row.eps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4">Draft red herring prospectus (DRHP) financials will be updated upon final RHP filing.</p>
            )}
          </div>

          {/* Peer Comparison */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Industry Peer Comparison</h3>
            {ipo.peers && ipo.peers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ipo.peers.map((peer: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white text-sm block">{peer.name}</span>
                      <span className="text-xs text-slate-400">ROE: {peer.roe}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-800">
                      P/E: {peer.pe}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4">Listed industry peers will be populated as benchmark valuations are established.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Allotment Status Checker */}
      {activeTab === 'allotment' && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Check Allotment Status</h3>
              <p className="text-xs text-slate-400">
                Official registrar: <span className="text-slate-200 font-semibold">{ipo.registrar}</span>
              </p>
            </div>
          </div>

          {/* Informational banner per section 4 rules */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Registrar Routing Policy:</strong> Routed directly through official registrar servers.{' '}
              {ipo.registrar.toLowerCase().includes('bigshare')
                ? 'Bigshare IPOs are checked automatically in one click.'
                : `${ipo.registrar} requires a captcha — we will open the registrar page pre-filled with your PAN.`}
            </span>
          </div>

          <form onSubmit={handleCheckAllotment} className="space-y-4 max-w-lg">
            {pans.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Saved PAN</label>
                <select
                  value={selectedPanId}
                  onChange={(e) => {
                    setSelectedPanId(e.target.value);
                    setCustomPan('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {pans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.maskedPan})
                    </option>
                  ))}
                  <option value="">+ Enter custom PAN number</option>
                </select>
              </div>
            )}

            {(!selectedPanId || pans.length === 0) && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Enter 10-Digit PAN Number</label>
                <input
                  type="text"
                  value={customPan}
                  onChange={(e) => setCustomPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs tracking-wider uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={checkLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20"
            >
              {checkLoading ? 'Querying Registrar...' : 'Check Allotment Result'}
            </button>
          </form>

          {/* Results display */}
          {checkResult && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-fade-in">
              {checkResult.requiresCaptcha ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Captcha Required by {ipo.registrar}</span>
                  </div>
                  <p className="text-xs text-slate-300">{checkResult.message}</p>
                  <a
                    href={checkResult.redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
                  >
                    <span>Open Pre-filled Registrar Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : checkResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Status for {checkResult.data?.panMasked}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        checkResult.data?.status === 'allotted'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {checkResult.data?.status === 'allotted' ? '🎉 ALLOTTED!' : 'NOT ALLOTTED'}
                    </span>
                  </div>
                  {checkResult.data?.status === 'allotted' && (
                    <p className="text-xs text-emerald-400 font-semibold">
                      Congratulations! You were allotted {checkResult.data.shares} shares.
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 pt-1">{checkResult.disclaimer}</p>
                </div>
              ) : (
                <p className="text-xs text-rose-400">{checkResult.error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
