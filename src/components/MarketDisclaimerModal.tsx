'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, ExternalLink, X } from 'lucide-react';

export const MarketDisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged in this browser session
    const acknowledged = localStorage.getItem('primeipo_disclaimer_ack');
    if (!acknowledged) {
      // Small delay to allow initial page render smoothly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('primeipo_disclaimer_ack', 'true');
    } else {
      // Session acknowledgement
      sessionStorage.setItem('primeipo_disclaimer_ack', 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 shadow-2xl overflow-hidden space-y-5">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Notice &amp; Advisory</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Market Data &amp; Accuracy Advisory
              </h2>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="relative z-10 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <p>
            Welcome to <strong>PrimeIPO</strong>. Please review this important advisory regarding market information displayed on this website:
          </p>

          <ul className="space-y-2.5 pt-1 text-xs">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span>
                <strong>Unofficial &amp; Fluctuating Estimates:</strong> Grey Market Premium (GMP) numbers, bidding rates, and subscription multiples are unofficial market estimates that fluctuate frequently during intraday trading and may differ across tracking platforms.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span>
                <strong>Strictly for Educational Purposes:</strong> All details, metrics, AI-generated analysis, and financial visualizations on this website are provided strictly for <strong>educational and informational tracking</strong>, not investment or financial advice.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span>
                <strong>Verify Official Filings:</strong> Always verify authentic issue dates, price bands, financials, and allotment status from official stock exchange filings (NSE/BSE) or certified registrar portals before making any investment decisions.
              </span>
            </li>
          </ul>
        </div>

        {/* Links & Checkbox */}
        <div className="relative z-10 space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Don&apos;t show this advisory again</span>
            </label>

            <Link
              href="/terms"
              target="_blank"
              onClick={handleDismiss}
              className="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-1"
            >
              <span>Terms &amp; Conditions</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Action Button */}
          <button
            onClick={handleDismiss}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Acknowledge &amp; Understand</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
