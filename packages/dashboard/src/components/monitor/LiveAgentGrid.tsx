'use client';

import { Bot, Cpu, Wrench, Coffee } from 'lucide-react';
import type { LiveAgentStatus } from '@/lib/types';

const STATUS_CONFIG: Record<LiveAgentStatus['status'], { border: string; icon: React.ReactNode; label: string }> = {
  running: { border: 'border-gh-accent/50', icon: <Cpu className="w-4 h-4 text-gh-accent" />, label: 'Thinking' },
  idle: { border: 'border-gh-border', icon: <Coffee className="w-4 h-4 text-gh-fg-subtle" />, label: 'Idle' },
  error: { border: 'border-red-500/50', icon: <Bot className="w-4 h-4 text-red-400" />, label: 'Error' },
  completed: { border: 'border-green-500/50', icon: <Bot className="w-4 h-4 text-green-400" />, label: 'Done' },
};

interface Props {
  agents: LiveAgentStatus[];
}

export function LiveAgentGrid({ agents }: Props) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gh-fg-muted mb-3">Active Agents</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {agents.map(agent => {
          const config = STATUS_CONFIG[agent.status];
          return (
            <div key={agent.agentId} className={`bg-gh-subtle border-2 ${config.border} rounded-lg p-4 transition-colors`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {agent.status === 'running' && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gh-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gh-accent" />
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gh-fg">{agent.name}</span>
                </div>
                <span className="flex items-center gap-1 text-xs text-gh-fg-subtle">
                  {config.icon} {config.label}
                </span>
              </div>
              {agent.currentStep && (
                <p className="text-xs text-gh-fg-muted mb-3 truncate">{agent.currentStep}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gh-fg-subtle">
                <span>{(agent.tokensUsed / 1000).toFixed(1)}K tokens</span>
                <span>${agent.cost.toFixed(4)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
