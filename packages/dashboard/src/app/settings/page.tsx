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
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <nav className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Profile</h2>
              <div className="grid gap-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || ''}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors w-fit">
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">API Keys</h2>
              <p className="text-sm text-gray-400">Manage API keys for programmatic access.</p>
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8 text-center">
                <Key className="mx-auto h-8 w-8 text-gray-600" />
                <p className="mt-3 text-sm text-gray-500">No API keys yet</p>
                <button className="mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors">
                  Generate Key
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <div className="space-y-4">
                {['Run completed', 'Run failed', 'Agent errors', 'Weekly summary'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3">
                    <span className="text-sm text-gray-200">{item}</span>
                    <button className="relative h-6 w-11 rounded-full bg-gray-700 transition-colors focus:outline-none">
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-gray-400 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Security</h2>
              <div className="grid gap-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">New Password</label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors w-fit">
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
