import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'eventemitter3';
import type {
  RunConfig,
  RunEvent,
  RunEventType,
  RunResult,
  RunStatus,
  RunStatusValue,
  AgentStatus,
  AgentStatusValue,
  LLMProvider,
  Coordinator,
  TelemetryCollector,
} from '../types.js';
import { Scheduler } from './scheduler.js';
import { AgentExecutor, type ExecutorResult } from './executor.js';

// ─── Runtime Events ────────────────────────────────────────────

export interface RuntimeEvents {
  '*': (event: RunEvent) => void;
  agent_start: (event: RunEvent) => void;
  agent_end: (event: RunEvent) => void;
  tool_call: (event: RunEvent) => void;
  tool_result: (event: RunEvent) => void;
  message_sent: (event: RunEvent) => void;
  message_received: (event: RunEvent) => void;
  decision: (event: RunEvent) => void;
  error: (event: RunEvent) => void;
}

// ─── Runtime Options ───────────────────────────────────────────

export interface RuntimeOptions {
  /** LLM provider (or map of model prefix → provider) */
  provider: LLMProvider | Record<string, LLMProvider>;
  /** Coordinator for inter-agent communication */
  coordinator: Coordinator;
  /** Telemetry collector */
  telemetry: TelemetryCollector;
}

// ─── Active Run Tracking ───────────────────────────────────────

interface ActiveRun {
  runId: string;
  config: RunConfig;
  status: RunStatusValue;
  agentStatuses: Map<string, AgentStatus>;
  events: RunEvent[];
  abortController: AbortController;
  startedAt: Date;
  completedAt?: Date;
  totalTokens: number;
  totalCost: number;
}

// ─── Runtime ───────────────────────────────────────────────────

/**
 * The main Runtime class — public API for executing multi-agent systems.
 */
export class Runtime {
  private readonly emitter = new EventEmitter<RuntimeEvents>();
  private readonly scheduler = new Scheduler();
  private readonly executor = new AgentExecutor();
  private readonly runs = new Map<string, ActiveRun>();
  private readonly options: RuntimeOptions;

  constructor(options: RuntimeOptions) {
    this.options = options;
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Execute a multi-agent run.
   */
  async run(config: RunConfig): Promise<RunResult> {
    const runId = uuid();
    const startedAt = new Date();

    // Initialize agent statuses
    const agentStatuses = new Map<string, AgentStatus>();
    for (const agent of config.agents) {
      agentStatuses.set(agent.id, {
        agentId: agent.id,
        status: 'pending',
        currentStep: 0,
        tokensUsed: 0,
        cost: 0,
      });
    }

    const activeRun: ActiveRun = {
      runId,
      config,
      status: 'running',
      agentStatuses,
      events: [],
      abortController: new AbortController(),
      startedAt,
      totalTokens: 0,
      totalCost: 0,
    };

    this.runs.set(runId, activeRun);

    // Collect events
    const eventHandler = (event: RunEvent) => {
      activeRun.events.push(event);
    };
    this.emitter.on('*', eventHandler);

    try {
      // Initialize shared state
      if (config.sharedState) {
        for (const [key, value] of Object.entries(config.sharedState)) {
          await this.options.coordinator.setState(key, value, '__runtime__');
        }
      }

      // Plan execution
      const plan = this.scheduler.plan(config);

      // Execute step by step
      const agentMap = new Map(config.agents.map((a) => [a.id, a]));
      const results: ExecutorResult[] = [];

      for (const step of plan.steps) {
        if (activeRun.abortController.signal.aborted) {
          activeRun.status = 'cancelled';
          break;
        }

        // Run all agents in this step concurrently
        const stepPromises = step.agentIds.map(async (agentId) => {
          const agent = agentMap.get(agentId);
          if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
          }

          // Update status
          const agentStatus = agentStatuses.get(agentId)!;
          agentStatus.status = 'running';

          const provider = this.resolveProvider(agent.model);
          const result = await this.executor.execute(agent, {
            runId,
            provider,
            coordinator: this.options.coordinator,
            telemetry: this.options.telemetry,
            emitter: this.emitter,
            abortSignal: activeRun.abortController.signal,
          });

          // Update status
          agentStatus.status = result.error ? 'failed' : 'completed';
          agentStatus.tokensUsed = result.tokensUsed;
          agentStatus.cost = result.cost;
          agentStatus.currentStep = result.steps;

          activeRun.totalTokens += result.tokensUsed;
          activeRun.totalCost += result.cost;

          return result;
        });

        // Apply global timeout
        const stepResults = config.timeout
          ? await this.withTimeout(Promise.all(stepPromises), config.timeout)
          : await Promise.all(stepPromises);

        results.push(...stepResults);

        // Check global cost limit
        if (config.maxCost && activeRun.totalCost >= config.maxCost) {
          activeRun.status = 'completed';
          break;
        }

        // If any agent failed, stop the run
        if (results.some((r) => r.error)) {
          activeRun.status = 'failed';
          break;
        }
      }

      if (activeRun.status === 'running') {
        activeRun.status = 'completed';
      }

      activeRun.completedAt = new Date();

      // Build result — use last non-null output
      const lastOutput = [...results].reverse().find((r) => r.output)?.output ?? null;

      return {
        runId,
        status: activeRun.status,
        output: lastOutput,
        events: activeRun.events,
        totalTokens: activeRun.totalTokens,
        totalCost: activeRun.totalCost,
        durationMs: activeRun.completedAt.getTime() - startedAt.getTime(),
      };
    } catch (err) {
      activeRun.status = 'failed';
      activeRun.completedAt = new Date();

      return {
        runId,
        status: 'failed',
        output: null,
        events: activeRun.events,
        totalTokens: activeRun.totalTokens,
        totalCost: activeRun.totalCost,
        durationMs: (activeRun.completedAt?.getTime() ?? Date.now()) - startedAt.getTime(),
      };
    } finally {
      this.emitter.off('*', eventHandler);
      await this.options.telemetry.flush();
    }
  }

