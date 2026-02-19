'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, Activity } from 'lucide-react';
import { RunCard } from '@/components/runs/RunCard';
import type { Run } from '@/lib/types';

const MOCK_RUNS: (Run & { projectName: string })[] = Array.from({ length: 42 }, (_, i) => ({
  id: `run-${i + 1}`,
  projectId: `proj-${(i % 5) + 1}`,
  projectName: ['Customer Support Bot', 'Code Review Pipeline', 'Data Analysis Crew', 'Content Generator', 'Research Agent'][i % 5],
  status: (['completed', 'completed', 'failed', 'running', 'completed', 'cancelled', 'pending'] as Run['status'][])[i % 7],
  totalTokens: Math.floor(Math.random() * 500000) + 10000,
  totalCost: parseFloat((Math.random() * 5 + 0.1).toFixed(4)),
  duration: i % 7 === 3 ? null : Math.floor(Math.random() * 300) + 10,
  startedAt: new Date(Date.now() - i * 3600000 * 2).toISOString(),
  completedAt: i % 7 === 3 ? null : new Date(Date.now() - i * 3600000 * 2 + 60000).toISOString(),
}));

const PAGE_SIZE = 10;

export default function RunsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const projects = useMemo(() => [...new Set(MOCK_RUNS.map(r => r.projectName))], []);

  const filtered = useMemo(() => {
    return MOCK_RUNS.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (projectFilter !== 'all' && r.projectName !== projectFilter) return false;
      if (search && !r.projectName.toLowerCase().includes(search.toLowerCase()) && !r.id.includes(search)) return false;
      return true;
    });
  }, [statusFilter, projectFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRuns = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gh-canvas p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gh-fg flex items-center gap-2">
              <Activity className="w-6 h-6 text-gh-accent" />
              Run History
            </h1>
            <p className="text-gh-fg-muted mt-1">{filtered.length} runs total</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-gh-subtle border border-gh-border rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gh-fg-subtle" />
            <input
              type="text"
              placeholder="Search runs..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-gh-btn border border-gh-border rounded-md pl-10 pr-4 py-2 text-sm text-gh-fg placeholder-gh-fg-subtle focus:outline-none focus:border-gh-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gh-fg-subtle" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-gh-btn border border-gh-border rounded-md px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-gh-accent"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <select
            value={projectFilter}
            onChange={e => { setProjectFilter(e.target.value); setPage(1); }}
            className="bg-gh-btn border border-gh-border rounded-md px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-gh-accent"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Run List */}
        <div className="space-y-3">
          {pageRuns.map(run => (
            <RunCard
              key={run.id}
              run={run}
              projectName={run.projectName}
              onClick={() => router.push(`/runs/${run.id}`)}
            />
          ))}
          {pageRuns.length === 0 && (
            <div className="bg-gh-subtle border border-gh-border rounded-lg p-12 text-center">
              <Activity className="w-12 h-12 text-gh-fg-subtle mx-auto mb-3" />
              <p className="text-gh-fg-muted">No runs found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gh-fg-subtle">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-md bg-gh-btn border border-gh-border text-gh-fg-muted hover:text-gh-fg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-md text-sm ${p === page ? 'bg-gh-accent-emphasis text-gh-fg' : 'bg-gh-btn border border-gh-border text-gh-fg-muted hover:text-gh-fg'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-md bg-gh-btn border border-gh-border text-gh-fg-muted hover:text-gh-fg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
