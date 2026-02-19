'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Bot } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#0969da' }}>
            <Bot className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gh-fg">AgentDevKit</h1>
          <p className="mt-1 text-sm text-gh-fg-muted">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gh-fg-muted mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gh-border bg-gh-btn px-3.5 py-2.5 text-sm text-gh-fg placeholder-gh-fg-subtle focus:border-gh-accent focus:outline-none focus:ring-1 focus:ring-gh-accent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gh-fg-muted mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gh-border bg-gh-btn px-3.5 py-2.5 text-sm text-gh-fg placeholder-gh-fg-subtle focus:border-gh-accent focus:outline-none focus:ring-1 focus:ring-gh-accent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gh-accent-emphasis px-4 py-2.5 text-sm font-medium text-white hover:bg-gh-accent focus:outline-none focus:ring-2 focus:ring-gh-accent focus:ring-offset-2 focus:ring-offset-gh-canvas disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
