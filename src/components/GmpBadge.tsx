import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GmpBadgeProps {
  gmp: number;
  gmpPct: number;
}

export const GmpBadge: React.FC<GmpBadgeProps> = ({ gmp, gmpPct }) => {
  const isPositive = gmp > 0;
  const isNegative = gmp < 0;

  let bg = 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30';
  let Icon = TrendingUp;

  if (isNegative) {
    bg = 'bg-rose-950/50 text-rose-400 border-rose-500/30';
    Icon = TrendingDown;
  } else if (gmp === 0) {
    bg = 'bg-slate-900/60 text-slate-400 border-slate-700/40';
    Icon = Minus;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{gmp === 0 ? 'GMP N/A' : `+₹${gmp} (${gmpPct > 0 ? '+' : ''}${gmpPct}%)`}</span>
    </div>
  );
};
