'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Coins, Cpu, CheckCircle2, XCircle, Loader2, BarChart3, List, Users, DollarSign } from 'lucide-react';
import { EventTimeline } from '@/components/runs/EventTimeline';
import { TokenWaterfall } from '@/components/runs/TokenWaterfall';
import type { Run, RunEvent } from '@/lib/types';

const AGENT_NAMES = ['Orchestrator', 'Researcher', 'Writer', 'Reviewer'];
const EVENT_TYPES: RunEvent['type'][] = ['agent_start', 'tool_call', 'message_sent', 'tool_result', 'decision', 'message_received', 'agent_end', 'error'];

function makeMockRun(id: string): Run {
  return {
    id,
    projectId: 'proj-1',
    status: 'completed',
    totalTokens: 284930,
    totalCost: 2.4521,
    duration: 187,
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3600000 + 187000).toISOString(),
  };
}

function makeMockEvents(runId: string): RunEvent[] {
  return Array.from({ length: 30 }, (_, i) => ({
    id: `evt-${i}`,
    runId,
    agentId: `agent-${i % 4}`,
    agentName: AGENT_NAMES[i % 4],
    type: EVENT_TYPES[i % EVENT_TYPES.length],
    data: { summary: `Event ${i + 1} details here` },
    tokens: Math.floor(Math.random() * 8000) + 500,
    cost: parseFloat((Math.random() * 0.15).toFixed(5)),
    timestamp: new Date(Date.now() - 3600000 + i * 6000).toISOString(),
  }));
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-5 h-5 text-green-400" />,
  failed: <XCircle className="w-5 h-5 text-red-400" />,
  running: <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />,
  pending: <Clock className="w-5 h-5 text-gh-fg-muted" />,
};

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: BarChart3 },
  { id: 'events', label: 'Events', icon: List },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'cost', label: 'Cost', icon: DollarSign },
] as const;

type Tab = typeof TABS[number]['id'];

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  const [tab, setTab] = useState<Tab>('timeline');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const run = makeMockRun(runId);
  const events = makeMockEvents(runId);

  const filteredEvents = eventTypeFilter === 'all' ? events : events.filter(e => e.type === eventTypeFilter);

  const agentBreakdown = AGENT_NAMES.map((name, i) => {
    const agentEvents = events.filter(e => e.agentId === `agent-${i}`);
    return {
      name,
      agentId: `agent-${i}`,
      tokens: agentEvents.reduce((s, e) => s + e.tokens, 0),
      cost: agentEvents.reduce((s, e) => s + e.cost, 0),
      eventCount: agentEvents.length,
    };
  });

  return (
    <div className="min-h-screen bg-gh-canvas p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button onClick={() => router.push('/runs')} className="flex items-center gap-2 text-sm text-gh-fg-muted hover:text-gh-fg mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to runs
        </button>

        <div className="bg-gh-subtle border border-gh-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {STATUS_ICON[run.status]}
            <h1 className="text-xl font-bold text-gh-fg">{runId}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${run.status === 'completed' ? 'bg-green-500/10 text-green-400' : run.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
              {run.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: 'Duration', value: run.duration ? `${Math.floor(run.duration / 60)}m ${run.duration % 60}s` : '—' },
              { icon: Cpu, label: 'Total Tokens', value: (run.totalTokens / 1000).toFixed(1) + 'K' },
              { icon: Coins, label: 'Total Cost', value: '$' + run.totalCost.toFixed(4) },
              { icon: Users, label: 'Agents', value: String(AGENT_NAMES.length) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gh-btn/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gh-fg-muted text-xs mb-1">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
                <p className="text-lg font-semibold text-gh-fg">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gh-border">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === id ? 'border-gh-accent text-gh-accent' : 'border-transparent text-gh-fg-subtle hover:text-gh-fg-muted'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'timeline' && <EventTimeline events={events} run={run} />}

        {tab === 'events' && (
          <div>
            <div className="mb-4">
              <select
                value={eventTypeFilter}
                onChange={e => setEventTypeFilter(e.target.value)}
                className="bg-gh-btn border border-gh-border rounded-md px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-gh-accent"
              >
                <option value="all">All Event Types</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {filteredEvents.map(evt => (
                <div key={evt.id} className="bg-gh-subtle border border-gh-border rounded-lg p-3 flex items-center gap-4">
                  <span className="text-xs text-gh-fg-subtle font-mono w-20 shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-xs font-medium w-24 shrink-0 ${['text-gh-accent', 'text-emerald-400', 'text-purple-400', 'text-orange-400'][parseInt(evt.agentId.split('-')[1])]}`}>
                    {evt.agentName}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${evt.type === 'error' ? 'bg-red-500/10 text-red-400' : evt.type.startsWith('tool') ? 'bg-gh-accent/10 text-gh-accent' : 'bg-gh-btn text-gh-fg-muted'}`}>
                    {evt.type}
                  </span>
                  <span className="text-sm text-gh-fg-muted flex-1 truncate">{String(evt.data.summary)}</span>
                  <span className="text-xs text-gh-fg-subtle">{evt.tokens.toLocaleString()} tok</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agentBreakdown.map(agent => (
              <div key={agent.agentId} className="bg-gh-subtle border border-gh-border rounded-lg p-5">
                <h3 className="text-gh-fg font-semibold mb-3">{agent.name}</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gh-fg-subtle">Tokens</p>
                    <p className="text-sm font-medium text-gh-fg">{(agent.tokens / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-gh-fg-subtle">Cost</p>
                    <p className="text-sm font-medium text-gh-fg">${agent.cost.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gh-fg-subtle">Events</p>
                    <p className="text-sm font-medium text-gh-fg">{agent.eventCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'cost' && <TokenWaterfall events={events} />}
      </div>
    </div>
  );
}
