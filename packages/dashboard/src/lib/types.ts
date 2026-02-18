export interface Project {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentNode {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  permissions: Record<string, boolean>;
  limits: {
    maxTokens?: number;
    maxCost?: number;
    maxTime?: number;
  };
  position: { x: number; y: number };
}

export interface AgentConnection {
  id: string;
  sourceId: string;
  targetId: string;
  channelType: 'direct' | 'broadcast' | 'queue';
}

export interface Run {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalTokens: number;
  totalCost: number;
  duration: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface RunEvent {
  id: string;
  runId: string;
  agentId: string;
  agentName: string;
  type: 'agent_start' | 'agent_end' | 'tool_call' | 'tool_result' | 'message_sent' | 'message_received' | 'decision' | 'error';
  data: Record<string, unknown>;
  tokens: number;
  cost: number;
  timestamp: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalRuns: number;
  totalCost: number;
  activeAgents: number;
  recentRuns: Run[];
}

export interface LiveAgentStatus {
  agentId: string;
  name: string;
  status: 'idle' | 'running' | 'error' | 'completed';
  currentStep: string | null;
  tokensUsed: number;
  cost: number;
}
