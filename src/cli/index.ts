import { Command } from 'commander'
import { build } from '@/cli/build'
import { start } from '@/cli//start'

const program = new Command()

program
  .name('pen')
  .description('Idle Summer Pen - File-based routing for React Ink')
  .version('0.1.0')

program
  .command('build')
  .description('Build the route manifest')
  .option('-d, --dir <path>', 'App directory to scan', './src/app')
  .option('-o, --output <path>', 'Output directory', './.pen')
  .action(build)

program
  .command('start')
  .description('Start the application')
  .option('-u, --url <path>', 'Initial URL to render', '/')
  .option('-m, --manifest <path>', 'Path to manifest.json', './.pen/manifest.json')
  .action(start)

program.parse()
