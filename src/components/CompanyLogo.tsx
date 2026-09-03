'use client';

import React, { useState } from 'react';

// Curated official CDN logo map for known companies
export const KNOWN_COMPANY_LOGOS: Record<string, string> = {
  momsbelief: 'https://assets-netstorage.groww.in/stocks-ipo/logos/RaysofbeliefLtd_43264887_96457.png',
  perniaspop: 'https://assets-netstorage.groww.in/stocks-ipo/logos/PurpleStyleLabsLtd_95439274_95898.png',
  deepa: 'https://assets-netstorage.groww.in/stocks-ipo/logos/DEEPAJEWELLERSLIMITED_78637726_96370.png',
  ashutosh: 'https://assets-netstorage.groww.in/stocks-ipo/logos/AshutoshFibreLtd_37267091_81734.png',
  phychem: 'https://assets-netstorage.groww.in/stocks-ipo/logos/PHYCHEMTECHNOLOGIESLIMITED_31377666_95986.png',
  shantiinor: 'https://assets-netstorage.groww.in/stocks-ipo/logos/ShantiInorganicsLtd_22713610_95929.png',
  farmpeace: 'https://assets-netstorage.groww.in/stocks-ipo/logos/FarmPeaceLtd_31021830_95916.png',
  flyhi: 'https://assets-netstorage.groww.in/stocks-ipo/logos/Fly-HiMaritimeTravelsLtd_17311186_96389.png',
  qualiance: 'https://assets-netstorage.groww.in/stocks-ipo/logos/QualianceInternationalLtd_91967050_96774.png',
  nse: 'https://assets-netstorage.groww.in/stock-assets/logos2/nse.png',
  jio: 'https://assets-netstorage.groww.in/stock-assets/logos2/JIO.png',
  zepto: 'https://assets-netstorage.groww.in/stock-assets/logos2/Zepto.png',
  phonepe: 'https://assets-netstorage.groww.in/stock-assets/logos2/Razorpay_logo.png',
};

// Deterministic color palette for initial logos
const GRADIENT_PALETTES = [
  'from-indigo-600 via-indigo-700 to-indigo-900 text-indigo-100 border-indigo-500/40',
  'from-violet-600 via-purple-700 to-purple-900 text-violet-100 border-violet-500/40',
  'from-emerald-600 via-teal-700 to-teal-900 text-emerald-100 border-emerald-500/40',
  'from-blue-600 via-cyan-700 to-blue-900 text-blue-100 border-blue-500/40',
  'from-amber-600 via-orange-700 to-amber-900 text-amber-100 border-amber-500/40',
  'from-rose-600 via-pink-700 to-rose-900 text-rose-100 border-rose-500/40',
  'from-cyan-600 via-teal-700 to-cyan-900 text-cyan-100 border-cyan-500/40',
];

function getPalette(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash + str.charCodeAt(i) * (i + 1)) % GRADIENT_PALETTES.length;
  }
  return GRADIENT_PALETTES[hash];
}

interface CompanyLogoProps {
  symbol: string;
  name?: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  symbol,
  name,
  logoUrl,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const cleanSym = (symbol || 'IP').toUpperCase().trim();
  const cleanId = cleanSym.toLowerCase();
  const directLogo = KNOWN_COMPANY_LOGOS[cleanId] || logoUrl;

  const sizeClasses = {
    sm: 'w-8 h-8 text-[11px] rounded-xl',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-2xl',
    xl: 'w-14 h-14 text-base rounded-2xl',
  }[size];

  const palette = getPalette(cleanSym);
  const initials = cleanSym.substring(0, 2);

  if (directLogo && !imgError) {
    return (
      <div
        className={`${sizeClasses} bg-white p-1 flex items-center justify-center border border-slate-700/80 shadow-md shrink-0 overflow-hidden ${className}`}
      >
        <img
          src={directLogo}
          alt={name || cleanSym}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-br ${palette} border font-black flex items-center justify-center tracking-wider shadow-inner shrink-0 ${className}`}
      title={name || cleanSym}
    >
      {initials}
    </div>
  );
};
