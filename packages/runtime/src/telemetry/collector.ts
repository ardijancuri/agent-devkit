import type { RunEvent, TelemetryCollector as ITelemetryCollector } from '../types.js';
import { calculateCost } from './cost-calculator.js';

export interface TimelineEntry {
  event: RunEvent;
  durationMs: number | null;
}

export interface TokenUsageSummary {
  input: number;
  output: number;
  total: number;
  cost: number;
}

export interface CostBreakdown {
  byAgent: Record<string, number>;
  byModel: Record<string, number>;
  total: number;
}

export type EventSubscriber = (event: RunEvent) => void;
export type PersistenceCallback = (events: RunEvent[]) => Promise<void>;

export class TelemetryCollector implements ITelemetryCollector {
  private events: RunEvent[] = [];
  private subscribers = new Set<EventSubscriber>();
  private persistFn?: PersistenceCallback;

  constructor(options?: { persist?: PersistenceCallback }) {
    this.persistFn = options?.persist;
  }

  record(event: RunEvent): void {
    // Auto-calculate cost if tokens present but cost missing
    if (event.tokens && event.cost === undefined) {
      const model = (event.data as { model?: string })?.model ?? '';
      event.cost = calculateCost(model, event.tokens.input, event.tokens.output);
    }
    this.events.push(event);
    for (const sub of this.subscribers) {
      try { sub(event); } catch { /* subscriber errors don't propagate */ }
    }
  }

  async flush(): Promise<void> {
    if (this.persistFn && this.events.length > 0) {
      await this.persistFn([...this.events]);
    }
  }

  getEvents(runId: string, filters?: { agentId?: string; type?: string }): RunEvent[] {
    return this.events.filter((e) => {
      if (e.runId !== runId) return false;
      if (filters?.agentId && e.agentId !== filters.agentId) return false;
      if (filters?.type && e.type !== filters.type) return false;
      return true;
    });
  }

  getTimeline(runId: string): TimelineEntry[] {
    const runEvents = this.getEvents(runId).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    return runEvents.map((event, i) => {
      const next = runEvents[i + 1];
      const durationMs = next ? next.timestamp.getTime() - event.timestamp.getTime() : null;
      return { event, durationMs };
    });
  }

  getTokenUsage(runId: string, agentId?: string): TokenUsageSummary {
    const events = agentId
      ? this.getEvents(runId, { agentId })
      : this.getEvents(runId);

    let input = 0;
    let output = 0;
    let cost = 0;
    for (const e of events) {
      if (e.tokens) {
        input += e.tokens.input;
        output += e.tokens.output;
      }
      if (e.cost) cost += e.cost;
    }
    return { input, output, total: input + output, cost };
  }

  getCostBreakdown(runId: string): CostBreakdown {
    const events = this.getEvents(runId);
    const byAgent: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    let total = 0;

    for (const e of events) {
      const c = e.cost ?? 0;
      if (c === 0) continue;
      total += c;
      byAgent[e.agentId] = (byAgent[e.agentId] ?? 0) + c;
      const model = (e.data as { model?: string })?.model ?? 'unknown';
      byModel[model] = (byModel[model] ?? 0) + c;
    }

    return { byAgent, byModel, total };
  }

  subscribe(callback: EventSubscriber): () => void {
    this.subscribers.add(callback);
    return () => { this.subscribers.delete(callback); };
  }

  export(runId: string, format: 'json' | 'csv'): string {
    const events = this.getEvents(runId);
    if (format === 'json') return JSON.stringify(events, null, 2);

    const headers = 'id,runId,agentId,type,timestamp,inputTokens,outputTokens,cost';
    const rows = events.map((e) =>
      [
        e.id, e.runId, e.agentId, e.type,
        e.timestamp.toISOString(),
        e.tokens?.input ?? '', e.tokens?.output ?? '',
        e.cost ?? '',
      ].join(','),
    );
    return [headers, ...rows].join('\n');
  }
}
