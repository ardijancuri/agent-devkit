'use client';

import type { Project, AgentNode, Run, RunEvent, DashboardStats } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

class ApiClient {
  private token: string | null = null;
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<(data: unknown) => void>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body}`);
    }

    const json = await res.json();
    // API wraps responses in { success, data }
    return json.data !== undefined ? json.data : json;
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
    return this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.fetch('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.fetch(`/projects/${id}`);
  }

  async createProject(data: { name: string; description: string }): Promise<Project> {
    return this.fetch('/projects', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.fetch(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deleteProject(id: string): Promise<void> {
    await this.fetch(`/projects/${id}`, { method: 'DELETE' });
  }

  // Agents
  async getAgents(projectId: string): Promise<AgentNode[]> {
    return this.fetch(`/projects/${projectId}/agents`);
  }

  async createAgent(projectId: string, data: Partial<AgentNode>): Promise<AgentNode> {
    return this.fetch(`/projects/${projectId}/agents`, { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAgent(projectId: string, agentId: string, data: Partial<AgentNode>): Promise<AgentNode> {
    return this.fetch(`/projects/${projectId}/agents/${agentId}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deleteAgent(projectId: string, agentId: string): Promise<void> {
    await this.fetch(`/projects/${projectId}/agents/${agentId}`, { method: 'DELETE' });
  }

  // Runs
  async getRuns(projectId?: string): Promise<Run[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.fetch(`/runs${query}`);
  }

  async getRun(id: string): Promise<Run> {
    return this.fetch(`/runs/${id}`);
  }

  async triggerRun(projectId: string, input?: Record<string, unknown>): Promise<Run> {
    return this.fetch('/runs', { method: 'POST', body: JSON.stringify({ projectId, input }) });
  }

  async cancelRun(id: string): Promise<void> {
    await this.fetch(`/runs/${id}/cancel`, { method: 'POST' });
  }

  async getRunEvents(runId: string): Promise<RunEvent[]> {
    return this.fetch(`/runs/${runId}/events`);
  }

  // Stats
  async getStats(): Promise<DashboardStats> {
    return this.fetch('/stats');
  }

  // WebSocket
  connectWs() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws';
    this.ws = new WebSocket(this.token ? `${wsUrl}?token=${this.token}` : wsUrl);

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const handlers = this.subscribers.get(msg.type);
        if (handlers) {
          handlers.forEach((fn) => fn(msg.data));
        }
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connectWs(), 3000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  subscribe(event: string, handler: (data: unknown) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(handler);

    return () => {
      this.subscribers.get(event)?.delete(handler);
    };
  }

  disconnectWs() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

export const api = new ApiClient();
