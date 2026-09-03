import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

interface RegistrarBadgeProps {
  registrar: string;
}

export const RegistrarBadge: React.FC<RegistrarBadgeProps> = ({ registrar }) => {
  const isBigshare = registrar.toLowerCase().includes('bigshare');

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <span className="font-medium text-slate-300">{registrar}</span>
      {isBigshare ? (
        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-md">
          <Zap className="w-3 h-3 text-emerald-400" /> Auto-check
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded-md">
          <ShieldCheck className="w-3 h-3 text-blue-400" /> Pre-filled captcha
        </span>
      )}
    </div>
  );
};
