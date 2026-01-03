// Step 3: Add visual feedback with spinners

import ora from 'ora'

// Helper function to simulate work
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runTasks(tasks, context) {
  for (const task of tasks) {
    const spinner = ora(task.name).start() // Show "⠋ Task name"
    const result = await task.run(context)
    spinner.succeed() // Show "✓ Task name"

    if (result)
      context = { ...context, ...result }
  }

  return context
}

// Usage:
const tasks = [
  {
    name: 'Fetching user',
    run: async () => {
      await delay(2000) // Wait 2 seconds to see the spinner
      return { userId: '123' }
    }
  },
  {
    name: 'Loading profile',
    run: async (ctx) => {
      await delay(1500) // Wait 1.5 seconds
      return { profile: { name: 'John', email: 'john@example.com' } }
    }
  },
  {
    name: 'Sending welcome email',
    run: async (ctx) => {
      await delay(1000) // Wait 1 second
      console.log(`Email sent to ${ctx.profile.email}`)
    }
  },
]

await runTasks(tasks, {})
