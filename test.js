/**
 * Listr2 Sequential Tasks & Logging Demo
 *
 * This demonstrates the core features of Listr2 for sequential task execution:
 * - Basic task creation and execution
 * - Task output/logging
 * - Task status updates
 * - Subtasks
 * - Error handling
 * - Skip conditions
 * - Enable conditions
 */

import { Listr } from 'listr2';

// ============================================================================
// 1. BASIC SEQUENTIAL TASKS
// ============================================================================

console.log('\n=== 1. Basic Sequential Tasks ===\n');

const basicTasks = new Listr([
  {
    title: 'First task',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  },
  {
    title: 'Second task',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  },
  {
    title: 'Third task',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
]);

await basicTasks.run();

// ============================================================================
// 2. TASK OUTPUT / LOGGING
// ============================================================================

console.log('\n\n=== 2. Task Output & Logging ===\n');

const loggingTasks = new Listr([
  {
    title: 'Task with output',
    task: async (ctx, task) => {
      task.output = 'Starting process...';
      await new Promise(resolve => setTimeout(resolve, 500));

      task.output = 'Processing data...';
      await new Promise(resolve => setTimeout(resolve, 500));

      task.output = 'Finalizing...';
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  {
    title: 'Task with multiple outputs',
    task: async (ctx, task) => {
      const steps = ['Step 1', 'Step 2', 'Step 3', 'Step 4'];
      for (const step of steps) {
        task.output = `Processing ${step}`;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
]);

await loggingTasks.run();

// ============================================================================
// 3. UPDATING TASK TITLE
// ============================================================================

console.log('\n\n=== 3. Updating Task Title ===\n');

const titleUpdateTasks = new Listr([
  {
    title: 'Processing items',
    task: async (ctx, task) => {
      for (let i = 1; i <= 5; i++) {
        task.title = `Processing item ${i} of 5`;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      task.title = 'All items processed';
    }
  },
  {
    title: 'Downloading file',
    task: async (ctx, task) => {
      for (let progress = 0; progress <= 100; progress += 20) {
        task.title = `Downloading file: ${progress}%`;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
]);

await titleUpdateTasks.run();

// ============================================================================
// 4. SUBTASKS
// ============================================================================

console.log('\n\n=== 4. Subtasks ===\n');

const subtaskDemo = new Listr([
  {
    title: 'Parent task with subtasks',
    task: (ctx, task) => {
      return task.newListr([
        {
          title: 'Subtask 1',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        },
        {
          title: 'Subtask 2',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        },
        {
          title: 'Subtask 3',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      ]);
    }
  },
  {
    title: 'Nested subtasks',
    task: (ctx, task) => {
      return task.newListr([
        {
          title: 'Level 2 - Task 1',
          task: (ctx, task) => {
            return task.newListr([
              {
                title: 'Level 3 - Task A',
                task: async () => {
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              },
              {
                title: 'Level 3 - Task B',
                task: async () => {
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }
            ]);
          }
        },
        {
          title: 'Level 2 - Task 2',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      ]);
    }
  }
]);

await subtaskDemo.run();

// ============================================================================
// 5. CONTEXT SHARING
// ============================================================================

console.log('\n\n=== 5. Context Sharing Between Tasks ===\n');

const contextTasks = new Listr([
  {
    title: 'Initialize data',
    task: async (ctx) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      ctx.username = 'john_doe';
      ctx.userId = 12345;
    }
  },
  {
    title: 'Process user data',
    task: async (ctx, task) => {
      task.output = `Processing for user: ${ctx.username}`;
      await new Promise(resolve => setTimeout(resolve, 500));
      ctx.processedData = `Processed data for ${ctx.username}`;
    }
  },
  {
    title: 'Save results',
    task: async (ctx, task) => {
      task.output = `Saving: ${ctx.processedData}`;
      await new Promise(resolve => setTimeout(resolve, 500));
      ctx.saved = true;
    }
  },
  {
    title: 'Display summary',
    task: async (ctx, task) => {
      task.title = `Summary: User ${ctx.username} (ID: ${ctx.userId}) - Saved: ${ctx.saved}`;
    }
  }
]);

await contextTasks.run();

// ============================================================================
// 6. SKIP CONDITIONS
// ============================================================================

console.log('\n\n=== 6. Skip Conditions ===\n');

const skipTasks = new Listr([
  {
    title: 'Check prerequisites',
    task: async (ctx) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      ctx.hasCache = true;
    }
  },
  {
    title: 'Download data',
    skip: (ctx) => ctx.hasCache && 'Cache exists, skipping download',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  },
  {
    title: 'Use cached data',
    skip: (ctx) => !ctx.hasCache && 'No cache available',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  {
    title: 'Process data',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
]);

await skipTasks.run();

// ============================================================================
// 7. ENABLE CONDITIONS
// ============================================================================

console.log('\n\n=== 7. Enable Conditions ===\n');

const enableTasks = new Listr([
  {
    title: 'Check environment',
    task: async (ctx) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      ctx.isDevelopment = true;
      ctx.isProduction = false;
    }
  },
  {
    title: 'Development setup',
    enabled: (ctx) => ctx.isDevelopment,
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  {
    title: 'Production setup',
    enabled: (ctx) => ctx.isProduction,
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  {
    title: 'Common setup',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
]);

await enableTasks.run();

// ============================================================================
// 8. ERROR HANDLING
// ============================================================================

console.log('\n\n=== 8. Error Handling ===\n');

const errorTasks = new Listr([
  {
    title: 'Task 1 - Success',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  {
    title: 'Task 2 - Will fail',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      throw new Error('Something went wrong!');
    }
  },
  {
    title: 'Task 3 - Will not run',
    task: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
], {
  exitOnError: false  // Continue even if a task fails
});

try {
  await errorTasks.run();
} catch (error) {
  console.log('\nCaught error:', error.message);
}

// ============================================================================
// 9. COMBINING FEATURES
// ============================================================================

console.log('\n\n=== 9. Real-world Example: Deploy Application ===\n');

const deployTasks = new Listr([
  {
    title: 'Pre-deployment checks',
    task: (ctx, task) => {
      return task.newListr([
        {
          title: 'Checking environment',
          task: async (ctx) => {
            await new Promise(resolve => setTimeout(resolve, 300));
            ctx.environment = 'production';
          }
        },
        {
          title: 'Validating credentials',
          task: async (ctx, task) => {
            task.output = 'Verifying API credentials...';
            await new Promise(resolve => setTimeout(resolve, 400));
            ctx.credentialsValid = true;
          }
        },
        {
          title: 'Checking dependencies',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      ]);
    }
  },
  {
    title: 'Building application',
    skip: (ctx) => ctx.usePrebuilt && 'Using pre-built version',
    task: (ctx, task) => {
      return task.newListr([
        {
          title: 'Installing dependencies',
          task: async (ctx, task) => {
            for (let i = 0; i <= 100; i += 25) {
              task.title = `Installing dependencies: ${i}%`;
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        },
        {
          title: 'Compiling code',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        },
        {
          title: 'Running tests',
          task: async (ctx, task) => {
            task.output = 'Running unit tests...';
            await new Promise(resolve => setTimeout(resolve, 400));
            task.output = 'Running integration tests...';
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
      ]);
    }
  },
  {
    title: 'Deploying to production',
    enabled: (ctx) => ctx.environment === 'production',
    task: (ctx, task) => {
      return task.newListr([
        {
          title: 'Uploading files',
          task: async (ctx, task) => {
            for (let i = 0; i <= 100; i += 20) {
              task.output = `Upload progress: ${i}%`;
              await new Promise(resolve => setTimeout(resolve, 150));
            }
          }
        },
        {
          title: 'Updating database',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        },
        {
          title: 'Restarting services',
          task: async (ctx, task) => {
            task.output = 'Stopping old services...';
            await new Promise(resolve => setTimeout(resolve, 300));
            task.output = 'Starting new services...';
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      ]);
    }
  },
  {
    title: 'Post-deployment verification',
    task: async (ctx, task) => {
      task.output = 'Running health checks...';
      await new Promise(resolve => setTimeout(resolve, 500));
      task.title = 'Post-deployment verification ✓';
    }
  }
]);

await deployTasks.run();

console.log('\n✅ All demos completed!\n');