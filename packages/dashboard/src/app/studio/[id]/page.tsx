'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { AgentNode as AgentNodeType } from '@/lib/types';
import AgentCanvas from '@/components/studio/AgentCanvas';
import AgentConfigPanel from '@/components/studio/AgentConfigPanel';
import PatternLibrary from '@/components/studio/PatternLibrary';

// Mock initial data for demo
const MOCK_NODES: Node[] = [
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 300, y: 50 },
    data: {
      id: 'agent-1',
      name: 'Orchestrator',
      model: 'claude-opus',
      systemPrompt: 'You coordinate the workers.',
      tools: [],
      permissions: {},
      limits: { maxTokens: 100000 },
      position: { x: 300, y: 50 },
    },
  },
  {
    id: 'agent-2',
    type: 'agent',
    position: { x: 100, y: 250 },
    data: {
      id: 'agent-2',
      name: 'Researcher',
      model: 'claude-sonnet',
      systemPrompt: 'You research topics.',
      tools: ['web_search', 'file_read'],
      permissions: {},
      limits: {},
      position: { x: 100, y: 250 },
    },
  },
  {
    id: 'agent-3',
    type: 'agent',
    position: { x: 500, y: 250 },
    data: {
      id: 'agent-3',
      name: 'Writer',
      model: 'claude-sonnet',
      systemPrompt: 'You write content.',
      tools: ['file_write'],
      permissions: {},
      limits: {},
      position: { x: 500, y: 250 },
    },
  },
];

const MOCK_EDGES: Edge[] = [
  {
    id: 'e1-2',
    source: 'agent-1',
    target: 'agent-2',
    type: 'connection',
    data: { channelType: 'direct' },
  },
  {
    id: 'e1-3',
    source: 'agent-1',
    target: 'agent-3',
    type: 'connection',
    data: { channelType: 'direct' },
  },
];

export default function ProjectEditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [selectedAgent, setSelectedAgent] = useState<AgentNodeType | null>(null);
  const [nodes, setNodes] = useState<Node[]>(MOCK_NODES);
  const [edges, setEdges] = useState<Edge[]>(MOCK_EDGES);

  const handleNodeSelect = useCallback((agent: AgentNodeType | null) => {
    setSelectedAgent(agent);
  }, []);

  const handleUpdateAgent = useCallback((updated: AgentNodeType) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === updated.id ? { ...n, data: { ...n.data, ...updated } } : n
      )
    );
    setSelectedAgent(updated);
  }, []);

  const handleDeleteAgent = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedAgent(null);
  }, []);

  const handleApplyPattern = useCallback(
    (
      agents: Omit<AgentNodeType, 'id'>[],
      connections: { sourceIdx: number; targetIdx: number; channelType: 'direct' | 'broadcast' | 'queue' }[]
    ) => {
      const ts = Date.now();
      const newNodes: Node[] = agents.map((a, i) => {
        const id = `agent-pattern-${ts}-${i}`;
        return {
          id,
          type: 'agent',
          position: a.position,
          data: { ...a, id },
        };
      });

      const newEdges: Edge[] = connections.map((c, i) => ({
        id: `e-pattern-${ts}-${i}`,
        source: newNodes[c.sourceIdx].id,
        target: newNodes[c.targetIdx].id,
        type: 'connection',
        data: { channelType: c.channelType },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedAgent(null);
    },
    []
  );

  return (
    <div className="h-screen flex bg-gh-canvas">
      <ReactFlowProvider>
        <PatternLibrary onApply={handleApplyPattern} />
        <div className="flex-1 relative">
          <AgentCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onNodeSelect={handleNodeSelect}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
          />
        </div>
        {selectedAgent && (
          <AgentConfigPanel
            agent={selectedAgent}
            onUpdate={handleUpdateAgent}
            onDelete={handleDeleteAgent}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </ReactFlowProvider>
    </div>
  );
}
