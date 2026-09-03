'use client';

import React, { useState, useEffect } from 'react';
import { IpoData } from '@/lib/api-fetcher';
import { IpoCard } from '@/components/IpoCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { IpoOverviewTable } from '@/components/IpoOverviewTable';
import { Search, Flame, Calendar, CheckCircle2, TrendingUp, Filter, RefreshCw, Zap, Table, LayoutGrid } from 'lucide-react';

export default function HomePage() {
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mainboard' | 'sme'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const fetchIpos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ipos');
      const data = await res.json();
      if (data.success) {
        setIpos(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load IPOs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpos();
  }, []);

  // Filter logic
  const filtered = ipos.filter((ipo) => {
    const matchesSearch =
      ipo.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ipo.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ipo.sector.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || ipo.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const openIpos = filtered.filter((i) => i.status === 'open');
  const listedIpos = filtered.filter((i) => i.status === 'listed');
  const upcomingIpos = filtered.filter((i) => i.status === 'upcoming');
  const closedIpos = filtered.filter((i) => i.status === 'closed');

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Section */}
      <section className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/20 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>EVERY Indian IPO in One Place</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Never Miss An Allotment Or High-GMP IPO Again.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Track live GMP %, real-time subscription figures, and check allotment across multiple saved family PANs in one click.
          </p>

          {/* Search + Filter Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by company, symbol or sector (e.g. Zepto, KFin, Tech)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            {/* Mainboard vs SME Tabs */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-700/80 shrink-0">
              {(['all', 'mainboard', 'sme'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTypeFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    typeFilter === tab
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-700/80 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Comprehensive Table Format"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Overview Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Category Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Active IPOs Today</span>
            <span className="text-xl font-extrabold text-emerald-400 block">{openIpos.length} Live</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Recently Listed</span>
            <span className="text-xl font-extrabold text-purple-400 block">{listedIpos.length} Stocks</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Upcoming Issues</span>
            <span className="text-xl font-extrabold text-blue-400 block">{upcomingIpos.length} Soon</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">Allotment Speed</span>
            <span className="text-xl font-extrabold text-indigo-400 block">Instant Multi-PAN</span>
          </div>
        </div>
      </section>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        /* ── TABLE OVERVIEW SECTION ──────────────────────── */
        <section className="space-y-6">
          <IpoOverviewTable ipos={ipos} />
        </section>
      ) : (
        /* ── CARDS GRID VIEW ─────────────────────────────── */
        <div className="space-y-12">
          {/* Section 1: Open Now */}
          {openIpos.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Open For Bidding Now</h2>
                  <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    {openIpos.length} ACTIVE
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {openIpos.map((ipo) => (
                  <IpoCard key={ipo.id} ipo={ipo} />
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Recently Listed */}
          {listedIpos.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Recently Listed</h2>
                  <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-semibold">
                    {listedIpos.length} LISTED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {listedIpos.map((ipo) => (
                  <IpoCard key={ipo.id} ipo={ipo} />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Upcoming IPOs */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">Upcoming IPOs</h2>
                <span className="text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-semibold">
                  {upcomingIpos.length} SOON
                </span>
              </div>
            </div>

            {upcomingIpos.length === 0 ? (
              <p className="text-slate-500 text-sm">No upcoming IPOs found for selected filter.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingIpos.map((ipo) => (
                  <IpoCard key={ipo.id} ipo={ipo} />
                ))}
              </div>
            )}
          </section>

          {/* Section 4: Recently Closed (Awaiting Allotment) */}
          {closedIpos.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Closed — Awaiting Allotment</h2>
                  <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                    {closedIpos.length} CLOSED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {closedIpos.map((ipo) => (
                  <IpoCard key={ipo.id} ipo={ipo} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
