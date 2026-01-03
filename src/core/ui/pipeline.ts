// pipeline.ts

import ora from 'ora'

// Types
export interface PipelineContext {
  [key: string]: unknown
}

export interface Phase<TContext extends PipelineContext = PipelineContext> {
  name: string
  task: (ctx: TContext) => Promise<Partial<TContext> | void>
  onSuccess?: (result: Partial<TContext> | void, ctx: TContext) => string
}

export interface PipelineResult<TContext extends PipelineContext = PipelineContext> {
  context: TContext
  duration: number
}

// Runner
export async function runPipeline<TContext extends PipelineContext>(
  phases: Phase<TContext>[],
  initialContext: TContext,
): Promise<PipelineResult<TContext>> {
  const startTime = Date.now()
  let context = { ...initialContext }

  for (const phase of phases) {
    const spinner = ora(phase.name).start()

    try {
      const result = await phase.task(context)

      // Get success message
      const message = phase.onSuccess?.(result, context) || phase.name
      spinner.succeed(message)

      // Merge result into context
      if (result && typeof result === 'object') {
        context = { ...context, ...result }
      }

    } catch (error) {
      spinner.fail(phase.name)
      throw error
    }
  }

  const duration = Date.now() - startTime
  return { context, duration }
}

