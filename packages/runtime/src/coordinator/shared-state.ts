// Coordinator — Shared Key-Value Store

export interface StateChangeRecord {
  key: string;
  value: unknown;
  agentId: string;
  timestamp: Date;
}

type WatchCallback = (key: string, value: unknown, agentId: string) => void;

export class SharedState {
  /** runId → key → value */
  private state = new Map<string, Map<string, unknown>>();
  /** runId → change history */
  private history = new Map<string, StateChangeRecord[]>();
  /** runId → key → Set of callbacks */
  private watchers = new Map<string, Map<string, Set<WatchCallback>>>();

  set(runId: string, key: string, value: unknown, agentId: string): void {
    const store = this.getStore(runId);
    store.set(key, value);

    // Record history
    const hist = this.getHistory(runId);
    hist.push({ key, value, agentId, timestamp: new Date() });

    // Notify watchers
    const keyWatchers = this.watchers.get(runId)?.get(key);
    if (keyWatchers) {
      for (const cb of keyWatchers) {
        try {
          cb(key, value, agentId);
        } catch {
          // Swallow watcher errors
        }
      }
    }
  }

  get(runId: string, key: string): unknown {
    return this.state.get(runId)?.get(key);
  }

  getAll(runId: string): Record<string, unknown> {
    const store = this.state.get(runId);
    if (!store) return {};
    const result: Record<string, unknown> = {};
    for (const [k, v] of store) {
      result[k] = v;
    }
    return result;
  }

  watch(runId: string, key: string, callback: WatchCallback): () => void {
    let runWatchers = this.watchers.get(runId);
    if (!runWatchers) {
      runWatchers = new Map();
      this.watchers.set(runId, runWatchers);
    }
    let keyWatchers = runWatchers.get(key);
    if (!keyWatchers) {
      keyWatchers = new Set();
      runWatchers.set(key, keyWatchers);
    }
    keyWatchers.add(callback);

    return () => {
      keyWatchers!.delete(callback);
      if (keyWatchers!.size === 0) runWatchers!.delete(key);
      if (runWatchers!.size === 0) this.watchers.delete(runId);
    };
  }

  delete(runId: string, key: string): void {
    this.state.get(runId)?.delete(key);
  }

  getChangeHistory(runId: string): StateChangeRecord[] {
    return [...(this.history.get(runId) ?? [])];
  }

  private getStore(runId: string): Map<string, unknown> {
    let store = this.state.get(runId);
    if (!store) {
      store = new Map();
      this.state.set(runId, store);
    }
    return store;
  }

  private getHistory(runId: string): StateChangeRecord[] {
    let hist = this.history.get(runId);
    if (!hist) {
      hist = [];
      this.history.set(runId, hist);
    }
    return hist;
  }
}
