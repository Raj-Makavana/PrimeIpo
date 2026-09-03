'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IpoData } from '@/lib/api-fetcher';
import { CompanyLogo } from './CompanyLogo';
import { Search, X, Flame, CheckSquare, LayoutGrid, Calculator, Calendar, GitCompare, ChevronRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ipos')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setIpos(data.data || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredIpos = ipos.filter(
    (i) =>
      i.companyName.toLowerCase().includes(query.toLowerCase()) ||
      i.symbol.toLowerCase().includes(query.toLowerCase()) ||
      i.sector.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const navigationItems = [
    { name: 'Live Bidding IPOs', href: '/', icon: Flame, desc: 'View current active IPOs' },
    { name: 'Multi-PAN Allotment Checker', href: '/allotment', icon: CheckSquare, desc: '1-Click family allotment query' },
    { name: 'Gain & Profit Calculator', href: '/calculator', icon: Calculator, desc: 'Estimate listing return & ROI' },
    { name: 'Compare IPOs Tool', href: '/compare', icon: GitCompare, desc: 'Side-by-side valuation comparison' },
    { name: 'IPO Event Calendar', href: '/calendar', icon: Calendar, desc: 'Timeline of openings & listings' },
    { name: 'Sector Explorer', href: '/sectors', icon: LayoutGrid, desc: 'Browse by industry sector' },
  ].filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  const handleNavigate = (url: string) => {
    router.push(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-xl border border-slate-700 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/90 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search IPOs, calculators, allotment, sectors... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* IPO Matches */}
          {filteredIpos.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
                IPOs & Stocks
              </span>
              {filteredIpos.map((ipo) => (
                <button
                  key={ipo.id}
                  onClick={() => handleNavigate(`/ipo/${ipo.id}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <CompanyLogo
                      symbol={ipo.symbol}
                      name={ipo.companyName}
                      logoUrl={ipo.logoUrl}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-300">{ipo.companyName}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded uppercase font-semibold">
                          {ipo.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{ipo.sector} • ₹{ipo.priceBandHigh || ipo.priceBandLow}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">+₹{ipo.gmpCurrent} ({ipo.gmpPct}%)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tools & Navigation */}
          {navigationItems.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
                Quick Tools & Pages
              </span>
              {navigationItems.map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.href}
                    onClick={() => handleNavigate(nav.href)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">{nav.name}</span>
                        <span className="text-[10px] text-slate-400">{nav.desc}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                );
              })}
            </div>
          )}

          {filteredIpos.length === 0 && navigationItems.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No matching IPOs or tools found for &quot;{query}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
