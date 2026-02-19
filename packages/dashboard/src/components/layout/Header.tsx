'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useUIStore } from '@/lib/store';

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
  const { theme, toggle } = useTheme();
  const { setSidebarOpen } = useUIStore();
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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gh-border bg-gh-subtle px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1 text-gh-fg-muted hover:text-gh-fg cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gh-fg-subtle" />}
              <span className={i === crumbs.length - 1 ? 'text-gh-fg font-medium' : 'text-gh-fg-muted'}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gh-fg-muted hover:text-gh-fg hover:bg-gh-btn transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-gh-fg-muted hover:bg-gh-btn transition-colors cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gh-btn border-2 border-gh-border text-xs font-medium text-gh-fg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:inline">{user?.name || 'User'}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-gh-border bg-gh-subtle py-1 shadow-xl z-50">
              <div className="px-3 py-2 border-b border-gh-border">
                <p className="text-sm font-medium text-gh-fg">{user?.name}</p>
                <p className="text-xs text-gh-fg-muted">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gh-fg-muted hover:bg-gh-btn transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
