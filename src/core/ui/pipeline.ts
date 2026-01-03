// pipeline.ts

import ora from 'ora'

export interface Phase<TContext extends Record<string, unknown>> {
  name: string
  task: (ctx: TContext) => Promise<Partial<TContext> | void>
  onSuccess?: (result: Partial<TContext> | void, ctx: TContext) => string
  skip?: (ctx: TContext) => boolean
}

export interface PipelineResult<TContext extends Record<string, unknown>> {
  context: TContext
  duration: number
}

export async function runPipeline<TContext extends Record<string, unknown>>(
  phases: Phase<TContext>[],
  initialContext: TContext,
): Promise<PipelineResult<TContext>> {
  const startTime = Date.now()
  let context = { ...initialContext }

  for (const phase of phases) {
    if (phase.skip?.(context)) {
      ora(phase.name).info(`${phase.name} (skipped)`)
      continue
    }

    const spinner = ora(phase.name).start()

    try {
      const result = await phase.task(context)
      const message = phase.onSuccess?.(result, context) || phase.name
      spinner.succeed(message)

      if (result && typeof result === 'object') {
        context = { ...context, ...result }
      }
    } catch (error) {
      spinner.fail(phase.name)

      if (error instanceof Error) {
        throw new Error(`Phase "${phase.name}" failed: ${error.message}`, {
          cause: error,
        })
      }
      throw error
    }
  }

  const duration = Date.now() - startTime
  return { context, duration }
}
