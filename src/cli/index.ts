#!/usr/bin/env node

import { Command } from 'commander'
import { buildCommand } from '@/cli/commands/build'
import { devCommand } from '@/cli/commands/dev'
import { startCommand } from '@/cli/commands/start'
import { VERSION } from '@/core/constants'

const program = new Command()

program
  .name('pen')
  .description('Idle Summer Pen - File-based routing for React Ink')
  .version(VERSION)

program
  .command('build')
  .description('Build the route manifest and compile application')
  .option('-d, --dir <path>', 'App directory to scan')
  .option('-o, --output <path>', 'Output directory')
  .action(buildCommand)

program
  .command('dev')
  .description('Build and start the application (no hot reload)')
  .option('-d, --dir <path>', 'App directory to scan', './src/app')
  .option('-o, --output <path>', 'Output directory', './.pen/build')
  .option('-u, --url <path>', 'Initial URL to render', '/')
  .action(devCommand)

program
  .command('start')
  .description('Start the application')
  .option('-u, --url <path>', 'Initial URL to render', '/')
  .option('-m, --manifest <path>', 'Path to manifest.json', './.pen/build/manifest.json')
  .action(startCommand)

program.parse()
