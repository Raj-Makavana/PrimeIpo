import React from 'react';
import { Users } from 'lucide-react';

interface SubscriptionBadgeProps {
  total: number;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ total }) => {
  if (!total || total === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold">
        <Users className="w-3.5 h-3.5" />
        <span>Sub: --</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-semibold">
      <Users className="w-3.5 h-3.5 text-indigo-400" />
      <span>{total}× Subscribed</span>
    </div>
  );
};
