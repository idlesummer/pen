import ora from 'ora'

type Context = Record<string, unknown>

export interface Task<TContext extends Context> {
  name: string
  run: (ctx: TContext) => Promise<Partial<TContext> | void>
  onSuccess?: (result: Partial<TContext> | void, ctx: TContext & { duration: number }) => string
  onError?: (error: Error, ctx: TContext & { duration: number }) => string
  onSkip?: (ctx: TContext) => string
  skip?: (ctx: TContext) => boolean
  optional?: boolean
}

export interface TaskResult<TContext extends Context> {
  context: TContext
  duration: number
}

export function pipe<TContext extends Context>(tasks: Task<TContext>[]) {
  return {
    run: async (initialContext: TContext): Promise<TaskResult<TContext>> => {
      const startTime = Date.now()
      let context = initialContext

      for (const task of tasks)
        context = await executeTask(task, context)

      const duration = Date.now() - startTime
      return { context, duration }
    },
  }
}

async function executeTask<TContext extends Context>(task: Task<TContext>, context: TContext) {
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
    if (res)
      return { ...context, ...res }
    return context
  }
  catch (error) {
    const duration = Date.now() - startTime
    const ctx = { ...context, duration }
    const err = error instanceof Error ? error : new Error(String(error))
    const message = task.onError?.(err, ctx) || task.name
    spinner.fail(message)

    if (task.optional)
      return context
    throw new Error(`Task "${task.name}" failed: ${err.message}`, { cause: err })
  }
}
