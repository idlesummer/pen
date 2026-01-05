// extracting task execution

import ora from 'ora'

// Helper function to simulate work
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function pipe(tasks) {
  return {
    run: async (initialContext = {}) => {
      const startTime = Date.now()
      let context = initialContext

      for (const task of tasks)
        context = await executeTask(task, context)

      const duration = Date.now() - startTime
      return { context, duration }
    },
  }
}

async function executeTask(task, context) {
  const startTime = Date.now()
  const spinner = ora(task.name)

  if (task.skip?.(context)) {
    const message = task.onSkip?.(context) || task.name
    spinner.info(message)
    return context
  }

  try {
    spinner.start()
    const res = await task.run(context)
    const duration = Date.now() - startTime
    const ctx = { ...context, duration }
    const message = task.onSuccess?.(res, ctx) || task.name
    spinner.succeed(message)

    return res != null
      ? { ...context, ...res }
      : context
  }
  catch (error) {
    const duration = Date.now() - startTime
    const ctx = { ...context, duration }
    const message = task.onError?.(error, ctx) || task.name
    spinner.fail(message)

    if (task.optional)
      return context
    throw new Error(`Task "${task.name}" failed: ${error.message}`, { cause: error })
  }
}

// Define your tasks
const tasks = [
  {
    name: 'Connecting to database',
    onSuccess: (res, ctx) => `Connected (${ctx.duration}ms)`,
    onError: (err, ctx) => `Database connection failed: ${err.message}`,
    run: async () => {
      await delay(1000)
      return { db: 'connected' }
    },
  },
  {
    name: 'Loading user preferences',
    optional: true, // This task can fail without stopping the pipeline
    onSuccess: (res, ctx) => `Loaded preferences (${ctx.duration}ms)`,
    onError: (err, ctx) => `Could not load preferences (using defaults)`,
    run: async (ctx) => {
      await delay(800)
      throw new Error('Preferences service unavailable')
    },
  },
  {
    name: 'Sending analytics',
    optional: true, // Analytics failure shouldn't stop the app
    onSuccess: (res, ctx) => `Analytics sent (${ctx.duration}ms)`,
    onError: (err, ctx) => `Analytics failed (non-critical)`,
    run: async (ctx) => {
      await delay(500)
      return { analyticsSent: true }
    },
  },
  {
    name: 'Rendering dashboard',
    onSuccess: (res, ctx) => `Dashboard ready (${ctx.duration}ms)`,
    run: async (ctx) => {
      await delay(1000)
      return { dashboard: 'ready' }
    },
  },
]

// Create and run the pipeline
async function main() {
  console.log('🚀 Starting pipeline...\n')

  const pipeline = pipe(tasks)

  try {
    const { context, duration } = await pipeline.run({
      env: 'production',
    })

    console.log('\n✅ All tasks completed!')
    console.log(`⏱️  Total time: ${duration}ms`)
    console.log('Final context:', context)
  }
  catch (error) {
    console.error('\n❌ Pipeline failed:', error.message)
    console.error('Cause:', error.cause?.message)
  }
}

main()
