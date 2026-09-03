'use client';

import React, { useState, useEffect } from 'react';
import { IpoData } from '@/lib/api-fetcher';
import { IpoCard } from '@/components/IpoCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { LayoutGrid, Search, Filter, ArrowUpDown, Building2 } from 'lucide-react';

export default function SectorsPage() {
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'mainboard' | 'sme'>('all');
  const [sortBy, setSortBy] = useState<'gmp' | 'sub' | 'date'>('gmp');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ipos');
        const data = await res.json();
        if (data.success) {
          setIpos(data.data || []);
        }
      } catch (err) {}
      setLoading(false);
    }
    load();
  }, []);

  const sectorsList = Array.from(new Set(ipos.map((i) => i.sector)));

  let filtered = ipos.filter((i) => {
    const matchSearch =
      i.companyName.toLowerCase().includes(search.toLowerCase()) ||
      i.symbol.toLowerCase().includes(search.toLowerCase()) ||
      i.sector.toLowerCase().includes(search.toLowerCase());

    const matchSector = selectedSector === 'all' || i.sector === selectedSector;
    const matchType = selectedType === 'all' || i.type === selectedType;

    return matchSearch && matchSector && matchType;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'gmp') return b.gmpPct - a.gmpPct;
    if (sortBy === 'sub') return b.subscriptionTotal - a.subscriptionTotal;
    return new Date(b.openDate).getTime() - new Date(a.openDate).getTime();
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Sector Explorer & Filters</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Discover and compare Mainboard vs SME IPO performance across industry sectors.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol, company or industry sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e: any) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Types (Mainboard + SME)</option>
              <option value="mainboard">Mainboard Only</option>
              <option value="sme">SME Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="gmp">Sort by GMP % (Highest)</option>
              <option value="sub">Sort by Subscription ×</option>
              <option value="date">Sort by Open Date</option>
            </select>
          </div>
        </div>

        {/* Sector Chips */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSector === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Sectors ({ipos.length})
          </button>
          {sectorsList.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSector === sec
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filtered.length} matching IPOs</span>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-sm">No IPOs found matching the active filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((ipo) => (
                <IpoCard key={ipo.id} ipo={ipo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
