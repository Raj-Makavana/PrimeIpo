'use client';

import React, { useState, useEffect } from 'react';
import { IpoData } from '@/lib/api-fetcher';
import { Calculator, TrendingUp, IndianRupee, Layers, ShieldCheck, Sparkles } from 'lucide-react';

export default function CalculatorPage() {
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [selectedIpoId, setSelectedIpoId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Custom calculation parameters
  const [price, setPrice] = useState<number>(500);
  const [lotSize, setLotSize] = useState<number>(30);
  const [gmp, setGmp] = useState<number>(120);
  const [lotsApplied, setLotsApplied] = useState<number>(1);
  const [investorCategory, setInvestorCategory] = useState<'retail' | 'shni' | 'bhni'>('retail');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ipos');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setIpos(data.data);
          setSelectedIpoId(data.data[0].id);
          const first = data.data[0];
          setPrice(first.priceBandHigh || first.priceBandLow || 500);
          setLotSize(first.lotSize || 30);
          setGmp(first.gmpCurrent || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectIpo = (id: string) => {
    setSelectedIpoId(id);
    const found = ipos.find((i) => i.id === id);
    if (found) {
      setPrice(found.priceBandHigh || found.priceBandLow || 500);
      setLotSize(found.lotSize || 30);
      setGmp(found.gmpCurrent || 0);
      if (investorCategory === 'retail') setLotsApplied(1);
      else if (investorCategory === 'shni') setLotsApplied(Math.ceil(200000 / ((found.priceBandHigh || 500) * found.lotSize)));
      else if (investorCategory === 'bhni') setLotsApplied(Math.ceil(1000000 / ((found.priceBandHigh || 500) * found.lotSize)));
    }
  };

  const handleCategoryChange = (cat: 'retail' | 'shni' | 'bhni') => {
    setInvestorCategory(cat);
    const lotCost = price * lotSize;
    if (cat === 'retail') {
      setLotsApplied(1);
    } else if (cat === 'shni') {
      const needed = Math.ceil(200000 / lotCost);
      setLotsApplied(Math.max(needed, 14));
    } else if (cat === 'bhni') {
      const needed = Math.ceil(1000000 / lotCost);
      setLotsApplied(Math.max(needed, 68));
    }
  };

  // Calculations
  const totalShares = lotSize * lotsApplied;
  const totalInvestment = price * totalShares;
  const expectedListingPrice = price + gmp;
  const estimatedProfit = gmp * totalShares;
  const estimatedTotalValue = totalInvestment + estimatedProfit;
  const returnPercentage = price > 0 ? Number(((gmp / price) * 100).toFixed(2)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">IPO Profit & Listing Gain Calculator</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Estimate your listing gains, investment required, and ROI across Retail, sHNI, and bHNI categories.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <h3 className="text-base font-bold text-white">Select IPO or Custom Parameters</h3>

            {/* Select Live IPO */}
            {ipos.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Load from Live IPO Feed</label>
                <select
                  value={selectedIpoId}
                  onChange={(e) => handleSelectIpo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {ipos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.companyName} (Price: ₹{i.priceBandHigh || i.priceBandLow}, GMP: ₹{i.gmpCurrent})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Investor Category Tabs */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Investor Application Category</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[
                  { key: 'retail', label: 'Retail', sub: 'Up to ₹2L' },
                  { key: 'shni', label: 'sHNI (Small)', sub: '₹2L – ₹10L' },
                  { key: 'bhni', label: 'bHNI (Big)', sub: 'Above ₹10L' },
                ].map(({ key, label, sub }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategoryChange(key as any)}
                    className={`py-2 px-3 rounded-lg text-center transition-all ${
                      investorCategory === key
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{label}</span>
                    <span className="text-[10px] opacity-75 block">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Lot Size inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Issue Price (₹)</label>
                <input
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Lot Size (Shares)</label>
                <input
                  type="number"
                  value={lotSize || ''}
                  onChange={(e) => setLotSize(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* GMP and Number of Lots */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Grey Market Premium (₹ GMP)</label>
                <input
                  type="number"
                  value={gmp || ''}
                  onChange={(e) => setGmp(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 text-sm font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Lots Applied / Allotted</label>
                <input
                  type="number"
                  value={lotsApplied || ''}
                  min={1}
                  onChange={(e) => setLotsApplied(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Result Output */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card rounded-2xl p-6 border border-indigo-500/30 bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-950 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Estimated Profit Summary
              </h3>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black ${
                  returnPercentage >= 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {returnPercentage >= 0 ? `+${returnPercentage}%` : `${returnPercentage}%`} GAIN
              </span>
            </div>

            {/* Profit Hero Value */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-400 font-medium">Estimated Net Listing Profit</span>
              <div className="text-3xl font-black text-emerald-400">
                {estimatedProfit >= 0 ? '+' : ''}₹{estimatedProfit.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400">
                On total investment of ₹{totalInvestment.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Breakdown List */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-300">
                <span>Total Shares Applied:</span>
                <span className="font-bold text-white">{totalShares} Shares ({lotsApplied} Lots)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-300">
                <span>Total Capital Required:</span>
                <span className="font-bold text-white">₹{totalInvestment.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-300">
                <span>Estimated Listing Price:</span>
                <span className="font-bold text-indigo-300">₹{expectedListingPrice} / share</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-300">
                <span>Total Portfolio Value upon Listing:</span>
                <span className="font-bold text-emerald-400">₹{estimatedTotalValue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              Disclaimer: GMP is indicative and fluctuates based on market demand. Actual listing price may vary based on stock exchange opening price.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