  /**
   * Cancel a running run.
   */
  stop(runId: string): void {
    const activeRun = this.runs.get(runId);
    if (!activeRun) {
      throw new Error(`Run not found: ${runId}`);
    }
    activeRun.abortController.abort();
    activeRun.status = 'cancelled';
    activeRun.completedAt = new Date();
  }

  /**
   * Get the current status of a run.
   */
  getStatus(runId: string): RunStatus {
    const activeRun = this.runs.get(runId);
    if (!activeRun) {
      throw new Error(`Run not found: ${runId}`);
    }
    return {
      runId: activeRun.runId,
      status: activeRun.status,
      agents: [...activeRun.agentStatuses.values()],
      totalTokens: activeRun.totalTokens,
      totalCost: activeRun.totalCost,
      startedAt: activeRun.startedAt,
      completedAt: activeRun.completedAt,
    };
  }

  /**
   * Subscribe to runtime events.
   */
  on<K extends keyof RuntimeEvents>(event: K, handler: RuntimeEvents[K]): void {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
  }

  /**
   * Unsubscribe from runtime events.
   */
  off<K extends keyof RuntimeEvents>(event: K, handler: RuntimeEvents[K]): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
  }

  // ── Private helpers ────────────────────────────────────────

  private resolveProvider(model: string): LLMProvider {
    const { provider } = this.options;

    // Single provider
    if (this.isLLMProvider(provider)) {
      return provider;
    }

    // Provider map — match by prefix
    const providerMap = provider as Record<string, LLMProvider>;
    for (const [prefix, p] of Object.entries(providerMap)) {
      if (model.startsWith(prefix)) {
        return p;
      }
    }

    // Fallback to first provider
    const providers = Object.values(providerMap);
    if (providers.length > 0) {
      return providers[0];
    }

    throw new Error(`No provider found for model: ${model}`);
  }

  private isLLMProvider(obj: unknown): obj is LLMProvider {
    return typeof obj === 'object' && obj !== null && 'chat' in obj && typeof (obj as LLMProvider).chat === 'function';
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Run timed out after ${ms}ms`)),
        ms,
      );
      promise.then(
        (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  }
}
