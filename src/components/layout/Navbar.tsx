'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Flame,
  LayoutGrid,
  CheckSquare,
  Bell,
  User,
  LogOut,
  Calculator,
  GitCompare,
  Calendar,
  Search,
} from 'lucide-react';
import { AuthModal } from '../AuthModal';
import { QuickSearchModal } from '../QuickSearchModal';
import { useAuth } from '@/lib/auth-context';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: Flame },
    { name: 'Allotment', href: '/allotment', icon: CheckSquare },
    { name: 'Calculator', href: '/calculator', icon: Calculator },
    { name: 'Compare', href: '/compare', icon: GitCompare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Sectors', href: '/sectors', icon: LayoutGrid },
    { name: 'Alerts', href: '/alerts', icon: Bell },
  ];

  const initials = user?.displayName
    ? user.displayName.substring(0, 2).toUpperCase()
    : user?.phoneNumber
    ? 'PH'
    : user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 py-1" title="PrimeIPO - Spot IPOs. Stay Ahead.">
            {/* Left: Logo Icon with CSS glow & glass styling (enlarged & high-res) */}
            <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900/60 via-slate-900/90 to-purple-950/70 p-1 border border-indigo-500/35 shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-500/40 group-hover:border-indigo-400/70 group-hover:scale-105 transition-all duration-300 shrink-0">
              <Image
                src="/logo.png"
                alt="PrimeIPO Logo"
                width={52}
                height={52}
                className="w-full h-full object-cover rounded-xl"
                priority
              />
            </div>

            {/* Right: PrimeIPO Title & Tagline with refined typography */}
            <div className="flex flex-col justify-center select-none">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl sm:text-[22px] font-black tracking-tight text-white">
                  Prime<span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">IPO</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase">
                  India
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-slate-400 group-hover:text-indigo-200/90 transition-colors mt-1 flex items-center gap-1">
                <span>Spot IPOs.</span>
                <span className="text-indigo-400 font-semibold">Stay Ahead.</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Menu: Quick Search + Auth */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search trigger button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/50 transition-all group"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full ring-2 ring-indigo-500/40"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-600 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                      {initials}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white hidden md:block max-w-[90px] truncate">
                    {user.displayName || user.phoneNumber || user.email?.split('@')[0] || 'Account'}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
