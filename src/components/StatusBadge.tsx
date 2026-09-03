import React from 'react';

interface StatusBadgeProps {
  status: 'open' | 'upcoming' | 'closed' | 'listed' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toLowerCase();

  let colors = 'bg-gray-800/80 text-gray-300 border-gray-700';
  let dotColor = 'bg-gray-400';
  let label = 'Closed';

  if (s === 'open' || s === 'live') {
    colors = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 glow-green';
    dotColor = 'bg-emerald-400 animate-pulse';
    label = 'OPEN NOW';
  } else if (s === 'upcoming') {
    colors = 'bg-blue-950/80 text-blue-300 border-blue-500/40';
    dotColor = 'bg-blue-400';
    label = 'UPCOMING';
  } else if (s === 'listed') {
    colors = 'bg-purple-950/80 text-purple-300 border-purple-500/40 glow-purple';
    dotColor = 'bg-purple-400';
    label = 'LISTED';
  } else if (s === 'closed') {
    colors = 'bg-slate-900/80 text-slate-400 border-slate-700/50';
    dotColor = 'bg-slate-500';
    label = 'CLOSED';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold tracking-wider',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wider',
    lg: 'text-sm px-3 py-1.5 font-bold tracking-wider',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colors} ${sizeClasses[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
