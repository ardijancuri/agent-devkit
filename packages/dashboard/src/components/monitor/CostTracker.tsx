'use client';

import { DollarSign, TrendingUp } from 'lucide-react';
import type { LiveAgentStatus } from '@/lib/types';

const AGENT_COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f97316'];

interface Props {
  agents: LiveAgentStatus[];
  totalCost: number;
  budgetLimit?: number;
}

export function CostTracker({ agents, totalCost, budgetLimit }: Props) {
  const costPerMinute = totalCost > 0 ? (totalCost / 3).toFixed(4) : '0.0000'; // simplified
  const budgetPct = budgetLimit ? Math.min((totalCost / budgetLimit) * 100, 100) : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-medium text-gray-400">Cost Tracker</h2>
      </div>

      <div className="flex items-baseline gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-white">${totalCost.toFixed(4)}</p>
          <p className="text-xs text-gray-500">Total cost</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <TrendingUp className="w-3 h-3" />
          ${costPerMinute}/min
        </div>
      </div>

      {/* Budget bar */}
      {budgetPct !== null && budgetLimit && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Budget</span>
            <span>${totalCost.toFixed(2)} / ${budgetLimit.toFixed(2)}</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetPct > 80 ? 'bg-red-500' : budgetPct > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-agent breakdown */}
      <div className="space-y-2">
        {agents.filter(a => a.cost > 0).map((agent, i) => {
          const pct = totalCost > 0 ? (agent.cost / totalCost) * 100 : 0;
          return (
            <div key={agent.agentId} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: AGENT_COLORS[i % AGENT_COLORS.length] }} />
              <span className="text-xs text-gray-400 w-24 truncate">{agent.name}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: AGENT_COLORS[i % AGENT_COLORS.length] }} />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">${agent.cost.toFixed(4)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
