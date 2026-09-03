export interface IpoData {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  type: 'mainboard' | 'sme';
  openDate: string;
  closeDate: string;
  allotmentDate: string;
  listingDate: string;
  priceBandLow: number;
  priceBandHigh: number;
  lotSize: number;
  issueSize: number; // in Cr
  faceValue: number;
  registrar: string;
  status: 'open' | 'upcoming' | 'closed' | 'listed';
  gmpCurrent: number;
  gmpPct: number;
  gmpHistory: { date: string; gmp: number }[];
  subscriptionQib: number;
  subscriptionNii: number;
  subscriptionRetail: number;
  subscriptionEmployee: number;
  subscriptionTotal: number;
  logoUrl?: string;
  description?: string;
  listingGainPct?: number;
  financials?: { year: string; revenue: number; pat: number; eps: number }[];
  peers?: { name: string; pe: number; roe: string }[];
}

export interface SavedPan {
  id: string;
  label: string;
  maskedPan: string;
  panHash: string;
  createdAt?: string;
}

export interface AllotmentCheckResponse {
  success: boolean;
  source?: 'cache' | 'registrar_auto' | 'prefilled_redirect';
  requiresCaptcha?: boolean;
  redirectUrl?: string;
  companyName?: string;
  panMasked?: string;
  message?: string;
  disclaimer?: string;
  data?: {
    ipoId: string;
    panMasked: string;
    status: 'allotted' | 'not_allotted' | 'pending';
    shares: number;
    category: string;
    checkedAt: string;
  };
  error?: string;
}

export interface UserAlertsData {
  email: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
  gmpSurgeAlerts: boolean;
  allotmentAlerts: boolean;
  newIpoAlerts: boolean;
}

export type RootStackParamList = {
  MainTabs: undefined;
  IpoDetail: { id: string; title: string };
};

export type MainTabParamList = {
  Home: undefined;
  Allotment: undefined;
  Sectors: undefined;
  Alerts: undefined;
  Profile: undefined;
};
