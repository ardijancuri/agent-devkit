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
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selectedTools.includes(tool.id)}
            onChange={() => toggle(tool.id)}
            className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <Wrench className="w-3.5 h-3.5 text-gray-400" />
          <div>
            <div className="text-sm text-white">{tool.name}</div>
            <div className="text-xs text-gray-500">{tool.description}</div>
          </div>
        </label>
      ))}

      {/* Custom tools already selected */}
      {selectedTools
        .filter((t) => t.startsWith('custom_'))
        .map((t) => (
          <div key={t} className="flex items-center justify-between p-2 rounded-lg bg-gray-800">
            <span className="text-sm text-white">{t.replace('custom_', '').replace(/_/g, ' ')}</span>
            <button onClick={() => onChange(selectedTools.filter((s) => s !== t))} className="text-gray-500 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

      {showCustom ? (
        <div className="space-y-2 p-3 bg-gray-800 rounded-lg">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Tool name"
            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="Description"
            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCustom(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
            <button onClick={addCustom} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded">Add</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 mt-2"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Custom Tool
        </button>
      )}
    </div>
  );
}
