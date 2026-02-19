'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Save, User, Key, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gh-fg">Settings</h1>
        <p className="mt-1 text-sm text-gh-fg-muted">Manage your account and preferences</p>
      </div>

      {/* Mobile tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gh-btn text-gh-fg'
                : 'text-gh-fg-muted hover:bg-gh-btn/50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Desktop tabs */}
        <nav className="hidden md:block w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gh-btn text-gh-fg'
                  : 'text-gh-fg-muted hover:bg-gh-btn/50 hover:text-gh-fg'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-gh-border bg-gh-subtle p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gh-fg">Profile</h2>
              <div className="grid gap-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gh-fg-muted mb-1.5">Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || ''}
                    className="w-full rounded-lg border border-gh-border bg-gh-btn px-3 py-2 text-sm text-gh-fg placeholder-gh-fg-subtle focus:border-gh-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gh-fg-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full rounded-lg border border-gh-border bg-gh-btn px-3 py-2 text-sm text-gh-fg placeholder-gh-fg-subtle focus:border-gh-accent focus:outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-gh-accent-emphasis hover:bg-gh-accent px-4 py-2 text-sm font-medium text-gh-fg transition-colors w-fit">
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gh-fg">API Keys</h2>
              <p className="text-sm text-gh-fg-muted">Manage API keys for programmatic access.</p>
              <div className="rounded-lg border border-gh-border bg-gh-btn/50 p-8 text-center">
                <Key className="mx-auto h-8 w-8 text-gh-fg-subtle" />
                <p className="mt-3 text-sm text-gh-fg-subtle">No API keys yet</p>
                <button className="mt-4 rounded-lg bg-gh-accent-emphasis hover:bg-gh-accent px-4 py-2 text-sm font-medium text-gh-fg transition-colors">
                  Generate Key
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gh-fg">Notifications</h2>
              <div className="space-y-4">
                {['Run completed', 'Run failed', 'Agent errors', 'Weekly summary'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg bg-gh-btn/50 px-4 py-3">
                    <span className="text-sm text-gh-fg">{item}</span>
                    <button className="relative h-6 w-11 rounded-full bg-gh-btn-hover transition-colors focus:outline-none">
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-gh-fg-muted transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gh-fg">Security</h2>
              <div className="grid gap-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gh-fg-muted mb-1.5">Current Password</label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-gh-border bg-gh-btn px-3 py-2 text-sm text-gh-fg placeholder-gh-fg-subtle focus:border-gh-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gh-fg-muted mb-1.5">New Password</label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-gh-border bg-gh-btn px-3 py-2 text-sm text-gh-fg placeholder-gh-fg-subtle focus:border-gh-accent focus:outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-gh-accent-emphasis hover:bg-gh-accent px-4 py-2 text-sm font-medium text-gh-fg transition-colors w-fit">
                  <Shield className="h-4 w-4" /> Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
