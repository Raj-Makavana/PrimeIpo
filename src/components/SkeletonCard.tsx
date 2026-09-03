import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-800/60 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-slate-800 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-800/60">
        <div className="space-y-1">
          <div className="h-3 w-16 bg-slate-800/60 rounded" />
          <div className="h-4 w-24 bg-slate-800 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-16 bg-slate-800/60 rounded" />
          <div className="h-4 w-24 bg-slate-800 rounded" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="h-6 w-24 bg-slate-800 rounded-lg" />
        <div className="h-6 w-24 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
};
