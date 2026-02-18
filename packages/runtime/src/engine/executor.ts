import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'eventemitter3';
import type {
  AgentConfig,
  RunEvent,
  RunEventType,
  LLMProvider,
  LLMMessage,
  LLMToolDefinition,
  LLMToolCall,
  ToolConfig,
  Coordinator,
  TelemetryCollector,
  AgentMessage,
} from '../types.js';

// ─── Executor Options ──────────────────────────────────────────

export interface ExecutorContext {
  runId: string;
  provider: LLMProvider;
  coordinator: Coordinator;
  telemetry: TelemetryCollector;
  emitter: EventEmitter<any>;
  abortSignal?: AbortSignal;
}

export interface ExecutorResult {
  agentId: string;
  output: string | null;
  tokensUsed: number;
  cost: number;
  steps: number;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────

const DEFAULT_MAX_TOOL_CALLS = 50;
const DEFAULT_TIMEOUT_MS = 300_000; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// ─── Agent Executor ────────────────────────────────────────────

/**
 * Executes a single agent's lifecycle: sends messages to the LLM,
 * handles tool calls in a loop, and emits events for every action.
 */
export class AgentExecutor {
  /**
   * Run an agent to completion.
   * Returns when the LLM produces a final response (no more tool calls)
   * or a limit is hit.
   */
  async execute(agent: AgentConfig, ctx: ExecutorContext): Promise<ExecutorResult> {
    const { runId, provider, coordinator, emitter, telemetry, abortSignal } = ctx;
    const limits = agent.limits ?? {};
    const maxToolCalls = limits.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS;
    const timeoutMs = limits.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    let totalTokens = 0;
    let totalCost = 0;
    let step = 0;
    let output: string | null = null;

    // Set up timeout
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);

    const isAborted = () =>
      abortSignal?.aborted || timeoutController.signal.aborted;

    try {
      this.emit(emitter, telemetry, {
        id: uuid(),
        runId,
        agentId: agent.id,
        type: 'agent_start',
        data: { name: agent.name, model: agent.model },
        timestamp: new Date(),
      });

      // Build initial messages
      const messages: LLMMessage[] = [
        { role: 'system', content: agent.systemPrompt },
      ];

      // Inject any pending messages from other agents
      const pending = await coordinator.getMessages(agent.id);
      for (const msg of pending) {
        messages.push({ role: 'user', content: `[From ${msg.from}]: ${msg.content}` });
        this.emit(emitter, telemetry, {
          id: uuid(),
          runId,
          agentId: agent.id,
          type: 'message_received',
          data: msg,
          timestamp: new Date(),
        });
      }

      // If no pending messages, use a default prompt
      if (pending.length === 0) {
        messages.push({ role: 'user', content: 'Begin your task.' });
      }

      // Convert tools to LLM format
      const toolMap = this.buildToolMap(agent.tools ?? []);
      const llmTools = this.toLLMTools(agent.tools ?? []);

      // Agent loop: call LLM, handle tool calls, repeat
      let toolCallCount = 0;

      while (!isAborted()) {
        step++;

        // Check limits
        if (limits.maxTokens && totalTokens >= limits.maxTokens) {
          output = '[Limit reached: max tokens]';
          break;
        }
        if (limits.maxCost && totalCost >= limits.maxCost) {
          output = '[Limit reached: max cost]';
          break;
        }

        // Call LLM with retry
        const response = await this.callWithRetry(
          () => provider.chat(messages, llmTools),
          MAX_RETRIES,
        );

        totalTokens += response.tokensUsed.input + response.tokensUsed.output;
        totalCost += this.estimateCost(response.tokensUsed, agent.model);

        // No tool calls — we're done
        if (!response.toolCalls || response.toolCalls.length === 0) {
          output = response.content;
          this.emit(emitter, telemetry, {
            id: uuid(),
            runId,
            agentId: agent.id,
            type: 'decision',
            data: { content: response.content, finishReason: response.finishReason },
            tokens: response.tokensUsed,
            cost: this.estimateCost(response.tokensUsed, agent.model),
            timestamp: new Date(),
          });
          break;
        }

        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: response.content ?? '',
        });

