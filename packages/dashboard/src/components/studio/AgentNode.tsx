'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot, Trash2, Wrench } from 'lucide-react';
import type { AgentNode as AgentNodeType } from '@/lib/types';

const MODEL_COLORS: Record<string, string> = {
  'claude-opus': 'bg-purple-600',
  'claude-sonnet': 'bg-violet-500',
  'claude-haiku': 'bg-indigo-500',
  'gpt-4o': 'bg-green-600',
  'gpt-4': 'bg-emerald-600',
  'gpt-3.5': 'bg-teal-600',
};

function getModelColor(model: string) {
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (model.toLowerCase().includes(key)) return color;
  }
  return 'bg-gray-600';
}

function getModelLabel(model: string) {
  const lower = model.toLowerCase();
  if (lower.includes('opus')) return 'Opus';
  if (lower.includes('sonnet')) return 'Sonnet';
  if (lower.includes('haiku')) return 'Haiku';
  if (lower.includes('4o')) return '4o';
  if (lower.includes('gpt-4')) return 'GPT-4';
  if (lower.includes('3.5')) return '3.5';
  return model.slice(0, 8);
}

type AgentNodeData = AgentNodeType & {
  onDelete?: (id: string) => void;
  onDoubleClick?: (id: string) => void;
};

function AgentNodeComponent({ data, id, selected }: NodeProps & { data: AgentNodeData }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative bg-gray-900 border-2 rounded-xl px-4 py-3 min-w-[180px] transition-all ${
        selected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-700 hover:border-gray-500'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={() => data.onDoubleClick?.(id)}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-gray-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-gray-900" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-blue-500 !w-3 !h-3 !border-2 !border-gray-900" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-blue-500 !w-3 !h-3 !border-2 !border-gray-900" />

      {/* Delete button */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.(id);
          }}
          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 rounded-full p-1 z-10"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Bot className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-sm font-semibold text-white truncate">{data.name}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium text-white ${getModelColor(data.model)}`}>
          {getModelLabel(data.model)}
        </span>
        {data.tools.length > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <Wrench className="w-3 h-3" />
            {data.tools.length}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(AgentNodeComponent);
