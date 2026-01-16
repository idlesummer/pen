import ora from 'ora'

export type Context = Record<string, unknown>

export interface Task<TContext extends Context> {
  name: string
  run: (ctx: TContext) => Promise<Partial<TContext> | void>
  onSuccess?: (ctx: TContext, duration: number) => string
  onError?: (error: Error) => string
}

export type PipeResult<TContext extends Context> = {
  context: TContext
  duration: number
}

export function pipe<TContext extends Context>(tasks: Task<TContext>[]) {
  return {
    run: async (initialContext: TContext) => {
      const startTime = Date.now()
      let context = initialContext

      for (const task of tasks) {
        const taskStart = Date.now()
        const spinner = ora(task.name).start()

        try {
          const updates = await task.run(context) ?? {} // Return updates to context
          const duration = Date.now() - taskStart       // Calculate how long this task took
          const message = task.onSuccess?.(context, duration) ?? task.name
          spinner.succeed(message)
          context = { ...context, ...updates }          // Merge updates into context
        }
        catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          const message = task.onError?.(err) ?? task.name
          spinner.fail(message)
          throw new Error(`Task "${task.name}" failed: ${err.message}`, { cause: err })
        }
      }

      const duration = Date.now() - startTime
      return { context, duration } as PipeResult<TContext>
    },
  }
}
