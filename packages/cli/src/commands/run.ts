import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { RunEvent, RunResult } from '@agent-devkit/runtime';
import { loadConfig } from '../config.js';
import { formatEvent, formatRunSummary, formatAgentStatusTable } from '../formatter.js';

export const runCommand = new Command('run')
  .description('Execute a multi-agent run')
  .argument('[config-file]', 'Path to config file', 'devkit.config.ts')
  .option('--quiet', 'Only show summary')
  .action(async (configFile: string, opts: { quiet?: boolean }) => {
    const spinner = ora('Loading config...').start();

    let config;
    try {
      config = await loadConfig(configFile);
      spinner.succeed(`Loaded config with ${config.agents.length} agents`);
    } catch (err) {
      spinner.fail('Failed to load config');
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }

    // Dynamic import of Runtime to avoid issues if runtime isn't installed yet
    let Runtime: typeof import('@agent-devkit/runtime').Runtime;
    try {
      const mod = await import('@agent-devkit/runtime');
      Runtime = mod.Runtime;
    } catch {
      console.error(chalk.red('Error: @agent-devkit/runtime not found. Make sure it is installed.'));
      process.exit(1);
    }

    console.log('');
    console.log(chalk.bold('Agents:'));
    for (const agent of config.agents) {
      console.log(`  ${chalk.cyan(agent.id)} — ${agent.name} (${chalk.gray(agent.model)})`);
    }
    console.log('');

    const runSpinner = ora('Starting run...').start();

    try {
      // Create a minimal runtime — users can extend with real providers
      // For now, the runtime requires provider/coordinator/telemetry
      // This will work once the full runtime is built
      const runtime = new Runtime({
        provider: { chat: async () => ({ content: '', tokensUsed: { input: 0, output: 0 }, finishReason: 'stop' }) },
        coordinator: {
          sendMessage: async () => {},
          getMessages: async () => [],
          setState: async () => {},
          getState: async () => undefined,
          acquireLock: async () => true,
          releaseLock: async () => {},
        },
        telemetry: {
          record: () => {},
          flush: async () => {},
          getEvents: () => [],
        },
      });

      // Subscribe to events for real-time output
      if (!opts.quiet) {
        runtime.on('*', (event: RunEvent) => {
          runSpinner.stop();
          console.log(formatEvent(event));
          runSpinner.start('Running...');
        });
      }

      runSpinner.text = 'Running agents...';
      const result: RunResult = await runtime.run(config);

      runSpinner.stop();

      // Print per-agent breakdown
      if (result.events.length > 0) {
        // Build agent statuses from events
        const agentMap = new Map<string, { tokensUsed: number; cost: number; status: string }>();
        for (const agent of config.agents) {
          agentMap.set(agent.id, { tokensUsed: 0, cost: 0, status: 'pending' });
        }
        for (const event of result.events) {
          const a = agentMap.get(event.agentId);
          if (a) {
            if (event.tokens) a.tokensUsed += event.tokens.input + event.tokens.output;
            if (event.cost) a.cost += event.cost;
            if (event.type === 'agent_end') a.status = 'completed';
            if (event.type === 'error') a.status = 'failed';
            if (event.type === 'agent_start') a.status = 'running';
          }
        }

        const agentStatuses = [...agentMap.entries()].map(([id, s]) => ({
          agentId: id,
          status: s.status as 'completed' | 'failed' | 'running' | 'pending' | 'cancelled',
          currentStep: 0,
          tokensUsed: s.tokensUsed,
          cost: s.cost,
        }));

        console.log('');
        console.log(formatAgentStatusTable(agentStatuses));
      }

      console.log(formatRunSummary(result));

      if (result.status === 'failed') {
        process.exit(1);
      }
    } catch (err) {
      runSpinner.fail('Run failed');
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });
