'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PenTool, Play, Activity, Settings, Bot, PanelLeftClose, PanelLeft } from 'lucide-react';
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
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`flex flex-col border-r border-gray-800 bg-gray-900 transition-all duration-200 ${
        sidebarOpen ? 'w-56' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-800 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <Bot className="h-4.5 w-4.5 text-white" />
        </div>
        {sidebarOpen && <span className="text-sm font-bold text-white tracking-tight">AgentDevKit</span>}
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600/10 text-indigo-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {sidebarOpen && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose className="h-4.5 w-4.5" /> : <PanelLeft className="h-4.5 w-4.5" />}
        </button>
      </div>
    </aside>
  );
}
