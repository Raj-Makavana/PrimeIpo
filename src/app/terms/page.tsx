'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Info,
  BookOpen,
  FileText,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from 'lucide-react';

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8 animate-fade-in">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 shadow-2xl relative overflow-hidden space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
          <Scale className="w-7 h-7" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Terms of Service & Educational Disclaimer
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
            Please read these terms and conditions carefully before creating an account or using PrimeIPO. By accessing our platform, you explicitly agree to all terms outlined below.
          </p>
        </div>
        <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
          Last Updated: September 2026 • Applies to all registered users and visitors
        </div>
      </div>

      {/* Primary Highlight Warning */}
      <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs sm:text-sm space-y-3 leading-relaxed">
        <div className="flex items-center gap-2.5 font-bold text-amber-300 text-base">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Strictly for Educational & Informational Purposes Only</span>
        </div>
        <p>
          All information, IPO listings, Grey Market Premium (GMP) estimates, subscription rates, financial data, and AI-generated insights displayed on <strong>PrimeIPO</strong> are published solely for <strong>educational and informational purposes</strong>. Nothing contained on this website constitutes, or is intended to constitute, investment, financial, legal, or tax advice.
        </p>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
        {/* Section 1: Non-Advisory Notice */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            1. Non-Advisory & Regulatory Status (SEBI Notice)
          </h2>
          <p>
            PrimeIPO and its operators are <strong>NOT registered with the Securities and Exchange Board of India (SEBI)</strong> as an Investment Adviser, Research Analyst, or Portfolio Manager. We do not provide buy, sell, or subscribe recommendations for any Initial Public Offering (IPO) or equity securities.
          </p>
          <p>
            Investments in stock markets and IPOs are subject to market risks, including the potential loss of principal capital. You must consult a qualified, SEBI-registered financial planner before making any investment decisions.
          </p>
        </div>

        {/* Section 2: Grey Market Premium Disclaimer */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            2. Grey Market Premium (GMP) Disclaimers
          </h2>
          <p>
            Grey market trading is an unregulated, unofficial over-the-counter mechanism in India. GMP figures shown on this platform are aggregated from public third-party sources (including Chittorgarh.com and market tracker communities) solely to gauge general retail market sentiment.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>GMP values are highly speculative, volatile, and subject to sudden changes without prior notice.</li>
            <li>A high GMP does not guarantee listing gains, nor does a negative GMP guarantee listing losses.</li>
            <li>PrimeIPO does not participate in, facilitate, or endorse grey market trading or the purchase of IPO applications (Kostak / Subject to Sauda).</li>
          </ul>
        </div>

        {/* Section 3: Data Sources & Accuracy */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            3. Data Sources & Verification
          </h2>
          <p>
            We aggregate market information from publicly accessible platforms, including official stock exchanges (NSE India, BSE India), official registrar portals (Bigshare, KFintech, Link Intime, Cameo, Skyline), and financial aggregators (Groww, ipopremium.com, Chittorgarh.com).
          </p>
          <p>
            While we implement automated ingestion pipelines to ensure data fidelity, errors, transmission delays, or registrar server downtime may occur. Investors are strongly advised to independently verify all figures in the official <strong>Draft Red Herring Prospectus (DRHP)</strong> or <strong>Red Herring Prospectus (RHP)</strong> filed by the issuing company with SEBI and stock exchanges.
          </p>
        </div>

        {/* Section 4: Privacy & Security of PAN Information */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-400" />
            4. Privacy & Saved PAN Protection
          </h2>
          <p>
            PrimeIPO offers a family PAN allotment checker for your convenience. All Permanent Account Numbers (PANs) entered by registered users are encrypted using industry-standard <strong>AES-256 bit encryption</strong> before storage in our secure databases.
          </p>
          <p>
            We never store or log unencrypted plain-text PANs. Allotment checks are routed directly through official registrar query endpoints. We never sell, rent, or distribute your personal information or family PAN records to advertisers or third-party brokers.
          </p>
        </div>

        {/* Section 5: Account Termination & Deletion */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            5. User Rights & Account Deletion
          </h2>
          <p>
            You retain complete ownership of your personal data. At any time, you may permanently delete your PrimeIPO account directly via the <strong>Profile → Danger Zone → Delete Account</strong> option. Upon confirmation, your profile credentials, saved PAN numbers, alert preferences, and OTP history are permanently and irreversibly purged from our databases.
          </p>
        </div>

        {/* Section 6: Limitation of Liability */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            6. Limitation of Liability
          </h2>
          <p>
            Under no circumstances shall PrimeIPO, its developers, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use this service, or for any financial losses incurred from investment decisions made based on data presented on this website.
          </p>
        </div>
      </div>

      {/* Bottom acknowledgment */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-3">
        <p className="text-xs text-slate-400">
          By clicking &quot;Create Account&quot; or continuing to browse PrimeIPO, you confirm that you have read, understood, and consented to these Terms of Service.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
        >
          <span>Return to PrimeIPO</span>
        </Link>
      </div>
    </div>
  );
}
