// Step 5: Add custom success messages

import ora from 'ora'

async function runTasks(tasks, context) {
  for (const task of tasks) {
    const spinner = ora(task.name).start()

    try {
      const result = await task.run(context)

      // Use custom message if provided, otherwise use task name
      const message = task.onSuccess?.(result, context) || task.name
      spinner.succeed(message)

      if (result)
        context = { ...context, ...result }

    } catch (error) {
      spinner.fail()
      throw new Error(`Task "${task.name}" failed: ${error.message}`)
    }
  }

  return context
}

// Usage:
const tasks = [
  {
    name: 'Fetching user',
    run: async () => ({ userId: '123' }),
    onSuccess: (result) => `Found user ${result.userId}`, // Custom message!
  }
]

try {
  await runTasks(tasks, {})
  console.log('All tasks completed!')

} catch (error) {
  console.error('Pipeline failed:', error.message)
}
