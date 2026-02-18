// Coordinator — Task Queue

export type TaskStatus = 'pending' | 'claimed' | 'completed' | 'failed';

export interface Task {
  id: string;
  description: string;
  assignedTo?: string;
  priority?: number;
  status: TaskStatus;
  claimedBy?: string;
  result?: unknown;
  error?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskQueueStatus {
  total: number;
  pending: number;
  claimed: number;
  completed: number;
  failed: number;
  tasks: Task[];
}

export class TaskQueue {
  /** runId → tasks */
  private queues = new Map<string, Task[]>();

  enqueue(
    runId: string,
    task: { id: string; description: string; assignedTo?: string; priority?: number },
  ): void {
    const tasks = this.getQueue(runId);
    if (tasks.some((t) => t.id === task.id)) {
      throw new Error(`Task ${task.id} already exists in run ${runId}`);
    }
    const now = new Date();
    tasks.push({
      ...task,
      priority: task.priority ?? 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    // Sort by priority descending (higher = first)
    tasks.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  claim(runId: string, agentId: string): Task | null {
    const tasks = this.getQueue(runId);
    const task = tasks.find(
      (t) => t.status === 'pending' && (!t.assignedTo || t.assignedTo === agentId),
    );
    if (!task) return null;
    task.status = 'claimed';
    task.claimedBy = agentId;
    task.updatedAt = new Date();
    return { ...task };
  }

  complete(runId: string, taskId: string, result?: unknown): void {
    const task = this.findTask(runId, taskId);
    if (task.status !== 'claimed') {
      throw new Error(`Task ${taskId} is not claimed (status: ${task.status})`);
    }
    task.status = 'completed';
    task.result = result;
    task.updatedAt = new Date();
  }

  fail(runId: string, taskId: string, error?: unknown): void {
    const task = this.findTask(runId, taskId);
    if (task.status !== 'claimed') {
      throw new Error(`Task ${taskId} is not claimed (status: ${task.status})`);
    }
    task.status = 'failed';
    task.error = error;
    task.updatedAt = new Date();
  }

  getStatus(runId: string): TaskQueueStatus {
    const tasks = this.queues.get(runId) ?? [];
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      claimed: tasks.filter((t) => t.status === 'claimed').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
      tasks: tasks.map((t) => ({ ...t })),
    };
  }

  private getQueue(runId: string): Task[] {
    let tasks = this.queues.get(runId);
    if (!tasks) {
      tasks = [];
      this.queues.set(runId, tasks);
    }
    return tasks;
  }

  private findTask(runId: string, taskId: string): Task {
    const tasks = this.queues.get(runId);
    if (!tasks) throw new Error(`No queue for run ${runId}`);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found in run ${runId}`);
    return task;
  }
}
