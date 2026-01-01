#!/usr/bin/env node

import { Command } from 'commander'
import { buildCommand } from '@/cli/build'
import { startCommand } from '@/cli/start'

const program = new Command()

program
  .name('pen')
  .description('Idle Summer Pen - File-based routing for React Ink')
  .version('0.1.0')

program
  .command('build')
  .description('Build the route manifest and compile application')
  .option('-d, --dir <path>', 'App directory to scan', './src/app')
  .option('-o, --output <path>', 'Output directory', './.pen/build')  // ← Updated
  .action(buildCommand)

program
  .command('start')
  .description('Start the application')
  .option('-u, --url <path>', 'Initial URL to render', '/')
  .option('-m, --manifest <path>', 'Path to manifest.json', './.pen/build/manifest.json')  // ← Updated
  .action(startCommand)

program.parse()
