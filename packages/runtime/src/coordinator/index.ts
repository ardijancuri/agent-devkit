// Coordinator — Facade wrapping all coordination subsystems

import type { AgentMessage, Connection, Coordinator as ICoordinator } from '../types.js';
import { LockManager, type LockManagerOptions } from './lock-manager.js';
import { TaskQueue, type Task, type TaskStatus, type TaskQueueStatus } from './task-queue.js';
import { SharedState, type StateChangeRecord } from './shared-state.js';
import { MessageBus } from './message-bus.js';

export interface CoordinatorOptions {
  lockManager?: LockManagerOptions;
}

/**
 * Coordinator wraps file locking, task queue, shared state, and message bus
 * into a single API scoped per run.
 */
export class Coordinator implements ICoordinator {
  readonly locks: LockManager;
  readonly tasks: TaskQueue;
  readonly state: SharedState;
  readonly bus: MessageBus;

  private runId: string;

  constructor(runId: string, options: CoordinatorOptions = {}) {
    this.runId = runId;
    this.locks = new LockManager(options.lockManager);
    this.tasks = new TaskQueue();
    this.state = new SharedState();
    this.bus = new MessageBus();
  }

  /** Set communication topology */
  setConnections(connections: Connection[]): void {
    this.bus.setConnections(this.runId, connections);
  }

  // ── ICoordinator interface ──────────────────────────────────

  async sendMessage(message: AgentMessage): Promise<void> {
    if (message.to === '*') {
      this.bus.broadcast(this.runId, message.from, message.content, message.metadata);
    } else {
      this.bus.send(this.runId, message.from, message.to, message.content, message.metadata);
    }
  }

  async getMessages(agentId: string): Promise<AgentMessage[]> {
    return this.bus.getPending(this.runId, agentId);
  }

  async setState(key: string, value: unknown, agentId: string): Promise<void> {
    this.state.set(this.runId, key, value, agentId);
  }

  async getState(key: string): Promise<unknown> {
    return this.state.get(this.runId, key);
  }

  async acquireLock(resource: string, agentId: string): Promise<boolean> {
    return this.locks.acquire(this.runId, resource, agentId);
  }

  async releaseLock(resource: string, agentId: string): Promise<void> {
    this.locks.release(this.runId, resource, agentId);
  }

  /** Clean up all timers and resources */
  dispose(): void {
    this.locks.dispose();
  }
}

// Re-export everything
export { LockManager, type LockManagerOptions } from './lock-manager.js';
export { TaskQueue, type Task, type TaskStatus, type TaskQueueStatus } from './task-queue.js';
export { SharedState, type StateChangeRecord } from './shared-state.js';
export { MessageBus } from './message-bus.js';
