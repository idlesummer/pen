import ora from 'ora'

type Context = Record<string, unknown>

export interface Task<TContext extends Context> {
  name: string
  run: (ctx: TContext) => Promise<Partial<TContext> | void>
  onSuccess?: (result: Partial<TContext> | void, ctx: TContext) => string
  skip?: (ctx: TContext) => boolean
}

export interface TaskResult<TContext extends Context> {
  context: TContext
  duration: number
}

export async function runTasks<TContext extends Context>(tasks: Task<TContext>[], context: TContext) {
  const startTime = Date.now()

  for (const task of tasks) {
    const spinner = ora(task.name)

    if (task.skip?.(context)) {
      spinner.info()  // Just show the task name with info icon
      continue
    }

    try {
      spinner.start()
      const result = await task.run(context)
      spinner.succeed(task.onSuccess?.(result, context) || task.name)

      if (result)
        context = { ...context, ...result }
    }
    catch (error) {
      spinner.fail(task.name)
      const reason = error instanceof Error ? error.message : String(error)
      const message = `Task "${task.name}" failed: ${reason}`
      throw new Error(message, { cause: error })
    }
  }

  const duration = Date.now() - startTime
  const taskResult: TaskResult<TContext> = { context, duration }
  return taskResult
}
