import { z } from 'zod';

// ─── Tool Definition ───────────────────────────────────────────

export interface ToolConfig {
  /** Unique tool name */
  name: string;
  /** Human-readable description for the LLM */
  description: string;
  /** Zod schema defining parameters */
  parameters: z.ZodType<unknown>;
  /** Execute the tool with validated parameters */
  execute: (params: unknown) => Promise<unknown>;
}

// ─── Agent Definition ──────────────────────────────────────────

export interface AgentLimits {
  maxTokens?: number;
  maxCost?: number;
  maxToolCalls?: number;
  timeoutMs?: number;
}

export interface AgentPermissions {
  allowedTools?: string[];
  deniedTools?: string[];
  canMessage?: string[];
}

export interface AgentConfig {
  /** Unique agent identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** LLM model identifier (e.g. "claude-sonnet-4-20250514", "gpt-4o") */
  model: string;
  /** System prompt */
  systemPrompt: string;
  /** Available tools */
  tools?: ToolConfig[];
  /** Permission constraints */
  permissions?: AgentPermissions;
  /** Resource limits */
  limits?: AgentLimits;
}

// ─── Connections ───────────────────────────────────────────────

export type ChannelType = 'direct' | 'broadcast' | 'queue';

export interface Connection {
  /** Source agent ID */
  sourceId: string;
  /** Target agent ID */
  targetId: string;
  /** Communication channel type */
  channelType: ChannelType;
}

// ─── Run Configuration ─────────────────────────────────────────

export interface RunConfig {
  /** Agents participating in this run */
  agents: AgentConfig[];
  /** Connections defining communication topology */
  connections: Connection[];
  /** Initial shared state (key-value) */
  sharedState?: Record<string, unknown>;
  /** Global timeout in milliseconds */
  timeout?: number;
  /** Global max cost in dollars */
  maxCost?: number;
  /** Input data for the run */
  input?: unknown;
}

// ─── Messages ──────────────────────────────────────────────────

export interface AgentMessage {
  /** Sender agent ID */
  from: string;
  /** Recipient agent ID (or '*' for broadcast) */
  to: string;
  /** Message content */
  content: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

// ─── Runtime Events ────────────────────────────────────────────

export type RunEventType =
  | 'agent_start'
  | 'agent_end'
  | 'tool_call'
  | 'tool_result'
  | 'message_sent'
  | 'message_received'
  | 'decision'
  | 'error';

export interface RunEvent {
  /** Unique event ID */
  id: string;
  /** Run this event belongs to */
  runId: string;
  /** Agent that generated this event */
  agentId: string;
  /** Event type */
  type: RunEventType;
  /** Event-specific data */
  data: unknown;
  /** Tokens used in this event */
  tokens?: { input: number; output: number };
  /** Cost in dollars */
  cost?: number;
  /** When the event occurred */
  timestamp: Date;
}

// ─── Status ────────────────────────────────────────────────────

export type RunStatusValue = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type AgentStatusValue = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentStatus {
  agentId: string;
  status: AgentStatusValue;
  currentStep: number;
  tokensUsed: number;
  cost: number;
}

export interface RunStatus {
  runId: string;
  status: RunStatusValue;
  agents: AgentStatus[];
  totalTokens: number;
  totalCost: number;
  startedAt: Date;
  completedAt?: Date;
}

// ─── LLM Provider ──────────────────────────────────────────────

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface LLMResponse {
  content: string | null;
  toolCalls?: LLMToolCall[];
  tokensUsed: { input: number; output: number };
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

export interface LLMProviderConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
}

export interface LLMProvider {
  chat(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    config?: LLMProviderConfig,
  ): Promise<LLMResponse>;
}

// ─── Run Result ────────────────────────────────────────────────

export interface RunResult {
  runId: string;
  status: RunStatusValue;
  output: unknown;
  events: RunEvent[];
  totalTokens: number;
  totalCost: number;
  durationMs: number;
}

// ─── Coordinator Interface (implemented by coordinator package) ─

export interface Coordinator {
  /** Send a message between agents */
  sendMessage(message: AgentMessage): Promise<void>;
  /** Get pending messages for an agent */
  getMessages(agentId: string): Promise<AgentMessage[]>;
  /** Set shared state value */
  setState(key: string, value: unknown, agentId: string): Promise<void>;
  /** Get shared state value */
  getState(key: string): Promise<unknown>;
  /** Acquire a lock on a resource */
  acquireLock(resource: string, agentId: string): Promise<boolean>;
  /** Release a lock */
  releaseLock(resource: string, agentId: string): Promise<void>;
}

// ─── Telemetry Interface (implemented by telemetry package) ────

export interface TelemetryCollector {
  /** Record a run event */
  record(event: RunEvent): void;
  /** Flush buffered events */
  flush(): Promise<void>;
  /** Get all events for a run */
  getEvents(runId: string): RunEvent[];
}
