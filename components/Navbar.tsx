'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Home, Users, Newspaper, User } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname?.startsWith(path));

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Leagues', path: '/leagues', icon: Users },
    { name: 'News', path: '/leaderboard', icon: Newspaper },
    { name: 'Analytics', path: '/rewards', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-md mx-auto bg-surface backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-2 shadow-2xl shadow-black/50">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${active
                    ? 'text-white bg-primary/20 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-110 -translate-y-1'
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#06b6d4]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

