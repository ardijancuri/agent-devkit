'use client';

import { useState, useMemo, useRef } from 'react';
import type { Run, RunEvent } from '@/lib/types';

const AGENT_COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];
const EVENT_COLORS: Record<string, string> = {
  tool_call: '#3b82f6',
  tool_result: '#3b82f6',
  message_sent: '#10b981',
  message_received: '#10b981',
  error: '#ef4444',
  decision: '#6b7280',
  agent_start: '#8b5cf6',
  agent_end: '#8b5cf6',
};

interface Props {
  events: RunEvent[];
  run: Run;
}

export function EventTimeline({ events, run }: Props) {
  const [hoveredEvent, setHoveredEvent] = useState<RunEvent | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const agents = useMemo(() => [...new Set(events.map(e => e.agentName))], [events]);
  const startTime = new Date(run.startedAt).getTime();
  const endTime = run.completedAt ? new Date(run.completedAt).getTime() : Date.now();
  const totalMs = endTime - startTime || 1;

  const LANE_HEIGHT = 40;
  const LANE_GAP = 8;
  const LEFT_MARGIN = 140;
  const TOP_MARGIN = 30;
  const CHART_WIDTH = 800;
  const svgHeight = TOP_MARGIN + agents.length * (LANE_HEIGHT + LANE_GAP) + 20;

  function xPos(timestamp: string) {
    const t = new Date(timestamp).getTime();
    return LEFT_MARGIN + ((t - startTime) / totalMs) * (CHART_WIDTH - LEFT_MARGIN - 20);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto relative">
      <svg ref={svgRef} width={CHART_WIDTH} height={svgHeight} className="w-full" viewBox={`0 0 ${CHART_WIDTH} ${svgHeight}`}>
        {/* Time axis */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = LEFT_MARGIN + ((CHART_WIDTH - LEFT_MARGIN - 20) / 5) * i;
          const time = new Date(startTime + (totalMs / 5) * i);
          return (
            <g key={i}>
              <line x1={x} y1={TOP_MARGIN - 5} x2={x} y2={svgHeight - 10} stroke="#374151" strokeWidth={0.5} />
              <text x={x} y={TOP_MARGIN - 10} fill="#6b7280" fontSize={10} textAnchor="middle">
                {time.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
              </text>
            </g>
          );
        })}

        {/* Swim lanes */}
        {agents.map((agent, i) => {
          const y = TOP_MARGIN + i * (LANE_HEIGHT + LANE_GAP);
          const agentEvents = events.filter(e => e.agentName === agent);
          return (
            <g key={agent}>
              <rect x={0} y={y} width={CHART_WIDTH} height={LANE_HEIGHT} fill={i % 2 === 0 ? '#111827' : '#0f172a'} rx={4} />
              <text x={8} y={y + LANE_HEIGHT / 2 + 4} fill={AGENT_COLORS[i % AGENT_COLORS.length]} fontSize={12} fontWeight={600}>
                {agent}
              </text>
              {agentEvents.map(evt => {
                const ex = xPos(evt.timestamp);
                const color = EVENT_COLORS[evt.type] || '#6b7280';
                return (
                  <rect
                    key={evt.id}
                    x={ex - 4}
                    y={y + 8}
                    width={8}
                    height={LANE_HEIGHT - 16}
                    rx={2}
                    fill={color}
                    opacity={hoveredEvent?.id === evt.id ? 1 : 0.7}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={(e) => {
                      setHoveredEvent(evt);
                      const rect = svgRef.current?.getBoundingClientRect();
                      if (rect) setPopoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseLeave={() => setHoveredEvent(null)}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Live indicator */}
        {run.status === 'running' && (
          <line x1={xPos(new Date().toISOString())} y1={TOP_MARGIN} x2={xPos(new Date().toISOString())} y2={svgHeight - 10} stroke="#ef4444" strokeWidth={2} strokeDasharray="4,4">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </line>
        )}
      </svg>

      {/* Popover */}
      {hoveredEvent && (
        <div
          className="absolute z-50 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl pointer-events-none max-w-xs"
          style={{ left: popoverPos.x + 10, top: popoverPos.y - 10 }}
        >
          <p className="text-xs font-medium text-white">{hoveredEvent.agentName}</p>
          <p className="text-xs text-gray-400 mt-1">{hoveredEvent.type}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date(hoveredEvent.timestamp).toLocaleTimeString()}</p>
          <p className="text-xs text-gray-500">{hoveredEvent.tokens.toLocaleString()} tokens · ${hoveredEvent.cost.toFixed(5)}</p>
          {hoveredEvent.data.summary && <p className="text-xs text-gray-300 mt-1 truncate">{String(hoveredEvent.data.summary)}</p>}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 px-2">
        {Object.entries(EVENT_COLORS).slice(0, 5).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
