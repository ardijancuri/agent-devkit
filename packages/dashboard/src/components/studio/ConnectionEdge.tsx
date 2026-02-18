'use client';

import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';

const CHANNEL_COLORS: Record<string, string> = {
  direct: '#3b82f6',
  broadcast: '#f59e0b',
  queue: '#10b981',
};

interface ConnectionEdgeData {
  channelType: 'direct' | 'broadcast' | 'queue';
  onDelete?: (id: string) => void;
}

export default function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps & { data: ConnectionEdgeData }) {
  const [hovered, setHovered] = useState(false);
  const channelType = data?.channelType ?? 'direct';
  const color = CHANNEL_COLORS[channelType] ?? CHANNEL_COLORS.direct;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '6 3',
          animation: 'dashmove 0.5s linear infinite',
        }}
        interactionWidth={20}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-gh-fg"
            style={{ backgroundColor: color + '33', border: `1px solid ${color}` }}
          >
            {channelType}
            {hovered && (
              <button
                onClick={() => data?.onDelete?.(id)}
                className="ml-1 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
