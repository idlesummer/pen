// Step 2: Pass context between tasks

async function runTasks(tasks, context) {
  for (const task of tasks) {
    const result = await task.run(context)

    // If task returned something, add it to context
    if (result) {
      context = { ...context, ...result }
    }
  }

  return context
}

// Usage:
const tasks = [
  { run: async (ctx) => ({ userId: '123' }) },
  { run: async (ctx) => console.log(ctx.userId) }, // Can access userId!
]

await runTasks(tasks, {})

