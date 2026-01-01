// cli/utils/logger.ts
import ora from 'ora'
import type { RouteManifest } from '@/core/file-router/route-manifest'

export function header(title: string, info: Record<string, string>) {
  console.log(title)
  for (const [key, val] of Object.entries(info))
    console.log(`   ${key}: ${val}`)
  console.log()
}

export async function task<T>(message: string, fn: () => T | Promise<T>): Promise<T> {
  const spinner = ora(message).start()
  try {
    const result = await fn()
    spinner.succeed()
    return result
  }
  catch (error) {
    spinner.fail()
    throw error
  }
}

export function success(msg: string) {
  console.log()
  console.log(`✅ ${msg}`)
}

export function error(msg: string) {
  console.error()
  console.error(`❌ ${msg}`)
  console.error()
}

export function routes(manifest: RouteManifest) {
  console.log()
  console.log('Routes:')
  for (const url of Object.keys(manifest))
    console.log(`   ${url}`)
}
