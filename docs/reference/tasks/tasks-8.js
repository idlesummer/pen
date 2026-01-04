import ora from 'ora'

// Helper function to simulate work
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runTasks(tasks, context) {
  const startTime = Date.now()

  for (const task of tasks) {
    const taskStartTime = Date.now()
    const spinner = ora(task.name)

    if (task.skip?.(context)) {
      spinner.info()
      continue
    }

    try {
      spinner.start()
      const result = await task.run(context)

      const taskDuration = Date.now() - taskStartTime
      // Add duration to context before passing to onSuccess
      const contextWithDuration = { ...context, duration: taskDuration }
      const message = task.onSuccess?.(result, contextWithDuration) || task.name
      spinner.succeed(message)

      if (result)
        context = { ...context, ...result }
    }
    catch (error) {
      spinner.fail()
      throw new Error(`Task "${task.name}" failed: ${error.message}`)
    }
  }

  const duration = Date.now() - startTime
  return { context, duration }
}

// Usage:
const tasks = [
  {
    name: 'Fetching user',
    run: async () => {
      await delay(1000)
      return { userId: '123' }
    },
    onSuccess: (result, ctx) => `Found user ${result.userId} (${ctx.duration}ms)`,
  },
  {
    name: 'Loading profile',
    run: async (ctx) => {
      await delay(1500)
      return { username: 'john_doe' }
    },
    onSuccess: (result, ctx) => `Loaded profile for ${result.username} (${ctx.duration}ms)`,
  },
  {
    name: 'Sending email',
    run: async (ctx) => {
      await delay(800)
      return { emailSent: true }
    },
    onSuccess: (result, ctx) => `Email sent in ${ctx.duration}ms`,
  },
]

async function main() {
  console.log('🚀 Starting pipeline...\n')

  try {
    const { context, duration } = await runTasks(tasks, {})
    console.log('\n✅ All tasks completed!')
    console.log(`⏱️  Total time: ${duration}ms`)
    console.log('Final context:', context)
  }
  catch (error) {
    console.error('\n❌ Pipeline failed:', error.message)
  }
}

main()
