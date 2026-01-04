// Step 6: Allow skipping tasks

import ora from 'ora'


function sendEmail(userId) {
  return userId
}


async function runTasks(tasks, context) {
  for (const task of tasks) {
    const spinner = ora(task.name)

    // Check if task should be skipped
    if (task.skip?.(context)) {
      spinner.info() // Show "ℹ Task name"
      continue // Skip to next task
    }

    try {
      spinner.start()
      const result = await task.run(context)

      const message = task.onSuccess?.(result, context) || task.name
      spinner.succeed(message)

      if (result)
        context = { ...context, ...result }
    }
    catch (error) {
      spinner.fail()
      throw new Error(`Task "${task.name}" failed: ${error.message}`)
    }
  }

  return context
}

// Usage:
const tasks = [
  {
    name: 'Send email',
    run: async (ctx) => sendEmail(ctx.userId),
    skip: (ctx) => !ctx.userId, // Skip if no userId
  },
]

try {
  await runTasks(tasks, {})
  console.log('All tasks completed!')

} catch (error) {
  console.error('Pipeline failed:', error.message)
}