        // Process each tool call
        for (const toolCall of response.toolCalls) {
          if (isAborted()) break;
          toolCallCount++;

          if (toolCallCount > maxToolCalls) {
            output = '[Limit reached: max tool calls]';
            break;
          }

          this.emit(emitter, telemetry, {
            id: uuid(),
            runId,
            agentId: agent.id,
            type: 'tool_call',
            data: { toolCallId: toolCall.id, name: toolCall.name, arguments: toolCall.arguments },
            tokens: response.tokensUsed,
            cost: this.estimateCost(response.tokensUsed, agent.model),
            timestamp: new Date(),
          });

          const result = await this.executeTool(
            toolCall,
            toolMap,
            agent,
            ctx,
          );

          this.emit(emitter, telemetry, {
            id: uuid(),
            runId,
            agentId: agent.id,
            type: 'tool_result',
            data: { toolCallId: toolCall.id, name: toolCall.name, result },
            timestamp: new Date(),
          });

          messages.push({
            role: 'tool',
            content: typeof result === 'string' ? result : JSON.stringify(result),
            toolCallId: toolCall.id,
            name: toolCall.name,
          });
        }

        if (toolCallCount > maxToolCalls) break;
      }

      this.emit(emitter, telemetry, {
        id: uuid(),
        runId,
        agentId: agent.id,
        type: 'agent_end',
        data: { output, steps: step, tokensUsed: totalTokens, cost: totalCost },
        tokens: { input: totalTokens, output: 0 },
        cost: totalCost,
        timestamp: new Date(),
      });

      return { agentId: agent.id, output, tokensUsed: totalTokens, cost: totalCost, steps: step };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      this.emit(emitter, telemetry, {
        id: uuid(),
        runId,
        agentId: agent.id,
        type: 'error',
        data: { error: errorMessage },
        timestamp: new Date(),
      });

      return {
        agentId: agent.id,
        output: null,
        tokensUsed: totalTokens,
        cost: totalCost,
        steps: step,
        error: errorMessage,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Tool execution ─────────────────────────────────────────

  private async executeTool(
    toolCall: LLMToolCall,
    toolMap: Map<string, ToolConfig>,
    agent: AgentConfig,
    ctx: ExecutorContext,
  ): Promise<unknown> {
    // Handle built-in "send_message" tool
    if (toolCall.name === 'send_message') {
      const args = JSON.parse(toolCall.arguments) as { to: string; content: string };
      const message: AgentMessage = {
        from: agent.id,
        to: args.to,
        content: args.content,
      };
      await ctx.coordinator.sendMessage(message);
      this.emit(ctx.emitter, ctx.telemetry, {
        id: uuid(),
        runId: ctx.runId,
        agentId: agent.id,
        type: 'message_sent',
        data: message,
        timestamp: new Date(),
      });
      return { sent: true };
    }

    const tool = toolMap.get(toolCall.name);
    if (!tool) {
      return { error: `Unknown tool: ${toolCall.name}` };
    }

    // Check permissions
    const perms = agent.permissions;
    if (perms?.deniedTools?.includes(toolCall.name)) {
      return { error: `Tool denied: ${toolCall.name}` };
    }
    if (perms?.allowedTools && !perms.allowedTools.includes(toolCall.name)) {
      return { error: `Tool not allowed: ${toolCall.name}` };
    }

    try {
      const params = JSON.parse(toolCall.arguments);
      // Validate with zod
      const validated = tool.parameters.parse(params);
      return await tool.execute(validated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `Tool execution failed: ${msg}` };
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  private buildToolMap(tools: ToolConfig[]): Map<string, ToolConfig> {
    const map = new Map<string, ToolConfig>();
    for (const tool of tools) {
      map.set(tool.name, tool);
    }
    return map;
  }

  private toLLMTools(tools: ToolConfig[]): LLMToolDefinition[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters._def
        ? this.zodToJsonSchema(t.parameters)
        : {},
    }));
  }

  private zodToJsonSchema(_schema: unknown): Record<string, unknown> {
    // Minimal zod-to-JSON-schema conversion.
    // In production, use zod-to-json-schema package.
    // For now, return a permissive schema; the real validation
    // happens via zod in executeTool.
    return { type: 'object' };
  }

  private estimateCost(
    tokens: { input: number; output: number },
    _model: string,
  ): number {
    // Rough estimate — providers agent will supply accurate pricing
    const inputCostPer1k = 0.003;
    const outputCostPer1k = 0.015;
    return (
      (tokens.input / 1000) * inputCostPer1k +
      (tokens.output / 1000) * outputCostPer1k
    );
  }

  private async callWithRetry<T>(
    fn: () => Promise<T>,
    retries: number,
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (i < retries) {
          await this.sleep(RETRY_DELAY_MS * (i + 1));
        }
      }
    }
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private emit(
    emitter: EventEmitter<any>,
    telemetry: TelemetryCollector,
    event: RunEvent,
  ): void {
    telemetry.record(event);
    emitter.emit(event.type, event);
    emitter.emit('*', event);
  }
}
