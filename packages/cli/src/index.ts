#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { initCommand } from './commands/init.js';
import { runCommand } from './commands/run.js';
import { logsCommand } from './commands/logs.js';
import { statusCommand } from './commands/status.js';

dotenv.config();

const program = new Command();

program
  .name('devkit')
  .description('Agent DevKit — build, run, and debug multi-agent systems')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(runCommand);
program.addCommand(logsCommand);
program.addCommand(statusCommand);

program.parse();
