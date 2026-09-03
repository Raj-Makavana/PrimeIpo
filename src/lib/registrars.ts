/**
 * Official Indian IPO Registrar Registry & Allotment Helpers
 * Contains direct allotment checking portals, backup servers, and 15-day lifecycle calculations.
 */

export interface RegistrarPortalInfo {
  id: string;
  name: string;
  portalUrl: string;
  server2Url?: string;
  bseUrl: string;
  phone?: string;
  email?: string;
  instructions: string[];
}

export const REGISTRAR_DIRECTORY: Record<string, RegistrarPortalInfo> = {
  bigshare: {
    id: 'bigshare',
    name: 'Bigshare Services Pvt Ltd',
    portalUrl: 'https://www.bigshareonline.com/ipo_Allotment.html',
    server2Url: 'https://ipo.bigshareonline.com/ipo_status.html',
    bseUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    phone: '+91-22-62638200',
    email: 'ipo@bigshareonline.com',
    instructions: [
      'Select Company Name from the dropdown',
      'Select Selection Type as "PAN Number"',
      'Paste or enter your 10-digit PAN',
      'Enter the captcha code and click "Search"',
    ],
  },
  kfintech: {
    id: 'kfintech',
    name: 'KFin Technologies Limited',
    portalUrl: 'https://kosmic.kfintech.com/ipostatus/',
    server2Url: 'https://ris.kfintech.com/ipostatus/',
    bseUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    phone: '1800 309 4001',
    email: 'einward.ris@kfintech.com',
    instructions: [
      'Select IPO name from dropdown',
      'Select Query by "PAN"',
      'Enter your 10-digit PAN number',
      'Solve the 4-digit captcha and click "Submit"',
    ],
  },
  linkintime: {
    id: 'linkintime',
    name: 'Link Intime India Pvt Ltd',
    portalUrl: 'https://linkintime.co.in/initial_offer/public-issues.html',
    server2Url: 'https://linkintime.co.in/IPO/public-issues.html',
    bseUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    phone: '+91-22-49186200',
    email: 'ipo.helpdesk@linkintime.co.in',
    instructions: [
      'Select Company Name from dropdown',
      'Select "PAN" option',
      'Enter your PAN number',
      'Click "Submit" to view official allotment and refund status',
    ],
  },
  skyline: {
    id: 'skyline',
    name: 'Skyline Financial Services Pvt Ltd',
    portalUrl: 'https://www.skylinefta.com/ipo_status.php',
    bseUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    phone: '+91-11-40450193',
    email: 'ipo@skylinefta.com',
    instructions: [
      'Select the IPO from company list',
      'Enter your PAN number',
      'Click "Search" to view status',
    ],
  },
  cameo: {
    id: 'cameo',
    name: 'Cameo Corporate Services Ltd',
    portalUrl: 'https://ipo.cameoindia.com/',
    bseUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    phone: '+91-44-28460390',
    email: 'cameo@cameoindia.com',
    instructions: [
      'Select Company Name',
      'Select "PAN"',
      'Enter PAN and submit',
    ],
  },
  purva: {
    id: 'purva',
    name: 'Purva Sharegistry (India) Pvt Ltd',
    portalUrl: 'https://www.purvashare.com/queries/',
    bseUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    phone: '+91-22-23018261',
    email: 'support@purvashare.com',
    instructions: [
      'Select Company Name',
      'Enter PAN number',
      'Click Search',
    ],
  },
  maashitla: {
    id: 'maashitla',
    name: 'Maashitla Securities Pvt Ltd',
    portalUrl: 'https://maashitla.com/allotment-status/',
    bseUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    phone: '+91-11-45121795',
    email: 'ipo@maashitla.com',
    instructions: [
      'Select Company Name from dropdown',
      'Select PAN',
      'Enter your PAN and submit',
    ],
  },
};

/**
 * Resolves registrar portal information from registrar string name
 */
export function getRegistrarPortalInfo(registrarName: string): RegistrarPortalInfo {
  const regLower = (registrarName || '').toLowerCase();

  if (regLower.includes('kfin')) return REGISTRAR_DIRECTORY.kfintech;
  if (regLower.includes('link') || regLower.includes('intime') || regLower.includes('mufg')) return REGISTRAR_DIRECTORY.linkintime;
  if (regLower.includes('cameo')) return REGISTRAR_DIRECTORY.cameo;
  if (regLower.includes('skyline')) return REGISTRAR_DIRECTORY.skyline;
  if (regLower.includes('purva')) return REGISTRAR_DIRECTORY.purva;
  if (regLower.includes('maashitla')) return REGISTRAR_DIRECTORY.maashitla;
  if (regLower.includes('bigshare')) return REGISTRAR_DIRECTORY.bigshare;

  // Default fallback
  return {
    id: 'bse',
    name: registrarName || 'Official Registrar',
    portalUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    bseUrl: 'https://www.bseindia.com/investors/appli_check.aspx',
    instructions: [
      'Select Issue Type: Equity',
      'Select Issue Name from dropdown',
      'Enter Application No or PAN No',
      'Solve captcha and click Search',
    ],
  };
}

/**
 * Calculates 15-day Allotment Lifecycle:
 * 1. Only declared IPOs (allotmentDate <= today) are eligible.
 * 2. After 15 days from allotmentDate, the IPO is automatically delisted.
 */
export function getAllotmentLifecycle(allotmentDateStr: string, now: Date = new Date()) {
  if (!allotmentDateStr) {
    return {
      isDeclared: false,
      isDelisted: false,
      daysSinceDeclaration: -1,
      daysRemaining: 0,
      status: 'pending' as const,
    };
  }

  // Parse allotment date in midnight UTC/local
  const allotDate = new Date(allotmentDateStr);
  if (isNaN(allotDate.getTime())) {
    return {
      isDeclared: false,
      isDelisted: false,
      daysSinceDeclaration: -1,
      daysRemaining: 0,
      status: 'pending' as const,
    };
  }

  // Reset time to midnight for clean day comparisons
  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d2 = new Date(allotDate.getFullYear(), allotDate.getMonth(), allotDate.getDate()).getTime();

  const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));

  const isDeclared = diffDays >= 0;
  const isDelisted = diffDays > 15;
  const daysRemaining = Math.max(0, 15 - diffDays);

  let status: 'pending' | 'active' | 'delisted' = 'pending';
  if (isDeclared && !isDelisted) {
    status = 'active';
  } else if (isDelisted) {
    status = 'delisted';
  }

  return {
    isDeclared,
    isDelisted,
    daysSinceDeclaration: diffDays,
    daysRemaining,
    status,
  };
}
