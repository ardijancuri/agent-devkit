import { Command } from 'commander';
import chalk from 'chalk';
import type { RunEvent, RunEventType } from '@agent-devkit/runtime';
import { formatEvent, colors } from '../formatter.js';

// In-memory event store (in a real implementation, this would read from a persistent store)
// For now, logs command demonstrates the interface
const eventStore: Map<string, RunEvent[]> = new Map();

/** Register events for a run (called by the run command or runtime) */
export function storeEvents(runId: string, events: RunEvent[]): void {
  eventStore.set(runId, events);
}

export const logsCommand = new Command('logs')
  .description('Show event log for a run')
  .argument('[run-id]', 'Run ID (shows last run if omitted)')
  .option('--agent <id>', 'Filter by agent ID')
  .option('--type <type>', 'Filter by event type')
  .option('--since <time>', 'Show events since time (ISO string or relative like "5m")')
  .action(async (runId: string | undefined, opts: { agent?: string; type?: string; since?: string }) => {
    // Get events
    let events: RunEvent[];
    if (runId) {
      events = eventStore.get(runId) ?? [];
    } else {
      // Get last run's events
      const keys = [...eventStore.keys()];
      const lastKey = keys[keys.length - 1];
      events = lastKey ? (eventStore.get(lastKey) ?? []) : [];
      runId = lastKey;
    }

    if (events.length === 0) {
      console.log(chalk.yellow('No events found.'));
      console.log(colors.muted('Run a devkit run first, or specify a valid run ID.'));
      return;
    }

    // Apply filters
    if (opts.agent) {
      events = events.filter((e) => e.agentId === opts.agent);
    }
    if (opts.type) {
      events = events.filter((e) => e.type === (opts.type as RunEventType));
    }
    if (opts.since) {
      const sinceDate = parseSince(opts.since);
      events = events.filter((e) => new Date(e.timestamp) >= sinceDate);
    }

    // Print header
    console.log('');
    console.log(colors.header(`Event Log — Run ${runId}`));
    console.log(colors.muted(`${events.length} events`));
    console.log('');

    // Print events
    for (const event of events) {
      console.log(formatEvent(event));
    }
    console.log('');
  });

function parseSince(since: string): Date {
  // Try ISO date
  const d = new Date(since);
  if (!isNaN(d.getTime())) return d;

  // Try relative time (e.g. "5m", "1h", "30s")
  const match = since.match(/^(\d+)(s|m|h|d)$/);
  if (match) {
    const [, amount, unit] = match;
    const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit!]!;
    return new Date(Date.now() - parseInt(amount!, 10) * ms);
  }

  throw new Error(`Cannot parse time: "${since}". Use ISO format or relative (e.g., "5m", "1h").`);
}
