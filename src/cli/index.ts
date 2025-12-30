import { Command } from 'commander'

const program = new Command()

program
  .name('pen')
  .description('Idle Summer Pen - File-based routing for React Ink')
  .version('0.1.0')

program
  .command('build')
  .description('Build the manifest from your app/ directory')
  .action(() => {
    console.log('Hello from build! 🔨')
  })

program
  .command('start')
  .description('Start the application')
  .action(() => {
    console.log('Hello from start! 🚀')
  })

program.parse()
