'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';
import { IpoAiAnalysis } from '@/lib/ai/langgraph-analyzer';

interface AiAnalysisCardProps {
  ipoId: string;
  initialData?: IpoAiAnalysis;
}

export const AiAnalysisCard: React.FC<AiAnalysisCardProps> = ({ ipoId, initialData }) => {
  const [analysis, setAnalysis] = useState<IpoAiAnalysis | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ai/analyze?id=${ipoId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setAnalysis(data.data);
      } else {
        setError(data.error || 'Failed to load AI analysis');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing LangGraph analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipoId]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-40 bg-slate-800 rounded" />
              <div className="h-3 w-28 bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="h-6 w-24 bg-slate-800 rounded-full" />
        </div>
        <div className="h-16 bg-slate-900/80 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center space-y-3">
        <p className="text-xs text-slate-400">Unable to generate AI analysis at this moment.</p>
        <button
          onClick={fetchAnalysis}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  const isBullish = analysis.verdictTone === 'bullish';
  const isCautious = analysis.verdictTone === 'cautious' || analysis.verdictTone === 'bearish';

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-0.5 shadow-lg shadow-indigo-600/25 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">AI 30-Second Executive Analysis</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-medium flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                LangGraph v0.2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated multi-node financial evaluation & sentiment analysis.
            </p>
          </div>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`px-4 py-2 rounded-2xl border text-xs font-black tracking-wide uppercase flex items-center gap-2 shadow-lg ${
              isBullish
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-emerald-900/20'
                : isCautious
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-rose-900/20'
                : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300 shadow-indigo-900/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full animate-ping shrink-0 bg-current" />
            <span>{analysis.verdict}</span>
          </div>

          <button
            onClick={fetchAnalysis}
            title="Refresh AI Analysis"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm leading-relaxed relative z-10">
        <p>{analysis.summary}</p>
      </div>

      {/* Sentiment & Valuation Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Confidence Score</span>
          <span className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
            <span className="text-indigo-400">{analysis.score}</span>
            <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Valuation Check</span>
          <span
            className={`text-sm font-bold mt-0.5 block ${
              analysis.valuationCheck === 'Attractive'
                ? 'text-emerald-400'
                : analysis.valuationCheck === 'Expensive'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {analysis.valuationCheck}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">GMP Momentum</span>
          <span className="text-sm font-bold text-emerald-400 mt-0.5 block truncate">
            {analysis.sentimentGauge.gmpStrength}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Retail Demand</span>
          <span className="text-sm font-bold text-indigo-300 mt-0.5 block truncate">
            {analysis.sentimentGauge.retailDemand}
          </span>
        </div>
      </div>

      {/* Two Columns: Bull Points vs Risk Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Bull Case */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>Key Catalysts (Bull Case)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {analysis.bullPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bear Case */}
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Key Caveats & Risks</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {analysis.bearPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Retail Action Recommendation Box */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 relative z-10">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Action Takeaway for Retail Bidders
          </span>
          <p className="text-xs text-indigo-200 leading-relaxed">
            {analysis.retailRecommendation}
          </p>
        </div>
      </div>

      {/* Footer: LangGraph execution trace */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Graph execution: evaluateValuation → analyzeSentiment → synthesizeVerdict</span>
        </div>
        <span>Grounded on Chittorgarh & InvestorGain data</span>
      </div>
    </div>
  );
};
