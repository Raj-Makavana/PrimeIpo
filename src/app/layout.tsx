import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthProvider } from '@/lib/auth-context';
import { MarketDisclaimerModal } from '@/components/MarketDisclaimerModal';
import { ShieldCheck, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PrimeIpo — Indian IPO Tracker (Mainboard & SME)',
  description:
    'Track every Indian IPO (Mainboard & SME) with live GMP premium, real-time subscription figures, and fast multi-PAN allotment checker across Bigshare, KFintech, Link Intime, Cameo & Skyline.',
  keywords: 'Indian IPO, Mainboard IPO, SME IPO, GMP, Allotment Checker, Bigshare, KFintech, Link Intime, Subscription',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-600 selection:text-white pb-16 md:pb-0">
        <AuthProvider>
          <Navbar />
          <MarketDisclaimerModal />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>

          {/* Footer with Compliance Disclaimer */}
          <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span>PrimeIpo — Complete Indian IPO Engine</span>
                </div>
                <p className="text-xs text-slate-400">
                  Tracking Mainboard & SME IPOs across NSE & BSE India
                </p>
              </div>

              {/* Compliance Disclaimer per Section 8 */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-300">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Regulatory Disclaimer & Information Notice</span>
                </div>
                <p className="leading-relaxed">
                  Data presented on PrimeIpo is aggregated from public stock exchange feeds (NSE/BSE), registrar portals, and financial news reports for informational purposes only. It does not constitute financial or investment advice. Always verify final allotment status on official registrar portals (Bigshare, KFintech, Link Intime, Cameo, Skyline) or BSE/NSE websites.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 pt-2">
                <span>© {new Date().getFullYear()} PrimeIpo. Built for everyday retail IPO investors in India.</span>
                <Link
                  href="/terms"
                  className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  Terms &amp; Conditions (Educational Disclaimer)
                </Link>
              </div>
            </div>
          </footer>

          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
