// Step 4: Handle errors gracefully

import ora from 'ora'

// Helper function to simulate work
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


async function runTasks(tasks, context) {
  for (const task of tasks) {
    const spinner = ora(task.name).start()

    try {
      const result = await task.run(context)
      spinner.succeed()

      if (result)
        context = { ...context, ...result }
    }
    catch (error) {
      spinner.fail() // Show "✗ Task name"
      throw new Error(`Task "${task.name}" failed: ${error.message}`)
    }
  }

  return context
}

// Usage:
const tasks = [
  {
    name: 'Fetching user',
    run: async () => {
      await delay(1000)
      return { userId: '123' }
    }
  },
  {
    name: 'Validating user',
    run: async (ctx) => {
      await delay(1000)
      // Throw an error here!
      throw new Error('User validation failed: Invalid credentials')
    }
  },
  {
    name: 'Loading profile',
    run: async (ctx) => {
      await delay(1000)
      return { profile: { name: 'John' } }
    },
  },
]

try {
  await runTasks(tasks, {})
  console.log('All tasks completed!')

} catch (error) {
  console.error('Pipeline failed:', error.message)
}
