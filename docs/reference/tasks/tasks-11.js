// pipe

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

      for (const task of tasks) {
        const taskStartTime = Date.now()
        const spinner = ora(task.name)

        if (task.skip?.(context)) {
          const message = task.onSkip?.(context) || task.name
          spinner.info(message)
          continue
        }

        try {
          spinner.start()
          const res = await task.run(context)

          const taskDuration = Date.now() - taskStartTime
          const ctx = { ...context, duration: taskDuration }
          const message = task.onSuccess?.(res, ctx) || task.name
          spinner.succeed(message)

          if (res)
            context = { ...context, ...res }
        }
        catch (error) {
          const taskDuration = Date.now() - taskStartTime
          const contextWithDuration = { ...context, duration: taskDuration }
          const message = task.onError?.(error, contextWithDuration) || task.name
          spinner.fail(message)
          throw new Error(`Task "${task.name}" failed: ${error.message}`, { cause: error })
        }
      }

      const duration = Date.now() - startTime
      return { context, duration }
    },
  }
}

// Define your tasks
const tasks = [
  {
    name: 'Fetching user',
    onSuccess: (res, ctx) => `Found user ${res.userId} (${ctx.duration}ms)`,
    onError: (error, ctx) => `Failed to fetch user from API: ${error.message}`,
    run: async () => {
      await delay(1000)
      return { userId: '123' }
    }
  },
  {
    name: 'Loading profile',
    skip: (ctx) => !ctx.userId,
    onSkip: (ctx) => `Skipped: No user ID found`,
    onSuccess: (res, ctx) => `Loaded profile for ${res.username} (${ctx.duration}ms)`,
    onError: (error, ctx) => `Profile loading failed for user ${ctx.userId}`,
    run: async (ctx) => {
      await delay(1500)
      return { username: 'john_doe' }
    }
  },
  {
    name: 'Sending email',
    skip: (ctx) => ctx.emailAlreadySent,
    onSkip: (ctx) => `Email already sent to ${ctx.username}`,
    onSuccess: (res, ctx) => `Email sent in ${ctx.duration}ms`,
    onError: (error, ctx) => `Failed to send email to ${ctx.username}: Check SMTP settings`,
    run: async (ctx) => {
      await delay(800)
      return { emailSent: true }
    }
  },
]

// Create and run the pipeline
async function main() {
  console.log('🚀 Starting pipeline...\n')

  const pipeline = pipe(tasks)

  try {
    const { context, duration } = await pipeline.run({
      env: 'production',
      apiKey: 'xyz123'
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