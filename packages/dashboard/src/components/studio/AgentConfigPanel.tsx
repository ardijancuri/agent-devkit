'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import type { AgentNode } from '@/lib/types';
import ToolSelector from './ToolSelector';

const MODELS = [
  { value: 'claude-opus', label: 'Claude Opus' },
  { value: 'claude-sonnet', label: 'Claude Sonnet' },
  { value: 'claude-haiku', label: 'Claude Haiku' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5', label: 'GPT-3.5' },
];

const TABS = ['General', 'Prompt', 'Tools', 'Limits'] as const;
type Tab = (typeof TABS)[number];

interface AgentConfigPanelProps {
  agent: AgentNode;
  onUpdate: (agent: AgentNode) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function AgentConfigPanel({ agent, onUpdate, onDelete, onClose }: AgentConfigPanelProps) {
  const [tab, setTab] = useState<Tab>('General');
  const [draft, setDraft] = useState<AgentNode>(agent);

  useEffect(() => setDraft(agent), [agent]);

  const update = (partial: Partial<AgentNode>) => setDraft((d) => ({ ...d, ...partial }));

  return (
    <div className="w-80 bg-gh-subtle border-l border-gh-border flex flex-col h-full animate-in slide-in-from-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
        <h3 className="text-sm font-semibold text-gh-fg">Agent Config</h3>
        <button onClick={onClose} className="text-gh-fg-muted hover:text-gh-fg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gh-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gh-fg-subtle hover:text-gh-fg-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'General' && (
          <>
            <div>
              <label className="block text-xs text-gh-fg-muted mb-1">Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                className="w-full bg-gh-btn border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gh-fg-muted mb-1">Model</label>
              <select
                value={draft.model}
                onChange={(e) => update({ model: e.target.value })}
                className="w-full bg-gh-btn border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-blue-500"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {tab === 'Prompt' && (
          <div>
            <label className="block text-xs text-gh-fg-muted mb-1">System Prompt</label>
            <textarea
              value={draft.systemPrompt}
              onChange={(e) => update({ systemPrompt: e.target.value })}
              className="w-full bg-gh-btn border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg font-mono focus:outline-none focus:border-blue-500 h-[400px] resize-none"
              placeholder="You are a helpful assistant..."
            />
          </div>
        )}

        {tab === 'Tools' && (
          <ToolSelector
            selectedTools={draft.tools}
            onChange={(tools) => update({ tools })}
          />
        )}

        {tab === 'Limits' && (
          <>
            <div>
              <label className="block text-xs text-gh-fg-muted mb-1">Max Tokens</label>
              <input
                type="number"
                value={draft.limits.maxTokens ?? ''}
                onChange={(e) => update({ limits: { ...draft.limits, maxTokens: e.target.value ? Number(e.target.value) : undefined } })}
                className="w-full bg-gh-btn border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-blue-500"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-xs text-gh-fg-muted mb-1">Max Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={draft.limits.maxCost ?? ''}
                onChange={(e) => update({ limits: { ...draft.limits, maxCost: e.target.value ? Number(e.target.value) : undefined } })}
                className="w-full bg-gh-btn border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-blue-500"
                placeholder="5.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gh-fg-muted mb-1">Timeout (seconds)</label>
              <input
                type="number"
                value={draft.limits.maxTime ?? ''}
                onChange={(e) => update({ limits: { ...draft.limits, maxTime: e.target.value ? Number(e.target.value) : undefined } })}
                className="w-full bg-gh-btn border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-blue-500"
                placeholder="300"
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gh-border flex items-center justify-between">
        <button
          onClick={() => onDelete(agent.id)}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
        <button
          onClick={() => onUpdate(draft)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-gh-fg text-xs rounded-lg"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </div>
  );
}
