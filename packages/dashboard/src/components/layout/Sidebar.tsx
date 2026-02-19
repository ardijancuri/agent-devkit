'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PenTool, Play, Activity, Settings, Bot, PanelLeftClose, PanelLeft, X } from 'lucide-react';
import { useUIStore } from '@/lib/store';

const icons = { LayoutDashboard, PenTool, Play, Activity, Settings };

const navItems = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' as const },
  { label: 'Studio', href: '/studio', icon: 'PenTool' as const },
  { label: 'Runs', href: '/runs', icon: 'Play' as const },
  { label: 'Monitor', href: '/monitor', icon: 'Activity' as const },
  { label: 'Settings', href: '/settings', icon: 'Settings' as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col border-r border-gh-border bg-gh-subtle transition-transform duration-200
          lg:static lg:z-auto lg:translate-x-0
          ${sidebarOpen ? 'w-56 translate-x-0' : 'w-56 -translate-x-full lg:w-16 lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-gh-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gh-accent-emphasis">
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            {(sidebarOpen) && <span className="text-sm font-bold text-gh-fg tracking-tight lg:hidden xl:inline">AgentDevKit</span>}
          </div>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gh-fg-muted hover:text-gh-fg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = icons[item.icon];
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gh-btn text-gh-fg'
                    : 'text-gh-fg-muted hover:bg-gh-btn hover:text-gh-fg'
                } ${!sidebarOpen ? 'lg:justify-center' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className={!sidebarOpen ? 'lg:hidden' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:block border-t border-gh-border p-2">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg p-2 text-gh-fg-muted hover:bg-gh-btn hover:text-gh-fg transition-colors cursor-pointer"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4.5 w-4.5" /> : <PanelLeft className="h-4.5 w-4.5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
