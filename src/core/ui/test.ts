// test.ts
import pc from 'picocolors'
import { runPipeline, type Phase } from './pipeline.ts'
import { formatSize, formatDuration } from './format.ts'

// Define your context type
interface MyContext {
  input: string
  fileCount?: number
  processedData?: string[]
  validated?: boolean
  totalSize?: number
  [key: string]: unknown  // Required for PipelineContext
}

// Simple async functions to simulate work
async function scanFiles(dir: string) {
  await new Promise(resolve => setTimeout(resolve, 500))
  return 42
}

async function processData(count: number) {
  await new Promise(resolve => setTimeout(resolve, 800))
  return Array.from({ length: count }, (_, i) => `file-${i}.txt`)
}

async function validateFiles(files: string[]) {
  await new Promise(resolve => setTimeout(resolve, 400))

  // Simulate validation error (50% chance)
  if (Math.random() > 0.5) {
    throw new Error('Validation failed: Found corrupted file at index 23')
  }

  return true
}

async function calculateSize(files: string[]) {
  await new Promise(resolve => setTimeout(resolve, 300))
  return files.length * 1024 * 2.5
}

// Define the pipeline
const pipeline: Phase<MyContext>[] = [
  {
    name: 'Scanning files',
    task: async (ctx: MyContext) => {
      const count = await scanFiles(ctx.input)
      return { fileCount: count }
    },
    onSuccess: (result: Partial<MyContext> | void) => {
      const count = result?.fileCount ?? 0
      return `Found ${count} files`
    },
  },

  {
    name: 'Processing data',
    task: async (ctx: MyContext) => {
      const data = await processData(ctx.fileCount!)
      return { processedData: data }
    },
    onSuccess: (result: Partial<MyContext> | void) => {
      const count = result?.processedData?.length ?? 0
      return `Processed ${count} items`
    },
  },

  {
    name: 'Validating files',
    task: async (ctx: MyContext) => {
      const isValid = await validateFiles(ctx.processedData!)
      return { validated: isValid }
    },
    onSuccess: () => 'All files validated successfully',
  },

  {
    name: 'Calculating size',
    task: async (ctx: MyContext) => {
      const size = await calculateSize(ctx.processedData!)
      return { totalSize: size }
    },
  },
]

// Run it
async function main() {
  console.log(pc.cyan('Starting pipeline...\n'))

  try {
    const { context, duration } = await runPipeline(pipeline, { input: './my-directory' })

    // Display results
    console.log()
    console.log(pc.green('✓'), `Pipeline completed in ${formatDuration(duration)}`)
    console.log()
    console.log('Results:')
    console.log(`  Files found: ${pc.cyan(String(context.fileCount))}`)
    console.log(`  Items processed: ${pc.cyan(String(context.processedData?.length))}`)
    console.log(`  Validated: ${pc.cyan(String(context.validated))}`)
    console.log(`  Total size: ${pc.cyan(formatSize(context.totalSize!))}`)
  }
  catch (error) {
    console.error()
    console.error(pc.red('✗'), 'Pipeline failed')
    if (error instanceof Error)
      console.error(pc.red(error.message))
    process.exit(1)
  }
}

main()
