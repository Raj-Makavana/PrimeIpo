'use client';

import React, { useState, useEffect } from 'react';
import { IpoData } from '@/lib/api-fetcher';
import { StatusBadge } from '@/components/StatusBadge';
import { GmpBadge } from '@/components/GmpBadge';
import { Calendar as CalendarIcon, Clock, CheckCircle2, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CalendarPage() {
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'opens' | 'allotments' | 'listings'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ipos');
        const data = await res.json();
        if (data.success) {
          setIpos(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Construct unified timeline events
  interface TimelineEvent {
    id: string;
    companyName: string;
    symbol: string;
    type: string;
    eventType: 'open' | 'close' | 'allotment' | 'listing';
    date: string;
    gmpCurrent: number;
    gmpPct: number;
    registrar: string;
  }

  const events: TimelineEvent[] = [];

  ipos.forEach((ipo) => {
    if (ipo.openDate) {
      events.push({
        id: ipo.id,
        companyName: ipo.companyName,
        symbol: ipo.symbol,
        type: ipo.type,
        eventType: 'open',
        date: ipo.openDate,
        gmpCurrent: ipo.gmpCurrent,
        gmpPct: ipo.gmpPct,
        registrar: ipo.registrar,
      });
    }
    if (ipo.closeDate) {
      events.push({
        id: ipo.id,
        companyName: ipo.companyName,
        symbol: ipo.symbol,
        type: ipo.type,
        eventType: 'close',
        date: ipo.closeDate,
        gmpCurrent: ipo.gmpCurrent,
        gmpPct: ipo.gmpPct,
        registrar: ipo.registrar,
      });
    }
    if (ipo.allotmentDate) {
      events.push({
        id: ipo.id,
        companyName: ipo.companyName,
        symbol: ipo.symbol,
        type: ipo.type,
        eventType: 'allotment',
        date: ipo.allotmentDate,
        gmpCurrent: ipo.gmpCurrent,
        gmpPct: ipo.gmpPct,
        registrar: ipo.registrar,
      });
    }
    if (ipo.listingDate) {
      events.push({
        id: ipo.id,
        companyName: ipo.companyName,
        symbol: ipo.symbol,
        type: ipo.type,
        eventType: 'listing',
        date: ipo.listingDate,
        gmpCurrent: ipo.gmpCurrent,
        gmpPct: ipo.gmpPct,
        registrar: ipo.registrar,
      });
    }
  });

  // Sort events chronologically
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'opens') return ev.eventType === 'open' || ev.eventType === 'close';
    if (filterType === 'allotments') return ev.eventType === 'allotment';
    if (filterType === 'listings') return ev.eventType === 'listing';
    return true;
  });

  const getEventBadge = (type: TimelineEvent['eventType']) => {
    switch (type) {
      case 'open':
        return { label: 'Bidding Opens', bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'close':
        return { label: 'Bidding Closes', bg: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'allotment':
        return { label: 'Allotment Declaration', bg: 'bg-blue-950 text-blue-300 border-blue-800' };
      case 'listing':
        return { label: 'Stock Exchange Listing', bg: 'bg-purple-950 text-purple-300 border-purple-800' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">IPO Schedule & Event Calendar</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Never miss bidding deadlines, allotment finalizations, or stock exchange listing dates.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="pt-3 flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'opens', label: 'Bidding Open / Close' },
            { key: 'allotments', label: 'Allotment Days' },
            { key: 'listings', label: 'Listing Days' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterType(key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-xl">
        <div className="space-y-3">
          {filteredEvents.map((ev, index) => {
            const badge = getEventBadge(ev.eventType);
            return (
              <div
                key={`${ev.id}-${ev.eventType}-${index}`}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Date Column */}
                  <div className="w-24 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center shrink-0">
                    <span className="text-xs font-black text-white block">{ev.date}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Date</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ev.companyName}</span>
                      <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1.5 rounded font-bold uppercase">
                        {ev.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400">• Registrar: {ev.registrar}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <GmpBadge gmp={ev.gmpCurrent} gmpPct={ev.gmpPct} />
                  <Link
                    href={`/ipo/${ev.id}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
