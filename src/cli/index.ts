#!/usr/bin/env node

import { Command } from 'commander'
import { devCommand } from './commands/dev'
import { buildCommand } from './commands/build'
import { startCommand } from './commands/start'

const program = new Command()

program
  .name('pkg')
  .description('CLI tool for running your application')
  .version('1.0.0')

program
  .command('dev')
  .description('Run the application in development mode with watch and auto-rebuild')
  .action(devCommand)

program
  .command('build')
  .description('Build the application for production')
  .action(buildCommand)

program
  .command('start')
  .description('Start the built application (production mode)')
  .action(startCommand)

program.parse(process.argv)
