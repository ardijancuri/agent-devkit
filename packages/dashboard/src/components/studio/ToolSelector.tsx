'use client';

import { useState } from 'react';
import { Wrench, Plus, X } from 'lucide-react';

const BUILT_IN_TOOLS = [
  { id: 'web_search', name: 'Web Search', description: 'Search the web for information' },
  { id: 'file_read', name: 'File Read', description: 'Read file contents' },
  { id: 'file_write', name: 'File Write', description: 'Write content to files' },
  { id: 'code_execute', name: 'Code Execute', description: 'Execute code in a sandbox' },
  { id: 'http_request', name: 'HTTP Request', description: 'Make HTTP API calls' },
];

interface ToolSelectorProps {
  selectedTools: string[];
  onChange: (tools: string[]) => void;
}

export default function ToolSelector({ selectedTools, onChange }: ToolSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const toggle = (id: string) => {
    onChange(
      selectedTools.includes(id)
        ? selectedTools.filter((t) => t !== id)
        : [...selectedTools, id]
    );
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const id = `custom_${customName.toLowerCase().replace(/\s+/g, '_')}`;
    onChange([...selectedTools, id]);
    setCustomName('');
    setCustomDesc('');
    setShowCustom(false);
  };

  return (
    <div className="space-y-2">
      {BUILT_IN_TOOLS.map((tool) => (
        <label
          key={tool.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gh-btn cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selectedTools.includes(tool.id)}
            onChange={() => toggle(tool.id)}
            className="w-4 h-4 rounded bg-gh-btn border-gh-border text-gh-accent focus:ring-gh-accent focus:ring-offset-0"
          />
          <Wrench className="w-3.5 h-3.5 text-gh-fg-muted" />
          <div>
            <div className="text-sm text-gh-fg">{tool.name}</div>
            <div className="text-xs text-gh-fg-subtle">{tool.description}</div>
          </div>
        </label>
      ))}

      {/* Custom tools already selected */}
      {selectedTools
        .filter((t) => t.startsWith('custom_'))
        .map((t) => (
          <div key={t} className="flex items-center justify-between p-2 rounded-lg bg-gh-btn">
            <span className="text-sm text-gh-fg">{t.replace('custom_', '').replace(/_/g, ' ')}</span>
            <button onClick={() => onChange(selectedTools.filter((s) => s !== t))} className="text-gh-fg-subtle hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

      {showCustom ? (
        <div className="space-y-2 p-3 bg-gh-btn rounded-lg">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Tool name"
            className="w-full bg-gh-subtle border border-gh-border rounded px-2 py-1.5 text-sm text-gh-fg focus:outline-none focus:border-gh-accent"
          />
          <input
            type="text"
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="Description"
            className="w-full bg-gh-subtle border border-gh-border rounded px-2 py-1.5 text-sm text-gh-fg focus:outline-none focus:border-gh-accent"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCustom(false)} className="text-xs text-gh-fg-muted hover:text-gh-fg">Cancel</button>
            <button onClick={addCustom} className="text-xs bg-gh-accent-emphasis hover:bg-gh-accent text-white px-2 py-1 rounded">Add</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-1.5 text-sm text-gh-accent hover:text-gh-accent mt-2"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Custom Tool
        </button>
      )}
    </div>
  );
}
