import { Command } from 'commander';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';

export const initCommand = new Command('init')
  .description('Initialize a new Agent DevKit project')
  .argument('[project-name]', 'Project directory name', '.')
  .action(async (projectName: string) => {
    const dir = projectName === '.' ? process.cwd() : join(process.cwd(), projectName);

    if (projectName !== '.') {
      await mkdir(dir, { recursive: true });
    }

    // Write devkit.config.ts
    await writeFile(join(dir, 'devkit.config.ts'), CONFIG_TEMPLATE, 'utf-8');

    console.log('');
    console.log(chalk.green('✔') + ' Agent DevKit project initialized!');
    console.log('');
    console.log('  Created:');
    console.log(chalk.dim(`    ${projectName === '.' ? '' : projectName + '/'}devkit.config.ts`));
    console.log('');
    console.log('  Next steps:');
    console.log(chalk.blue('    1.') + ' Edit devkit.config.ts to define your agents');
    console.log(chalk.blue('    2.') + ' Set your API key: export ANTHROPIC_API_KEY=...');
    console.log(chalk.blue('    3.') + ' Run: ' + chalk.bold('devkit run'));
    console.log('');
  });

const CONFIG_TEMPLATE = `import type { RunConfig } from '@agent-devkit/runtime';

const config: RunConfig = {
  agents: [
    {
      id: 'orchestrator',
      name: 'Orchestrator',
      model: 'claude-sonnet-4-20250514',
      systemPrompt: 'You are the orchestrator. Coordinate the other agents to complete the task.',
    },
    {
      id: 'worker',
      name: 'Worker',
      model: 'claude-sonnet-4-20250514',
      systemPrompt: 'You are a worker agent. Complete tasks assigned to you.',
    },
  ],
  connections: [
    { sourceId: 'orchestrator', targetId: 'worker', channelType: 'direct' },
  ],
  input: 'Hello, world!',
};

export default config;
`;
