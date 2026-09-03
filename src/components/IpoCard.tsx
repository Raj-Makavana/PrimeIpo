import React from 'react';
import Link from 'next/link';
import { IpoData } from '@/lib/api-fetcher';
import { StatusBadge } from './StatusBadge';
import { GmpBadge } from './GmpBadge';
import { SubscriptionBadge } from './SubscriptionBadge';
import { Calendar, Building2, Layers, Sparkles } from 'lucide-react';

/** Converts YYYY-MM-DD → DD/MM/YYYY. Falls back gracefully. */
export function formatDate(raw: string): string {
  if (!raw) return '—';
  const parts = raw.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return raw;
}

interface IpoCardProps {
  ipo: IpoData;
}

export const IpoCard: React.FC<IpoCardProps> = ({ ipo }) => {
  const priceDisplay =
    ipo.priceBandHigh > 0
      ? `₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh}`
      : ipo.priceBandLow > 0
      ? `₹${ipo.priceBandLow}`
      : 'TBA';

  const isSme = ipo.type === 'sme';

  return (
    <Link href={`/ipo/${ipo.id}`}>
      <div className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between h-full group relative overflow-hidden">
        {/* Subtle top accent gradient line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            ipo.status === 'open'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
              : ipo.status === 'upcoming'
              ? 'bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500'
              : ipo.status === 'listed'
              ? 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-500'
              : 'bg-slate-700'
          }`}
        />

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-700/60 p-2 flex items-center justify-center font-bold text-sm text-indigo-400 shrink-0 shadow-inner">
                {ipo.symbol.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors text-base line-clamp-1">
                    {ipo.companyName}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    {ipo.sector}
                  </span>
                  <span>•</span>
                  <span
                    className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                      isSme ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50' : 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/50'
                    }`}
                  >
                    {isSme ? 'SME' : 'Mainboard'}
                  </span>
                </div>
              </div>
            </div>
            <StatusBadge status={ipo.status} size="sm" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 py-3 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                {ipo.status === 'listed' ? 'Issue Price' : 'Price Band'}
              </span>
              <span className="text-sm font-semibold text-slate-100">{priceDisplay}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                {ipo.status === 'listed' && ipo.priceBandHigh > 0 ? 'Listing Price' : 'Lot Size'}
              </span>
              <span className={`text-sm font-semibold ${ipo.status === 'listed' ? 'text-purple-300' : 'text-slate-100'}`}>
                {ipo.status === 'listed' && ipo.priceBandHigh > 0
                  ? `₹${ipo.priceBandHigh + (ipo.gmpCurrent || 0)}`
                  : `${ipo.lotSize} Shares`}
              </span>
            </div>
          </div>

          {/* Badges strip */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <GmpBadge gmp={ipo.gmpCurrent} gmpPct={ipo.gmpPct} />
            <SubscriptionBadge total={ipo.subscriptionTotal} />
          </div>
        </div>

        {/* Footer Dates */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {formatDate(ipo.openDate)} – {formatDate(ipo.closeDate)}
            </span>
          </div>
          <span className="text-slate-500 text-[11px] font-medium">{ipo.registrar}</span>
        </div>
      </div>
    </Link>
  );
};
