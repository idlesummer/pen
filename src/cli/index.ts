#!/usr/bin/env node
import { Command } from 'commander';
import { scanRoutes } from './scanner.js';

const program = new Command();

program
  .name('pen')
  .description('Next.js-inspired framework for Ink terminal apps')
  .version('0.1.0');

program
  .command('dev')
  .description('Start development server')
  .action(async () => {
    console.log('🖊️  Pen Dev Server\n');
    
    try {
      const routes = await scanRoutes();
      
      // Start the Ink app with the routes
      const { startDevServer } = await import('../runtime/dev-server.js');
      await startDevServer(routes);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('start')
  .description('Start production server')
  .action(async () => {
    console.log('🖊️  Pen Production Server\n');
    
    try {
      const routes = await scanRoutes();
      
      // Start the Ink app with the routes
      const { startDevServer } = await import('../runtime/dev-server.js');
      await startDevServer(routes);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse();