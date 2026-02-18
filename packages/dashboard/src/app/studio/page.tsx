'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, Clock, Bot, X } from 'lucide-react';
import type { Project } from '@/lib/types';

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Content Pipeline',
    description: 'Multi-agent content generation and review pipeline',
    agentCount: 4,
    lastRunAt: '2026-02-17T15:30:00Z',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-17T15:30:00Z',
  },
  {
    id: '2',
    name: 'Code Review Swarm',
    description: 'Autonomous code review with specialist agents',
    agentCount: 6,
    lastRunAt: '2026-02-16T09:00:00Z',
    createdAt: '2026-02-12T08:00:00Z',
    updatedAt: '2026-02-16T09:00:00Z',
  },
  {
    id: '3',
    name: 'Research Assistant',
    description: 'Orchestrator with research and synthesis workers',
    agentCount: 3,
    lastRunAt: null,
    createdAt: '2026-02-18T01:00:00Z',
    updatedAt: '2026-02-18T01:00:00Z',
  },
];

function statusColor(project: Project) {
  if (!project.lastRunAt) return 'bg-gray-500';
  const age = Date.now() - new Date(project.lastRunAt).getTime();
  if (age < 86400000) return 'bg-green-500';
  if (age < 604800000) return 'bg-yellow-500';
  return 'bg-gray-500';
}

function timeAgo(date: string | null) {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function StudioPage() {
  const [projects] = useState<Project[]>(mockProjects);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    // TODO: API call to create project
    setShowModal(false);
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Agent Studio</h1>
            <p className="text-gray-400 mt-1">Design and configure multi-agent systems</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/studio/${project.id}`}
              className="group block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${statusColor(project)}`} />
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  {project.agentCount} agents
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(project.lastRunAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="My Agent System"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="What does this system do?"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
