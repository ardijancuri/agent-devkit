'use client';

import { useState, useRef, useEffect } from 'react';
import { Wrench, MessageSquare, GitBranch, AlertCircle, ArrowDown, Filter } from 'lucide-react';
import type { RunEvent } from '@/lib/types';

const AGENT_COLORS = ['text-blue-400', 'text-emerald-400', 'text-purple-400', 'text-orange-400'];

const EVENT_ICONS: Partial<Record<RunEvent['type'], React.ReactNode>> = {
  tool_call: <Wrench className="w-3 h-3 text-blue-400" />,
  tool_result: <Wrench className="w-3 h-3 text-blue-300" />,
  message_sent: <MessageSquare className="w-3 h-3 text-green-400" />,
  message_received: <MessageSquare className="w-3 h-3 text-green-300" />,
  decision: <GitBranch className="w-3 h-3 text-gray-400" />,
  error: <AlertCircle className="w-3 h-3 text-red-400" />,
};

interface Props {
  events: RunEvent[];
}

export function EventFeed({ events }: Props) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const agents = [...new Set(events.map(e => e.agentName))];
  const types = [...new Set(events.map(e => e.type))];

  const filtered = events.filter(e => {
    if (agentFilter !== 'all' && e.agentName !== agentFilter) return false;
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    return true;
  }).slice(0, 200);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [filtered.length, autoScroll]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-400">Event Feed</h2>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${autoScroll ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'}`}
        >
          <ArrowDown className="w-3 h-3" />
          Auto-scroll {autoScroll ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-gray-800 flex gap-2">
        <select
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
        >
          <option value="all">All Agents</option>
          {agents.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
        >
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Events */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((evt, i) => {
          const agentIdx = agents.indexOf(evt.agentName);
          return (
            <div key={evt.id} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-800/50 transition-colors">
              <span className="text-[10px] text-gray-600 font-mono mt-0.5 w-14 shrink-0">
                {new Date(evt.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="mt-0.5 shrink-0">{EVENT_ICONS[evt.type] || <GitBranch className="w-3 h-3 text-gray-600" />}</span>
              <span className={`text-xs font-medium shrink-0 ${AGENT_COLORS[agentIdx % AGENT_COLORS.length]}`}>
                {evt.agentName}
              </span>
              <span className="text-xs text-gray-400 truncate">{String(evt.data.summary || evt.type)}</span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-gray-600 text-xs mt-8">No events</p>
        )}
      </div>
    </div>
  );
}
