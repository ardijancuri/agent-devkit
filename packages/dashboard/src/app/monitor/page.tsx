'use client';

import { useState, useEffect } from 'react';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { LiveAgentGrid } from '@/components/monitor/LiveAgentGrid';
import { CostTracker } from '@/components/monitor/CostTracker';
import { EventFeed } from '@/components/monitor/EventFeed';
import type { LiveAgentStatus, RunEvent } from '@/lib/types';

const MOCK_AGENTS: LiveAgentStatus[] = [
  { agentId: 'agent-0', name: 'Orchestrator', status: 'running', currentStep: 'Coordinating sub-agents', tokensUsed: 45200, cost: 0.3812 },
  { agentId: 'agent-1', name: 'Researcher', status: 'running', currentStep: 'Calling web_search tool', tokensUsed: 28900, cost: 0.2104 },
  { agentId: 'agent-2', name: 'Writer', status: 'idle', currentStep: null, tokensUsed: 12400, cost: 0.0891 },
  { agentId: 'agent-3', name: 'Reviewer', status: 'idle', currentStep: null, tokensUsed: 0, cost: 0 },
];

const MOCK_EVENTS: RunEvent[] = Array.from({ length: 25 }, (_, i) => ({
  id: `live-evt-${i}`,
  runId: 'run-live',
  agentId: `agent-${i % 4}`,
  agentName: ['Orchestrator', 'Researcher', 'Writer', 'Reviewer'][i % 4],
  type: (['tool_call', 'message_sent', 'decision', 'tool_result', 'message_received'] as RunEvent['type'][])[i % 5],
  data: { summary: `Live event ${i + 1}: ${['Searching web', 'Processing results', 'Drafting section', 'Reviewing output', 'Making decision'][i % 5]}` },
  tokens: Math.floor(Math.random() * 5000) + 200,
  cost: parseFloat((Math.random() * 0.08).toFixed(5)),
  timestamp: new Date(Date.now() - i * 4000).toISOString(),
}));

export default function MonitorPage() {
  const [connected, setConnected] = useState(true);
  const [agents, setAgents] = useState<LiveAgentStatus[]>(MOCK_AGENTS);
  const [events, setEvents] = useState<RunEvent[]>(MOCK_EVENTS);
  const [hasActiveRun, setHasActiveRun] = useState(true);

  // Simulate live updates
  useEffect(() => {
    if (!hasActiveRun) return;
    const interval = setInterval(() => {
      const newEvent: RunEvent = {
        id: `live-evt-${Date.now()}`,
        runId: 'run-live',
        agentId: `agent-${Math.floor(Math.random() * 4)}`,
        agentName: ['Orchestrator', 'Researcher', 'Writer', 'Reviewer'][Math.floor(Math.random() * 4)],
        type: (['tool_call', 'message_sent', 'decision'] as RunEvent['type'][])[Math.floor(Math.random() * 3)],
        data: { summary: 'Processing...' },
        tokens: Math.floor(Math.random() * 3000) + 100,
        cost: parseFloat((Math.random() * 0.05).toFixed(5)),
        timestamp: new Date().toISOString(),
      };
      setEvents(prev => [newEvent, ...prev].slice(0, 200));
    }, 5000);
    return () => clearInterval(interval);
  }, [hasActiveRun]);

  const totalCost = agents.reduce((s, a) => s + a.cost, 0);
  const totalTokens = agents.reduce((s, a) => s + a.tokensUsed, 0);

  return (
    <div className="min-h-screen bg-gh-canvas p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-red-400 animate-pulse" />
            <h1 className="text-2xl font-bold text-gh-fg">Live Monitor</h1>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {!hasActiveRun ? (
          <div className="bg-gh-subtle border border-gh-border rounded-lg p-16 text-center">
            <Radio className="w-16 h-16 text-gh-fg-subtle mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gh-fg-muted mb-2">No Active Runs</h2>
            <p className="text-gh-fg-subtle">Start a run from the Studio to see live monitoring data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Agent Grid + Cost */}
            <div className="lg:col-span-2 space-y-6">
              <LiveAgentGrid agents={agents} />
              <CostTracker agents={agents} totalCost={totalCost} budgetLimit={5.0} />
            </div>

            {/* Right: Event Feed */}
            <div className="lg:col-span-1">
              <EventFeed events={events} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
