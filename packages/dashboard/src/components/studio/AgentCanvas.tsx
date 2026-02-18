'use client';

import { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import AgentNodeComponent from './AgentNode';
import ConnectionEdge from './ConnectionEdge';
import CanvasToolbar from './CanvasToolbar';
import type { AgentNode as AgentNodeType } from '@/lib/types';

interface AgentCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeSelect: (agentData: AgentNodeType | null) => void;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

let nodeIdCounter = 0;

export default function AgentCanvas({
  initialNodes,
  initialEdges,
  onNodeSelect,
  onNodesChange: onNodesChangeCallback,
  onEdgesChange: onEdgesChangeCallback,
}: AgentCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([{ nodes: initialNodes, edges: initialEdges }]);
  const historyIdxRef = useRef(0);
  const reactFlowRef = useRef<any>(null);

  const nodeTypes: NodeTypes = useMemo(() => ({ agent: AgentNodeComponent as any }), []);
  const edgeTypes: EdgeTypes = useMemo(() => ({ connection: ConnectionEdge as any }), []);

  const pushHistory = useCallback((n: Node[], e: Edge[]) => {
    const idx = historyIdxRef.current + 1;
    historyRef.current = historyRef.current.slice(0, idx);
    historyRef.current.push({ nodes: n, edges: e });
    historyIdxRef.current = idx;
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        type: 'connection',
        data: { channelType: 'direct', onDelete: deleteEdge },
      };
      setEdges((eds) => {
        const next = addEdge(newEdge, eds);
        pushHistory(nodes, next);
        return next;
      });
    },
    [setEdges, nodes, pushHistory]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => {
        const next = nds.filter((n) => n.id !== id);
        pushHistory(next, edges);
        return next;
      });
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      onNodeSelect(null);
    },
    [setNodes, setEdges, edges, pushHistory, onNodeSelect]
  );

  const deleteEdge = useCallback(
    (id: string) => {
      setEdges((eds) => {
        const next = eds.filter((e) => e.id !== id);
        pushHistory(nodes, next);
        return next;
      });
    },
    [setEdges, nodes, pushHistory]
  );

  const addAgent = useCallback(() => {
    const id = `agent-${++nodeIdCounter}-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'agent',
      position: { x: 300 + Math.random() * 100, y: 200 + Math.random() * 100 },
      data: {
        id,
        name: `Agent ${nodeIdCounter}`,
        model: 'claude-sonnet',
        systemPrompt: '',
        tools: [],
        permissions: {},
        limits: {},
        position: { x: 0, y: 0 },
        onDelete: deleteNode,
        onDoubleClick: (nid: string) => {
          const node = nodes.find((n) => n.id === nid);
          if (node) onNodeSelect(node.data as unknown as AgentNodeType);
        },
      },
    };
    setNodes((nds) => {
      const next = [...nds, newNode];
      pushHistory(next, edges);
      return next;
    });
  }, [setNodes, edges, pushHistory, deleteNode, onNodeSelect, nodes]);

  const autoLayout = useCallback(() => {
    // Simple auto-layout: arrange in grid
    setNodes((nds) => {
      const cols = Math.ceil(Math.sqrt(nds.length));
      const next = nds.map((n, i) => ({
        ...n,
        position: {
          x: (i % cols) * 280 + 50,
          y: Math.floor(i / cols) * 200 + 50,
        },
      }));
      pushHistory(next, edges);
      return next;
    });
  }, [setNodes, edges, pushHistory]);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    const state = historyRef.current[historyIdxRef.current];
    setNodes(state.nodes);
    setEdges(state.edges);
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    const state = historyRef.current[historyIdxRef.current];
    setNodes(state.nodes);
    setEdges(state.edges);
  }, [setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.data as unknown as AgentNodeType);
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div className="relative w-full h-full">
      <CanvasToolbar
        onAddAgent={addAgent}
        onAutoLayout={autoLayout}
        onZoomIn={() => reactFlowRef.current?.zoomIn()}
        onZoomOut={() => reactFlowRef.current?.zoomOut()}
        onFitView={() => reactFlowRef.current?.fitView()}
        onUndo={undo}
        onRedo={redo}
        onSave={() => {
          onNodesChangeCallback?.(nodes);
          onEdgesChangeCallback?.(edges);
        }}
        onRun={() => {/* TODO: trigger run */}}
        canUndo={historyIdxRef.current > 0}
        canRedo={historyIdxRef.current < historyRef.current.length - 1}
      />
      <ReactFlow
        ref={reactFlowRef}
        nodes={nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            onDelete: deleteNode,
            onDoubleClick: (id: string) => {
              const node = nodes.find((nd) => nd.id === id);
              if (node) onNodeSelect(node.data as unknown as AgentNodeType);
            },
          },
        }))}
        edges={edges.map((e) => ({
          ...e,
          data: { ...e.data, onDelete: deleteEdge },
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-gray-950"
        defaultEdgeOptions={{ type: 'connection' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
        <Controls className="!bg-gh-subtle !border-gh-border !rounded-lg [&>button]:!bg-gh-btn [&>button]:!border-gh-border [&>button]:!text-gh-fg-muted [&>button:hover]:!bg-gh-btn-hover" />
        <MiniMap
          className="!bg-gh-subtle !border-gh-border !rounded-lg"
          nodeColor="#3b82f6"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
