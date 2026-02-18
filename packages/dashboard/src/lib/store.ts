'use client';

import { create } from 'zustand';
import type { Project, AgentNode, AgentConnection, Run, RunEvent } from './types';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  agents: AgentNode[];
  connections: AgentConnection[];
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setAgents: (agents: AgentNode[]) => void;
  setConnections: (connections: AgentConnection[]) => void;
  updateAgent: (id: string, data: Partial<AgentNode>) => void;
  addAgent: (agent: AgentNode) => void;
  removeAgent: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  agents: [],
  connections: [],
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setAgents: (agents) => set({ agents }),
  setConnections: (connections) => set({ connections }),
  updateAgent: (id, data) =>
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
}));

interface RunStore {
  runs: Run[];
  activeRun: Run | null;
  events: RunEvent[];
  setRuns: (runs: Run[]) => void;
  setActiveRun: (run: Run | null) => void;
  addEvent: (event: RunEvent) => void;
  setEvents: (events: RunEvent[]) => void;
  updateRun: (id: string, data: Partial<Run>) => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runs: [],
  activeRun: null,
  events: [],
  setRuns: (runs) => set({ runs }),
  setActiveRun: (activeRun) => set({ activeRun }),
  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  setEvents: (events) => set({ events }),
  updateRun: (id, data) =>
    set((s) => ({
      runs: s.runs.map((r) => (r.id === id ? { ...r, ...data } : r)),
      activeRun: s.activeRun?.id === id ? { ...s.activeRun, ...data } : s.activeRun,
    })),
}));

interface UIStore {
  sidebarOpen: boolean;
  selectedAgentId: string | null;
  modal: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedAgent: (id: string | null) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  selectedAgentId: null,
  modal: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSelectedAgent: (selectedAgentId) => set({ selectedAgentId }),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}));
