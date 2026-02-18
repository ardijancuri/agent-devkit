// Coordinator — Inter-Agent Messaging

import type { AgentMessage, Connection } from '../types.js';

type MessageCallback = (message: AgentMessage) => void;

export class MessageBus {
  /** runId → messages */
  private messages = new Map<string, AgentMessage[]>();
  /** runId → agentId → Set of callbacks */
  private subscribers = new Map<string, Map<string, Set<MessageCallback>>>();
  /** runId → connections (for channel-based routing) */
  private connections = new Map<string, Connection[]>();

  /** Register connections for a run (call once at run start) */
  setConnections(runId: string, connections: Connection[]): void {
    this.connections.set(runId, connections);
  }

  send(
    runId: string,
    from: string,
    to: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): void {
    const msg: AgentMessage = { from, to, content, metadata };
    this.getMessages(runId).push(msg);
    this.notify(runId, to, msg);
  }

  broadcast(
    runId: string,
    from: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): void {
    const msg: AgentMessage = { from, to: '*', content, metadata };
    this.getMessages(runId).push(msg);

    // Notify all subscribers except sender
    const runSubs = this.subscribers.get(runId);
    if (runSubs) {
      for (const [agentId, callbacks] of runSubs) {
        if (agentId !== from) {
          for (const cb of callbacks) {
            try {
              cb(msg);
            } catch {
              // Swallow subscriber errors
            }
          }
        }
      }
    }
  }

  subscribe(runId: string, agentId: string, callback: MessageCallback): () => void {
    let runSubs = this.subscribers.get(runId);
    if (!runSubs) {
      runSubs = new Map();
      this.subscribers.set(runId, runSubs);
    }
    let agentSubs = runSubs.get(agentId);
    if (!agentSubs) {
      agentSubs = new Set();
      runSubs.set(agentId, agentSubs);
    }
    agentSubs.add(callback);

    return () => {
      agentSubs!.delete(callback);
      if (agentSubs!.size === 0) runSubs!.delete(agentId);
      if (runSubs!.size === 0) this.subscribers.delete(runId);
    };
  }

  getHistory(runId: string, agentId?: string): AgentMessage[] {
    const msgs = this.messages.get(runId) ?? [];
    if (!agentId) return [...msgs];
    return msgs.filter((m) => m.from === agentId || m.to === agentId || m.to === '*');
  }

  /** Get pending (undelivered) messages for an agent */
  getPending(runId: string, agentId: string): AgentMessage[] {
    return (this.messages.get(runId) ?? []).filter(
      (m) => m.to === agentId || m.to === '*',
    );
  }

  private getMessages(runId: string): AgentMessage[] {
    let msgs = this.messages.get(runId);
    if (!msgs) {
      msgs = [];
      this.messages.set(runId, msgs);
    }
    return msgs;
  }

  private notify(runId: string, agentId: string, msg: AgentMessage): void {
    const callbacks = this.subscribers.get(runId)?.get(agentId);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(msg);
        } catch {
          // Swallow subscriber errors
        }
      }
    }
  }
}
