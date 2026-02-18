import type { RunConfig, Connection, AgentConfig } from '../types.js';

// ─── Execution Plan ────────────────────────────────────────────

export interface ExecutionStep {
  /** Agents to execute in parallel within this step */
  agentIds: string[];
}

export interface ExecutionPlan {
  /** Ordered steps; agents within a step run concurrently */
  steps: ExecutionStep[];
  /** Detected execution pattern */
  pattern: 'parallel' | 'sequential' | 'orchestrator' | 'mixed';
}

// ─── Scheduler ─────────────────────────────────────────────────

/**
 * Analyzes a RunConfig and produces an ExecutionPlan that respects
 * dependency ordering while maximizing concurrency.
 */
export class Scheduler {
  /**
   * Build an execution plan from the run configuration.
   * Uses topological sort over the connection graph.
   */
  plan(config: RunConfig): ExecutionPlan {
    const agentIds = config.agents.map((a) => a.id);
    const inbound = this.buildInboundMap(agentIds, config.connections);
    const outbound = this.buildOutboundMap(agentIds, config.connections);

    const steps = this.topologicalLayers(agentIds, inbound, outbound);
    const pattern = this.detectPattern(config.agents, config.connections, steps);

    return { steps, pattern };
  }

  // ── Graph helpers ──────────────────────────────────────────

  private buildInboundMap(
    agentIds: string[],
    connections: Connection[],
  ): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const id of agentIds) {
      map.set(id, new Set());
    }
    for (const conn of connections) {
      map.get(conn.targetId)?.add(conn.sourceId);
    }
    return map;
  }

  private buildOutboundMap(
    agentIds: string[],
    connections: Connection[],
  ): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const id of agentIds) {
      map.set(id, new Set());
    }
    for (const conn of connections) {
      map.get(conn.sourceId)?.add(conn.targetId);
    }
    return map;
  }

  /**
   * Kahn's algorithm producing layers — each layer is a set of agents
   * whose dependencies are satisfied by previous layers.
   */
  private topologicalLayers(
    agentIds: string[],
    inbound: Map<string, Set<string>>,
    _outbound: Map<string, Set<string>>,
  ): ExecutionStep[] {
    // Clone inbound counts
    const inDegree = new Map<string, number>();
    for (const id of agentIds) {
      inDegree.set(id, inbound.get(id)?.size ?? 0);
    }

    const steps: ExecutionStep[] = [];
    const remaining = new Set(agentIds);

    while (remaining.size > 0) {
      // Collect all nodes with in-degree 0
      const ready: string[] = [];
      for (const id of remaining) {
        if ((inDegree.get(id) ?? 0) === 0) {
          ready.push(id);
        }
      }

      if (ready.length === 0) {
        // Cycle detected — break by scheduling all remaining
        steps.push({ agentIds: [...remaining] });
        break;
      }

      steps.push({ agentIds: ready });

      // Remove these nodes and update in-degrees
      for (const id of ready) {
        remaining.delete(id);
        const targets = _outbound.get(id);
        if (targets) {
          for (const target of targets) {
            inDegree.set(target, (inDegree.get(target) ?? 1) - 1);
          }
        }
      }
    }

    return steps;
  }

  // ── Pattern detection ──────────────────────────────────────

  private detectPattern(
    agents: AgentConfig[],
    connections: Connection[],
    steps: ExecutionStep[],
  ): ExecutionPlan['pattern'] {
    if (connections.length === 0) {
      return 'parallel';
    }

    // Sequential: every step has exactly one agent
    if (steps.every((s) => s.agentIds.length === 1)) {
      return 'sequential';
    }

    // Orchestrator: one agent connects to all others
    const agentIds = new Set(agents.map((a) => a.id));
    for (const agent of agents) {
      const targets = connections
        .filter((c) => c.sourceId === agent.id)
        .map((c) => c.targetId);
      const otherCount = agentIds.size - 1;
      if (targets.length >= otherCount && otherCount > 1) {
        return 'orchestrator';
      }
    }

    return 'mixed';
  }
}
