import { Command } from 'commander';
import chalk from 'chalk';
import { colors, formatAgentStatusTable, progressBar } from '../formatter.js';
import type { RunStatus } from '@agent-devkit/runtime';

// In-memory status store (in a real implementation, this reads from runtime state)
let lastRunStatus: RunStatus | null = null;

/** Update the stored run status (called by the run command) */
export function setRunStatus(status: RunStatus): void {
  lastRunStatus = status;
}

export const statusCommand = new Command('status')
  .description('Show status of current or last run')
  .action(async () => {
    if (!lastRunStatus) {
      console.log(chalk.yellow('No run status available.'));
      console.log(colors.muted('Start a run with: devkit run'));
      return;
    }

    const s = lastRunStatus;
    const statusColor =
      s.status === 'completed' ? colors.success :
      s.status === 'failed' ? colors.error :
      s.status === 'running' ? colors.info :
      colors.muted;

    const completedAgents = s.agents.filter((a) => a.status === 'completed').length;
    const totalAgents = s.agents.length;

    console.log('');
    console.log(colors.header('═══ Run Status ═══'));
    console.log(`  Run ID:   ${colors.muted(s.runId)}`);
    console.log(`  Status:   ${statusColor(s.status)}`);
    console.log(`  Progress: ${progressBar(completedAgents, totalAgents)} (${completedAgents}/${totalAgents} agents)`);
    console.log(`  Tokens:   ${s.totalTokens}`);
    console.log(`  Cost:     ${colors.cost(`$${s.totalCost.toFixed(4)}`)}`);
    console.log(`  Started:  ${colors.muted(s.startedAt.toISOString())}`);
    if (s.completedAt) {
      console.log(`  Ended:    ${colors.muted(s.completedAt.toISOString())}`);
    }
    console.log('');
    console.log(formatAgentStatusTable(s.agents));
    console.log('');
  });
