export const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  running: 'text-blue-400 bg-blue-400/10',
  completed: 'text-emerald-400 bg-emerald-400/10',
  failed: 'text-red-400 bg-red-400/10',
  cancelled: 'text-gray-400 bg-gray-400/10',
  idle: 'text-gray-400 bg-gray-400/10',
  error: 'text-red-400 bg-red-400/10',
};

export const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-400',
  running: 'bg-blue-400',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
  cancelled: 'bg-gray-400',
};

export const MODEL_NAMES: Record<string, string> = {
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-opus-4-20250514': 'Claude Opus 4',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
};

export const CHANNEL_TYPES = [
  { value: 'direct', label: 'Direct Message' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'queue', label: 'Task Queue' },
] as const;

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Studio', href: '/studio', icon: 'PenTool' },
  { label: 'Runs', href: '/runs', icon: 'Play' },
  { label: 'Monitor', href: '/monitor', icon: 'Activity' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;
