// Coordinator — File/Resource Locking

interface LockEntry {
  agentId: string;
  acquiredAt: number;
  timer: ReturnType<typeof setTimeout>;
}

export interface LockManagerOptions {
  /** Auto-release timeout in ms (default: 5 minutes) */
  lockTimeoutMs?: number;
}

export class LockManager {
  /** runId → resource → LockEntry */
  private locks = new Map<string, Map<string, LockEntry>>();
  private lockTimeoutMs: number;

  constructor(options: LockManagerOptions = {}) {
    this.lockTimeoutMs = options.lockTimeoutMs ?? 5 * 60 * 1000;
  }

  async acquire(runId: string, resource: string, agentId: string): Promise<boolean> {
    const runLocks = this.getRunLocks(runId);
    const existing = runLocks.get(resource);

    if (existing) {
      // Already held by same agent — refresh
      if (existing.agentId === agentId) {
        clearTimeout(existing.timer);
        existing.acquiredAt = Date.now();
        existing.timer = this.createTimer(runId, resource);
        return true;
      }
      return false;
    }

    runLocks.set(resource, {
      agentId,
      acquiredAt: Date.now(),
      timer: this.createTimer(runId, resource),
    });
    return true;
  }

  release(runId: string, resource: string, agentId: string): void {
    const runLocks = this.locks.get(runId);
    if (!runLocks) return;
    const entry = runLocks.get(resource);
    if (entry && entry.agentId === agentId) {
      clearTimeout(entry.timer);
      runLocks.delete(resource);
      if (runLocks.size === 0) this.locks.delete(runId);
    }
  }

  isLocked(runId: string, resource: string): { locked: boolean; by?: string } {
    const entry = this.locks.get(runId)?.get(resource);
    if (!entry) return { locked: false };
    return { locked: true, by: entry.agentId };
  }

  releaseAll(runId: string, agentId: string): void {
    const runLocks = this.locks.get(runId);
    if (!runLocks) return;
    for (const [resource, entry] of runLocks) {
      if (entry.agentId === agentId) {
        clearTimeout(entry.timer);
        runLocks.delete(resource);
      }
    }
    if (runLocks.size === 0) this.locks.delete(runId);
  }

  /** Clean up all timers (call on shutdown) */
  dispose(): void {
    for (const runLocks of this.locks.values()) {
      for (const entry of runLocks.values()) {
        clearTimeout(entry.timer);
      }
    }
    this.locks.clear();
  }

  private getRunLocks(runId: string): Map<string, LockEntry> {
    let runLocks = this.locks.get(runId);
    if (!runLocks) {
      runLocks = new Map();
      this.locks.set(runId, runLocks);
    }
    return runLocks;
  }

  private createTimer(runId: string, resource: string): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      const runLocks = this.locks.get(runId);
      if (runLocks) {
        runLocks.delete(resource);
        if (runLocks.size === 0) this.locks.delete(runId);
      }
    }, this.lockTimeoutMs);
  }
}
