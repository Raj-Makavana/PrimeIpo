'use client';

import React, { useState, useEffect } from 'react';
import { IpoData } from '@/lib/api-fetcher';
import { StatusBadge } from '@/components/StatusBadge';
import { GmpBadge } from '@/components/GmpBadge';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { RegistrarBadge } from '@/components/RegistrarBadge';
import { GitCompare, Plus, X, Building2, Calendar, Award, CheckCircle2 } from 'lucide-react';

export default function ComparePage() {
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ipos');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setIpos(data.data);
          // Default select first two IPOs
          setSelectedIds([data.data[0]?.id, data.data[1]?.id].filter(Boolean));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleIpo = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const selectedIpos = selectedIds.map((id) => ipos.find((i) => i.id === id)).filter(Boolean) as IpoData[];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Compare Indian IPOs Side-by-Side</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Select up to 3 IPOs to compare valuations, GMP returns, subscription demand, and issue schedules.
            </p>
          </div>
        </div>

        {/* Selection chips */}
        <div className="pt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Select IPOs to Compare:</span>
          {ipos.map((ipo) => {
            const isSelected = selectedIds.includes(ipo.id);
            return (
              <button
                key={ipo.id}
                onClick={() => handleToggleIpo(ipo.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{ipo.companyName}</span>
                {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedIpos.length > 0 ? (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-4 text-slate-400 font-bold uppercase tracking-wider w-48">Parameter</th>
                {selectedIpos.map((ipo) => (
                  <th key={ipo.id} className="p-4 text-white font-extrabold text-sm min-w-[220px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>{ipo.companyName}</span>
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1.5 py-0.2 rounded font-bold uppercase">
                          {ipo.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal block">{ipo.sector} Sector</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* Status */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Bidding Status</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4">
                    <StatusBadge status={ipo.status} />
                  </td>
                ))}
              </tr>

              {/* Price Band */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Price Band</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4 font-bold text-white text-sm">
                    ₹{ipo.priceBandLow} – ₹{ipo.priceBandHigh}
                  </td>
                ))}
              </tr>

              {/* Lot Size & Min Investment */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Lot Size / Min Investment</td>
                {selectedIpos.map((ipo) => {
                  const minInv = (ipo.priceBandHigh || ipo.priceBandLow) * ipo.lotSize;
                  return (
                    <td key={ipo.id} className="p-4">
                      <span className="text-white font-bold block">{ipo.lotSize} Shares</span>
                      <span className="text-emerald-400 font-semibold text-[11px]">
                        ₹{minInv.toLocaleString('en-IN')}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Issue Size */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Total Issue Size</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4 font-bold text-indigo-300 text-sm">
                    ₹{ipo.issueSize} Cr
                  </td>
                ))}
              </tr>

              {/* Live GMP */}
              <tr className="hover:bg-slate-900/40 bg-slate-900/20">
                <td className="p-4 font-semibold text-slate-300">Grey Market Premium (GMP)</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4">
                    <GmpBadge gmp={ipo.gmpCurrent} gmpPct={ipo.gmpPct} />
                  </td>
                ))}
              </tr>

              {/* Subscription Rate */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Total Subscription</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4">
                    <SubscriptionBadge total={ipo.subscriptionTotal} />
                  </td>
                ))}
              </tr>

              {/* Subscription Breakdown */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Retail / QIB / NII Demand</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4 text-slate-300 space-y-0.5">
                    <div>Retail: <strong className="text-white">{ipo.subscriptionRetail}×</strong></div>
                    <div>QIB: <strong className="text-white">{ipo.subscriptionQib}×</strong></div>
                    <div>NII: <strong className="text-white">{ipo.subscriptionNii}×</strong></div>
                  </td>
                ))}
              </tr>

              {/* Issue Dates */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Bidding Dates</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4 text-slate-300">
                    <div>Open: <strong className="text-white">{ipo.openDate}</strong></div>
                    <div>Close: <strong className="text-white">{ipo.closeDate}</strong></div>
                  </td>
                ))}
              </tr>

              {/* Allotment & Listing Dates */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Allotment & Listing</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4 text-slate-300">
                    <div>Allotment: <strong className="text-emerald-400">{ipo.allotmentDate}</strong></div>
                    <div>Listing: <strong className="text-purple-400">{ipo.listingDate}</strong></div>
                  </td>
                ))}
              </tr>

              {/* Registrar */}
              <tr className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300">Official Registrar</td>
                {selectedIpos.map((ipo) => (
                  <td key={ipo.id} className="p-4">
                    <RegistrarBadge registrar={ipo.registrar} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
          Please select at least one IPO above to view comparison metrics.
        </div>
      )}
    </div>
  );
}
