'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, CheckSquare, LayoutGrid, Bell, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs = [
    { name: 'Home', href: '/', icon: Flame },
    { name: 'Allotment', href: '/allotment', icon: CheckSquare },
    { name: 'Sectors', href: '/sectors', icon: LayoutGrid },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl px-2 py-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          // Profile tab: show user avatar if logged in
          if (tab.name === 'Profile' && user?.photoURL) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className={`w-5 h-5 rounded-full ring-2 ${isActive ? 'ring-indigo-400' : 'ring-slate-600'}`}
                />
                <span className="text-[10px]">{tab.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400 scale-110' : 'text-slate-400'}`} />
              <span className="text-[10px]">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
