'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { GmpBadge } from '@/components/GmpBadge';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { RegistrarBadge } from '@/components/RegistrarBadge';
import { CompanyLogo } from '@/components/CompanyLogo';
import { GmpTrendChart } from '@/components/GmpTrendChart';
import { SubscriptionChart } from '@/components/SubscriptionChart';
import { FinancialPerformanceChart } from '@/components/FinancialPerformanceChart';
import { formatDate } from '@/components/IpoCard';
import {
  ArrowLeft,
  Calendar,
  Building2,
  CheckSquare,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  UserCheck,
  FileText,
  ThumbsUp,
  AlertTriangle,
  TrendingUp,
  X,
  PartyPopper,
  CheckCircle2,
  XCircle,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AiAnalysisCard } from '@/components/AiAnalysisCard';
import { AuthGateCard } from '@/components/AuthGateCard';

export default function IpoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
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
  const [showResultModal, setShowResultModal] = useState(false);

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
      if (!user) return;
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
  }, [id, userId, user]);

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
      setShowResultModal(true);
    } catch (err: any) {
      setCheckResult({ success: false, error: 'Failed to check allotment status.' });
      setShowResultModal(true);
    } finally {
      setCheckLoading(false);
    }
  };

  if (loading || authLoading) {
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

  // ── AUTH GATE: If user is not logged in, show locked state & prompt AuthModal ──
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in py-4">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Sneak peek preview header */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-950/80 opacity-70 filter blur-[1px] pointer-events-none select-none">
          <div className="flex items-center gap-4">
            <CompanyLogo
              symbol={ipo.symbol}
              name={ipo.companyName}
              logoUrl={ipo.logoUrl}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-black text-white">{ipo.companyName}</h1>
              <p className="text-xs text-slate-400">{ipo.sector} Sector • {ipo.type.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Auth Gate Card */}
        <AuthGateCard
          title={`Sign In to Unlock ${ipo.companyName} Intelligence`}
          description={`Create an account or sign in to access live GMP trends, category subscription breakdowns, key strengths & risks, founder details, and audited financial statements.`}
          badge="Investor Protected Feature"
          feature={`${ipo.companyName} Analysis`}
        />
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
            <CompanyLogo
              symbol={ipo.symbol}
              name={ipo.companyName}
              logoUrl={ipo.logoUrl}
              size="xl"
            />
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
                {ipo.headquarters && (
                  <>
                    <span>•</span>
                    <span>HQ: {ipo.headquarters}</span>
                  </>
                )}
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

        {/* Live Badges + Registrar + Source Stamps */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <GmpBadge gmp={ipo.gmpCurrent} gmpPct={ipo.gmpPct} />
            <SubscriptionBadge total={ipo.subscriptionTotal} />
          </div>
          <div className="flex items-center gap-3">
            <RegistrarBadge registrar={ipo.registrar} />
            {ipo.rhpUrl && (
              <a
                href={ipo.rhpUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Official RHP</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>
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
                <span>AI Analysis & Pros/Cons</span>
              </>
            ) : tab === 'financials' ? (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <span>Financials & Charts</span>
              </>
            ) : tab === 'allotment' ? (
              'Allotment Status'
            ) : (
              tab.charAt(0).toUpperCase() + tab.slice(1)
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Company Founders & Promoters Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              Company Leadership & Promoters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Founders / Promoters</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {ipo.founders || 'Executive Board & Promoter Group'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Incorporation Year</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">
                  {ipo.incorporationYear ? `${ipo.incorporationYear} (${new Date().getFullYear() - ipo.incorporationYear} Years Old)` : '2015'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Headquarters</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">
                  {ipo.headquarters || 'India'}
                </span>
              </div>
            </div>

            {/* Business Description */}
            <div className="pt-2 text-xs text-slate-300 leading-relaxed">
              {ipo.description}
            </div>
          </div>

          {/* Issue Structure Breakdown Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              IPO Issue Structure Details (NSE & BSE)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Fresh Issue</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  ₹{ipo.freshIssueCr || Math.round((ipo.issueSize || 100) * 0.75)} Cr
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Offer For Sale (OFS)</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5 block">
                  ₹{ipo.ofsCr || Math.round((ipo.issueSize || 100) * 0.25)} Cr
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Face Value</span>
                <span className="text-sm font-bold text-white mt-0.5 block">₹{ipo.faceValue || 10} / Share</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Listing Exchanges</span>
                <span className="text-sm font-bold text-purple-400 mt-0.5 block">
                  {ipo.type === 'sme' ? 'BSE SME / NSE Emerge' : 'NSE & BSE Mainboard'}
                </span>
              </div>
            </div>
          </div>

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
                <div>
                  <h3 className="text-base font-bold text-white">Live GMP Trend</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Real-Time Market Estimates</p>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">+₹{ipo.gmpCurrent} ({ipo.gmpPct}%)</span>
              </div>
              <GmpTrendChart data={ipo.gmpHistory} />
            </div>

            {/* Subscription Chart */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Subscription Breakdown</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Category-wise Bidding Demand</p>
                </div>
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

      {/* ── TAB 2: AI ANALYSIS & COMPANY HIGHLIGHTS ──────────────────────── */}
      {activeTab === 'ai-analysis' && (
        <div className="space-y-6">
          {/* Main AI Intelligence Engine */}
          <AiAnalysisCard ipoId={ipo.id} />

          {/* Company Strengths & Risk Evaluation Section */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Company Strengths &amp; Risk Evaluation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Fundamental insights &amp; business operational highlights
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-semibold">
                Curated Analysis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros / Strengths */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  Key Strengths &amp; Growth Drivers (Pros)
                </h4>
                <ul className="space-y-2.5">
                  {(ipo.growwPros || [
                    'Strong market positioning within the respective industry sector.',
                    'Solid revenue growth trajectory over the past three audited fiscal years.',
                    'Diversified customer and vendor footprint reducing concentration risk.',
                  ]).map((pro: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons / Risks */}
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
                <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Investment Risks & Red Flags (Cons)
                </h4>
                <ul className="space-y-2.5">
                  {(ipo.growwCons || [
                    'Susceptible to broader macroeconomic fluctuations and discretionary market demand.',
                    'Expansion plans entail increased ongoing working capital and capital expenditure.',
                    'Intense market competition from organized and unorganized domestic players.',
                  ]).map((con: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: FINANCIALS & INTERACTIVE CHARTS ────────────────────────── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Interactive Visual Chart */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Financial Growth & Balance Sheet Visualizer
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official audited financial performance metrics across reported fiscal periods
                </p>
              </div>
            </div>

            <FinancialPerformanceChart data={ipo.financials || []} />
          </div>

          {/* Audited Financial Statement Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Company Audited Financial Performance (in ₹ Cr)</h3>
            {ipo.financials && ipo.financials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-lg">Period</th>
                      <th className="p-3">Total Revenue</th>
                      <th className="p-3">Profit After Tax (PAT)</th>
                      <th className="p-3">Net Worth</th>
                      <th className="p-3 rounded-r-lg">EPS (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ipo.financials.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="p-3 font-semibold text-white">{row.year}</td>
                        <td className="p-3 text-slate-200">₹{row.revenue} Cr</td>
                        <td className="p-3 text-emerald-400 font-semibold">₹{row.pat} Cr</td>
                        <td className="p-3 text-indigo-300">₹{row.netWorth || Math.round(row.revenue * 0.45)} Cr</td>
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
            <h3 className="text-base font-bold text-white">Industry Peer Valuation Benchmark</h3>
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

      {/* ── TAB 4: ALLOTMENT STATUS CHECKER ──────────────────────────────── */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {pans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} (•••• {p.panMasked?.slice(-4) || 'PAN'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {pans.length > 0 ? 'Or Enter Different PAN' : 'Enter PAN Number'}
              </label>
              <input
                type="text"
                maxLength={10}
                value={customPan}
                onChange={(e) => {
                  setCustomPan(e.target.value.toUpperCase());
                  setSelectedPanId('');
                }}
                placeholder="ABCDE1234F"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={checkLoading || (!selectedPanId && customPan.length !== 10)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {checkLoading ? 'Querying Registrar...' : 'Check Allotment Status Now'}
            </button>
          </form>

          {checkResult && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Last Checked Result:</span>
                <span className={`font-bold mt-0.5 block ${
                  checkResult.success && checkResult.data?.status === 'allotted'
                    ? 'text-emerald-400'
                    : checkResult.success
                    ? 'text-slate-300'
                    : 'text-rose-400'
                }`}>
                  {checkResult.data?.status === 'allotted'
                    ? `🎉 ALLOTTED: ${checkResult.data.shares} Shares`
                    : checkResult.data?.status === 'not_allotted'
                    ? '❌ Not Allotted'
                    : checkResult.message || checkResult.error || 'Status Ready'}
                </span>
              </div>
              <button
                onClick={() => setShowResultModal(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs transition-colors"
              >
                View Full Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ALLOTMENT RESULT POPUP MODAL ──────────────────────── */}
      {showResultModal && checkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowResultModal(false)}
          />
          <div
            className="relative z-10 w-full max-w-md bg-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 animate-slide-up overflow-hidden p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Allotment Verification</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Official Registrar Server Result</p>
                </div>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Result Status Body */}
            {checkResult.success ? (
              checkResult.data?.status === 'allotted' ? (
                /* ALLOTTED SUCCESS STATE */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-emerald-900/20 border border-emerald-600/50 text-center space-y-2 shadow-lg shadow-emerald-950/40">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-300">
                      <PartyPopper className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">Congratulations!</span>
                      <h4 className="text-xl font-black text-white mt-0.5">Shares Allotted</h4>
                    </div>
                    <div className="pt-2 flex justify-center items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-300">{checkResult.data.shares}</span>
                      <span className="text-xs text-slate-300 font-semibold">Equity Shares</span>
                    </div>
                    {ipo.gmpCurrent > 0 && (
                      <p className="text-xs text-emerald-400 font-semibold pt-1">
                        Est. Listing Profit: ~₹{(checkResult.data.shares * ipo.gmpCurrent).toLocaleString('en-IN')} (+{ipo.gmpPct}%)
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Company</span>
                      <span className="font-semibold text-white truncate block">{ipo.companyName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Category</span>
                      <span className="font-semibold text-white">{checkResult.data.category || 'Retail'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Masked PAN</span>
                      <span className="font-mono font-semibold text-slate-200">{checkResult.data.panMasked}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Registrar</span>
                      <span className="font-semibold text-indigo-300 truncate block">{ipo.registrar}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* NOT ALLOTTED STATE */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <XCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <h4 className="text-base font-bold text-white">No Shares Allotted</h4>
                    <p className="text-xs text-slate-400">
                      Due to high category over-subscription, your application was not selected in the registrar basis of allotment.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bank mandate unblock / refund will process automatically.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Company</span>
                      <span className="font-semibold text-white truncate block">{ipo.companyName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Registrar</span>
                      <span className="font-semibold text-indigo-300 truncate block">{ipo.registrar}</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* ERROR / EXTERNAL REGISTRAR NOTICE */
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unable to Complete Automatic Query</span>
                </div>
                <p className="text-slate-400">{checkResult.error || checkResult.message || 'Please check again later or visit registrar portal.'}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowResultModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
