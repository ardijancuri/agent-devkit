import chalk from 'chalk';
import type { RunEvent, RunResult, AgentStatus } from '@agent-devkit/runtime';

// ─── Color Scheme ──────────────────────────────────────────────

export const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  muted: chalk.gray,
  agent: chalk.cyan,
  cost: chalk.magenta,
  token: chalk.white,
  header: chalk.bold.white,
} as const;

// ─── Event Formatting ──────────────────────────────────────────

export function formatEvent(event: RunEvent): string {
  const ts = colors.muted(formatTimestamp(event.timestamp));
  const agent = colors.agent(`[${event.agentId}]`);
  const tokens = event.tokens
    ? colors.muted(` (${event.tokens.input + event.tokens.output} tok)`)
    : '';
  const cost = event.cost ? colors.cost(` $${event.cost.toFixed(4)}`) : '';

  switch (event.type) {
    case 'agent_start':
      return `${ts} ${agent} ${colors.info('▶ Started')}`;
    case 'agent_end':
      return `${ts} ${agent} ${colors.success('■ Completed')}${tokens}${cost}`;
    case 'tool_call':
      return `${ts} ${agent} ${colors.warning('⚡ Tool call:')} ${formatData(event.data)}`;
    case 'tool_result':
      return `${ts} ${agent} ${colors.info('← Tool result:')} ${formatData(event.data)}`;
    case 'message_sent':
      return `${ts} ${agent} ${colors.info('✉ Message sent:')} ${formatData(event.data)}`;
    case 'message_received':
      return `${ts} ${agent} ${colors.info('📨 Message received:')} ${formatData(event.data)}`;
    case 'decision':
      return `${ts} ${agent} ${colors.info('💭 Decision:')} ${formatData(event.data)}`;
    case 'error':
      return `${ts} ${agent} ${colors.error('✖ Error:')} ${formatData(event.data)}`;
    default:
      return `${ts} ${agent} ${event.type}: ${formatData(event.data)}`;
  }
}

function formatData(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data === null || data === undefined) return '';
  const str = JSON.stringify(data, null, 0);
  return str.length > 120 ? str.slice(0, 117) + '...' : str;
}

function formatTimestamp(ts: Date): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toISOString().replace('T', ' ').slice(11, 23);
}

// ─── Progress Bar ──────────────────────────────────────────────

export function progressBar(current: number, total: number, width = 20): string {
  const pct = total > 0 ? Math.min(current / total, 1) : 0;
  const filled = Math.round(pct * width);
  const empty = width - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${(pct * 100).toFixed(0)}%`;
}

// ─── Agent Status Table ────────────────────────────────────────

export function formatAgentStatusTable(agents: AgentStatus[]): string {
  const lines: string[] = [];
  const header = `  ${pad('Agent', 20)} ${pad('Status', 12)} ${pad('Tokens', 10)} ${pad('Cost', 10)}`;
  lines.push(colors.header(header));
  lines.push(colors.muted('  ' + '─'.repeat(54)));

  for (const a of agents) {
    const statusColor =
      a.status === 'completed' ? colors.success :
      a.status === 'failed' ? colors.error :
      a.status === 'running' ? colors.info :
      colors.muted;

    lines.push(
      `  ${colors.agent(pad(a.agentId, 20))} ${statusColor(pad(a.status, 12))} ${pad(String(a.tokensUsed), 10)} ${colors.cost(pad(`$${a.cost.toFixed(4)}`, 10))}`
    );
  }
  return lines.join('\n');
}

// ─── Run Summary ───────────────────────────────────────────────

export function formatRunSummary(result: RunResult): string {
  const statusColor = result.status === 'completed' ? colors.success : colors.error;
  const lines = [
    '',
    colors.header('═══ Run Summary ═══'),
    `  Run ID:    ${colors.muted(result.runId)}`,
    `  Status:    ${statusColor(result.status)}`,
    `  Duration:  ${colors.info(formatDuration(result.durationMs))}`,
    `  Tokens:    ${colors.token(String(result.totalTokens))}`,
    `  Cost:      ${colors.cost(`$${result.totalCost.toFixed(4)}`)}`,
    '',
  ];
  return lines.join('\n');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = ((ms % 60_000) / 1000).toFixed(0);
  return `${m}m ${s}s`;
}

function pad(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}
