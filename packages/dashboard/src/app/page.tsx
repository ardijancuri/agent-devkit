'use client';

import { useRouter } from 'next/navigation';
import { FolderOpen, Play, DollarSign, Bot, ArrowRight, Plus, Zap } from 'lucide-react';
import type { Run } from '@/lib/types';
import { STATUS_COLORS, STATUS_DOT } from '@/lib/constants';

const mockStats = {
  totalProjects: 12,
  totalRuns: 847,
  totalCost: 142.38,
  activeAgents: 5,
};

const mockRecentRuns: Run[] = [
  { id: '1', projectId: 'p1', status: 'completed', totalTokens: 45200, totalCost: 1.23, duration: 34000, startedAt: '2026-02-17T22:10:00Z', completedAt: '2026-02-17T22:10:34Z' },
  { id: '2', projectId: 'p2', status: 'running', totalTokens: 12800, totalCost: 0.45, duration: null, startedAt: '2026-02-18T03:30:00Z', completedAt: null },
  { id: '3', projectId: 'p1', status: 'failed', totalTokens: 8900, totalCost: 0.31, duration: 12000, startedAt: '2026-02-17T20:05:00Z', completedAt: '2026-02-17T20:05:12Z' },
  { id: '4', projectId: 'p3', status: 'completed', totalTokens: 67300, totalCost: 2.15, duration: 58000, startedAt: '2026-02-17T18:00:00Z', completedAt: '2026-02-17T18:00:58Z' },
  { id: '5', projectId: 'p2', status: 'completed', totalTokens: 23100, totalCost: 0.78, duration: 21000, startedAt: '2026-02-17T15:30:00Z', completedAt: '2026-02-17T15:30:21Z' },
];

const projectNames: Record<string, string> = {
  p1: 'Code Review Pipeline',
  p2: 'Research Swarm',
  p3: 'Content Generator',
};

const stats = [
  { label: 'Total Projects', value: mockStats.totalProjects, icon: FolderOpen, color: 'text-gh-accent' },
  { label: 'Total Runs', value: mockStats.totalRuns.toLocaleString(), icon: Play, color: 'text-emerald-400' },
  { label: 'Total Cost', value: `$${mockStats.totalCost.toFixed(2)}`, icon: DollarSign, color: 'text-amber-400' },
  { label: 'Active Agents', value: mockStats.activeAgents, icon: Bot, color: 'text-gh-accent' },
];

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gh-fg">Dashboard</h1>
          <p className="mt-1 text-sm text-gh-fg-muted">Overview of your agent systems</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-gh-border bg-gh-subtle p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gh-fg-muted">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="mt-2 text-3xl font-semibold text-gh-fg">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Runs */}
          <div className="lg:col-span-2 rounded-xl border border-gh-border bg-gh-subtle p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gh-fg">Recent Runs</h2>
              <button className="text-sm text-gh-accent hover:text-gh-accent flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {mockRecentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-lg bg-gh-btn/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[run.status]}`} />
                    <div>
                      <p className="text-sm font-medium text-gh-fg">{projectNames[run.projectId]}</p>
                      <p className="text-xs text-gh-fg-subtle">{formatTime(run.startedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="hidden sm:inline text-gh-fg-muted">{run.totalTokens.toLocaleString()} tok</span>
                    <span className="hidden sm:inline text-gh-fg-muted">${run.totalCost.toFixed(2)}</span>
                    <span className="hidden md:inline text-gh-fg-muted w-12 text-right">{formatDuration(run.duration)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[run.status]}`}>
                      {run.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gh-border bg-gh-subtle p-5">
            <h2 className="text-lg font-semibold text-gh-fg mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button onClick={() => router.push('/studio?new=1')} className="w-full flex items-center gap-3 rounded-lg bg-gh-accent-emphasis hover:bg-gh-accent px-4 py-3 text-sm font-medium text-gh-fg transition-colors">
                <Plus className="h-4 w-4" /> New Project
              </button>
              <button onClick={() => router.push('/studio')} className="w-full flex items-center gap-3 rounded-lg bg-gh-btn hover:bg-gh-btn-hover px-4 py-3 text-sm font-medium text-gh-fg transition-colors">
                <Zap className="h-4 w-4" /> Open Studio
              </button>
              <button onClick={() => router.push('/runs')} className="w-full flex items-center gap-3 rounded-lg bg-gh-btn hover:bg-gh-btn-hover px-4 py-3 text-sm font-medium text-gh-fg transition-colors">
                <Play className="h-4 w-4" /> Trigger Run
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
