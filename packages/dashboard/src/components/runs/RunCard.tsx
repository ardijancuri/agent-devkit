'use client';

import { Clock, Coins, Cpu, ChevronRight } from 'lucide-react';
import type { Run } from '@/lib/types';

const STATUS_STYLES: Record<Run['status'], { bg: string; text: string; dot: string }> = {
  completed: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  running: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  pending: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' },
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface RunCardProps {
  run: Run;
  projectName: string;
  onClick?: () => void;
}

export function RunCard({ run, projectName, onClick }: RunCardProps) {
  const style = STATUS_STYLES[run.status];

  return (
    <button
      onClick={onClick}
      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4 hover:border-gray-700 hover:bg-gray-900/80 transition-colors text-left group cursor-pointer"
    >
      {/* Status Badge */}
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${run.status === 'running' ? 'animate-pulse' : ''}`} />
        {run.status}
      </span>

      {/* Project & Run ID */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{projectName}</p>
        <p className="text-xs text-gray-500 font-mono">{run.id}</p>
      </div>

      {/* Metrics */}
      <div className="hidden sm:flex items-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDuration(run.duration)}
        </span>
        <span className="flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5" />
          {formatTokens(run.totalTokens)}
        </span>
        <span className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5" />
          ${run.totalCost.toFixed(4)}
        </span>
      </div>

      {/* Timestamp */}
      <span className="text-xs text-gray-500 whitespace-nowrap">{relativeTime(run.startedAt)}</span>

      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
    </button>
  );
}
