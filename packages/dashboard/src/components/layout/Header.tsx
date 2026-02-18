'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';

function getBreadcrumbs(pathname: string): string[] {
  if (pathname === '/') return ['Dashboard'];
  return pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const crumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-600" />}
            <span className={i === crumbs.length - 1 ? 'text-white font-medium' : 'text-gray-500'}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-xs font-medium text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:inline">{user?.name || 'User'}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl z-50">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
