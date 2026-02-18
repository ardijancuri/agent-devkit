'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Network, ArrowRight, Swords, GitFork, Bug } from 'lucide-react';
import type { AgentNode as AgentNodeType, AgentConnection } from '@/lib/types';

interface Pattern {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  agents: Omit<AgentNodeType, 'id'>[];
  connections: { sourceIdx: number; targetIdx: number; channelType: 'direct' | 'broadcast' | 'queue' }[];
}

const PATTERNS: Pattern[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator → Workers',
    description: 'Central coordinator delegates to specialized worker agents',
    icon: <Network className="w-5 h-5 text-gh-accent" />,
    agents: [
      { name: 'Orchestrator', model: 'claude-opus', systemPrompt: 'You coordinate the workers.', tools: [], permissions: {}, limits: { maxTokens: 100000 }, position: { x: 300, y: 50 } },
      { name: 'Worker 1', model: 'claude-sonnet', systemPrompt: 'You handle task type A.', tools: ['file_read', 'file_write'], permissions: {}, limits: {}, position: { x: 100, y: 250 } },
      { name: 'Worker 2', model: 'claude-sonnet', systemPrompt: 'You handle task type B.', tools: ['web_search'], permissions: {}, limits: {}, position: { x: 500, y: 250 } },
    ],
    connections: [
      { sourceIdx: 0, targetIdx: 1, channelType: 'direct' },
      { sourceIdx: 0, targetIdx: 2, channelType: 'direct' },
    ],
  },
  {
    id: 'pipeline',
    name: 'Pipeline',
    description: 'Sequential handoff from one agent to the next',
    icon: <ArrowRight className="w-5 h-5 text-green-400" />,
    agents: [
      { name: 'Stage 1', model: 'claude-sonnet', systemPrompt: 'First processing stage.', tools: [], permissions: {}, limits: {}, position: { x: 100, y: 150 } },
      { name: 'Stage 2', model: 'claude-sonnet', systemPrompt: 'Second processing stage.', tools: [], permissions: {}, limits: {}, position: { x: 350, y: 150 } },
      { name: 'Stage 3', model: 'claude-sonnet', systemPrompt: 'Final processing stage.', tools: [], permissions: {}, limits: {}, position: { x: 600, y: 150 } },
    ],
    connections: [
      { sourceIdx: 0, targetIdx: 1, channelType: 'direct' },
      { sourceIdx: 1, targetIdx: 2, channelType: 'direct' },
    ],
  },
  {
    id: 'debate',
    name: 'Debate',
    description: 'Adversarial agents review and critique each other',
    icon: <Swords className="w-5 h-5 text-red-400" />,
    agents: [
      { name: 'Proposer', model: 'claude-sonnet', systemPrompt: 'You propose solutions.', tools: [], permissions: {}, limits: {}, position: { x: 100, y: 150 } },
      { name: 'Critic', model: 'claude-sonnet', systemPrompt: 'You critique proposals.', tools: [], permissions: {}, limits: {}, position: { x: 500, y: 150 } },
      { name: 'Judge', model: 'claude-opus', systemPrompt: 'You make the final decision.', tools: [], permissions: {}, limits: {}, position: { x: 300, y: 350 } },
    ],
    connections: [
      { sourceIdx: 0, targetIdx: 1, channelType: 'direct' },
      { sourceIdx: 1, targetIdx: 0, channelType: 'direct' },
      { sourceIdx: 0, targetIdx: 2, channelType: 'direct' },
      { sourceIdx: 1, targetIdx: 2, channelType: 'direct' },
    ],
  },
  {
    id: 'map-reduce',
    name: 'Map-Reduce',
    description: 'Fan out work to many agents, aggregate results',
    icon: <GitFork className="w-5 h-5 text-yellow-400" />,
    agents: [
      { name: 'Mapper', model: 'claude-sonnet', systemPrompt: 'You split and distribute work.', tools: [], permissions: {}, limits: {}, position: { x: 300, y: 50 } },
      { name: 'Worker A', model: 'claude-haiku', systemPrompt: 'Process your chunk.', tools: [], permissions: {}, limits: {}, position: { x: 50, y: 200 } },
      { name: 'Worker B', model: 'claude-haiku', systemPrompt: 'Process your chunk.', tools: [], permissions: {}, limits: {}, position: { x: 300, y: 200 } },
      { name: 'Worker C', model: 'claude-haiku', systemPrompt: 'Process your chunk.', tools: [], permissions: {}, limits: {}, position: { x: 550, y: 200 } },
      { name: 'Reducer', model: 'claude-sonnet', systemPrompt: 'Aggregate all results.', tools: [], permissions: {}, limits: {}, position: { x: 300, y: 380 } },
    ],
    connections: [
      { sourceIdx: 0, targetIdx: 1, channelType: 'broadcast' },
      { sourceIdx: 0, targetIdx: 2, channelType: 'broadcast' },
      { sourceIdx: 0, targetIdx: 3, channelType: 'broadcast' },
      { sourceIdx: 1, targetIdx: 4, channelType: 'queue' },
      { sourceIdx: 2, targetIdx: 4, channelType: 'queue' },
      { sourceIdx: 3, targetIdx: 4, channelType: 'queue' },
    ],
  },
  {
    id: 'swarm',
    name: 'Swarm',
    description: 'Autonomous agents self-organize via shared message bus',
    icon: <Bug className="w-5 h-5 text-purple-400" />,
    agents: [
      { name: 'Agent A', model: 'claude-sonnet', systemPrompt: 'Autonomous agent.', tools: ['web_search', 'file_read'], permissions: {}, limits: {}, position: { x: 100, y: 100 } },
      { name: 'Agent B', model: 'claude-sonnet', systemPrompt: 'Autonomous agent.', tools: ['code_execute'], permissions: {}, limits: {}, position: { x: 400, y: 100 } },
      { name: 'Agent C', model: 'claude-sonnet', systemPrompt: 'Autonomous agent.', tools: ['file_write'], permissions: {}, limits: {}, position: { x: 250, y: 300 } },
    ],
    connections: [
      { sourceIdx: 0, targetIdx: 1, channelType: 'broadcast' },
      { sourceIdx: 1, targetIdx: 2, channelType: 'broadcast' },
      { sourceIdx: 2, targetIdx: 0, channelType: 'broadcast' },
    ],
  },
];

interface PatternLibraryProps {
  onApply: (agents: Omit<AgentNodeType, 'id'>[], connections: Pattern['connections']) => void;
}

export default function PatternLibrary({ onApply }: PatternLibraryProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gh-subtle border border-gh-border rounded-r-lg p-2 hover:bg-gh-btn"
      >
        <ChevronRight className="w-4 h-4 text-gh-fg-muted" />
      </button>
    );
  }

  return (
    <div className="w-64 bg-gh-subtle border-r border-gh-border flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
        <h3 className="text-sm font-semibold text-gh-fg">Patterns</h3>
        <button onClick={() => setCollapsed(true)} className="text-gh-fg-muted hover:text-gh-fg">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {PATTERNS.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => onApply(pattern.agents, pattern.connections)}
            className="w-full text-left p-3 rounded-lg hover:bg-gh-btn transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              {pattern.icon}
              <span className="text-sm font-medium text-gh-fg group-hover:text-gh-accent transition-colors">
                {pattern.name}
              </span>
            </div>
            <p className="text-xs text-gh-fg-subtle leading-relaxed">{pattern.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
