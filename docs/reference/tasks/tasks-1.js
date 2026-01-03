
// Step 1: Run a 3 tasks
async function runTasks(tasks) {
  for (const task of tasks) {
    await task.run()
  }
}

// Usage:
const tasks = [
  { run: async () => console.log('Task 1 done') },
  { run: async () => console.log('Task 2 done') },
  { run: async () => console.log('Task 3 done') },
]

await runTasks(tasks)
