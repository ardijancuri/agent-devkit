'use client';

import { useState, useMemo } from 'react';
import type { RunEvent } from '@/lib/types';

const AGENT_COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

interface Props {
  events: RunEvent[];
}

export function TokenWaterfall({ events }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const llmEvents = useMemo(
    () => events.filter(e => e.tokens > 0).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [events]
  );

  const agents = useMemo(() => [...new Set(llmEvents.map(e => e.agentName))], [llmEvents]);
  const agentColorMap = useMemo(() => Object.fromEntries(agents.map((a, i) => [a, AGENT_COLORS[i % AGENT_COLORS.length]])), [agents]);

  const maxTokens = Math.max(...llmEvents.map(e => e.tokens), 1);

  // Running total
  let runningTotal = 0;
  const totals = llmEvents.map(e => { runningTotal += e.tokens; return runningTotal; });
  const maxTotal = totals.length > 0 ? totals[totals.length - 1] : 1;

  const CHART_W = 800;
  const CHART_H = 300;
  const BAR_AREA_H = 250;
  const MARGIN_L = 60;
  const MARGIN_B = 30;
  const barW = llmEvents.length > 0 ? Math.max(4, Math.min(20, (CHART_W - MARGIN_L - 20) / llmEvents.length - 2)) : 10;

  return (
    <div className="bg-gh-subtle border border-gh-border rounded-lg p-4 overflow-x-auto relative">
      <h3 className="text-sm font-medium text-gh-fg-muted mb-4">Token Usage Waterfall</h3>
      <svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full">
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = BAR_AREA_H - frac * (BAR_AREA_H - 10);
          const val = Math.round(frac * maxTokens);
          return (
            <g key={frac}>
              <line x1={MARGIN_L} y1={y} x2={CHART_W - 10} y2={y} stroke="#1f2937" strokeWidth={0.5} />
              <text x={MARGIN_L - 5} y={y + 4} fill="#6b7280" fontSize={9} textAnchor="end">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {llmEvents.map((evt, i) => {
          const x = MARGIN_L + i * (barW + 2);
          const h = (evt.tokens / maxTokens) * (BAR_AREA_H - 10);
          const y = BAR_AREA_H - h;
          return (
            <rect
              key={evt.id}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={1}
              fill={agentColorMap[evt.agentName]}
              opacity={hoveredIdx === i ? 1 : 0.75}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {/* Running total line */}
        {totals.length > 1 && (
          <polyline
            points={totals.map((t, i) => {
              const x = MARGIN_L + i * (barW + 2) + barW / 2;
              const y = BAR_AREA_H - (t / maxTotal) * (BAR_AREA_H - 10);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4,2"
            opacity={0.6}
          />
        )}
      </svg>

      {/* Hover tooltip */}
      {hoveredIdx !== null && llmEvents[hoveredIdx] && (
        <div className="absolute top-12 right-4 bg-gh-btn border border-gh-border rounded-lg p-3 shadow-xl z-50 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agentColorMap[llmEvents[hoveredIdx].agentName] }} />
            <span className="text-sm font-medium text-gh-fg">{llmEvents[hoveredIdx].agentName}</span>
          </div>
          <div className="space-y-1 text-xs text-gh-fg-muted">
            <p>Tokens: <span className="text-gh-fg">{llmEvents[hoveredIdx].tokens.toLocaleString()}</span></p>
            <p>Cost: <span className="text-gh-fg">${llmEvents[hoveredIdx].cost.toFixed(5)}</span></p>
            <p>Type: <span className="text-gh-fg">{llmEvents[hoveredIdx].type}</span></p>
            <p>Time: <span className="text-gh-fg">{new Date(llmEvents[hoveredIdx].timestamp).toLocaleTimeString()}</span></p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {agents.map(agent => (
          <div key={agent} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agentColorMap[agent] }} />
            <span className="text-xs text-gh-fg-subtle">{agent}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <span className="w-4 border-t border-dashed border-amber-500" />
          <span className="text-xs text-gh-fg-subtle">Running total</span>
        </div>
      </div>
    </div>
  );
}
