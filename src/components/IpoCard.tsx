import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IpoData } from '@/lib/api-fetcher';
import { StatusBadge } from './StatusBadge';
import { GmpBadge } from './GmpBadge';
import { SubscriptionBadge } from './SubscriptionBadge';
import { CompanyLogo } from './CompanyLogo';
import { Calendar, Building2, Layers, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from './AuthModal';

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
  const router = useRouter();
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const priceDisplay =
    ipo.priceBandHigh > 0
      ? `₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh}`
      : ipo.priceBandLow > 0
      ? `₹${ipo.priceBandLow}`
      : 'TBA';

  const isSme = ipo.type === 'sme';

  const handleCardClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setIsAuthOpen(true);
    } else {
      router.push(`/ipo/${ipo.id}`);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="cursor-pointer glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between h-full group relative overflow-hidden transition-all select-none"
      >
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
              <CompanyLogo
                symbol={ipo.symbol}
                name={ipo.companyName}
                logoUrl={ipo.logoUrl}
                size="md"
              />
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
                      isSme
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                        : 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/50'
                    }`}
                  >
                    {ipo.type.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <StatusBadge status={ipo.status} />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Price Band</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{priceDisplay}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Issue Size</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {ipo.issueSize > 0 ? `₹${ipo.issueSize} Cr` : 'TBA'}
              </span>
            </div>
          </div>

          {/* Live Signals (GMP & Subscription) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <GmpBadge gmp={ipo.gmpCurrent} gmpPct={ipo.gmpPct} />
            <SubscriptionBadge total={ipo.subscriptionTotal} />
          </div>
        </div>

        {/* Footer info & Auth hint */}
        <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {ipo.status === 'open'
                ? `Closes ${formatDate(ipo.closeDate)}`
                : ipo.status === 'upcoming'
                ? `Opens ${formatDate(ipo.openDate)}`
                : ipo.status === 'listed'
                ? `Listed on ${formatDate(ipo.listingDate)}`
                : `Closed ${formatDate(ipo.closeDate)}`}
            </span>
          </div>

          {!user ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Unlock Details</span>
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
              View Details →
            </span>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode="signin"
      />
    </>
  );
};
