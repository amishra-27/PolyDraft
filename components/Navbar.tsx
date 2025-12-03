'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Home, Users, Newspaper, User } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Leagues', path: '/leagues', icon: Users },
    { name: 'News', path: '/leaderboard', icon: Newspaper },
    { name: 'Analytics', path: '/rewards', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 px-4 py-3 z-50 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-1 transition-colors min-w-0 flex-1 ${
              isActive(item.path) ? 'text-primary' : 'text-text-muted hover:text-white'
            }`}
          >
            <item.icon size={22} />
            <span className="text-[9px] font-medium uppercase tracking-wider truncate w-full text-center">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

