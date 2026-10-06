// commands/dev, commands/build, plugins/react-refresh-ink-plugin - all
// report dev-server/build lifecycle events through this module, and
// create-dev-server/create-builder install it as Vite's customLogger so
// Vite's own messages (HMR, plugin this.warn()/this.error()) share it too.

import type { Logger } from 'vite'
import pc from 'picocolors'

/** One-line startup banner, printed once before anything else. */
export function banner(message: string) {
  console.log(`\n${pc.bold('✒')} ${pc.bold(message)}\n`)
}

/** Work that's starting (compiling a changed file). */
export function wait(message: string) {
  console.log(pc.cyan('○'), message)
}

/** The dev server itself is up and about to serve the app. */
export function ready(message: string) {
  console.log(pc.green('✓'), message)
}

/** A unit of work (a Fast Refresh update) finished successfully. */
export function event(message: string) {
  console.log(pc.green('✓'), message)
}

/** Non-fatal - the app keeps running. */
export function warn(message: string) {
  console.log(pc.yellow('⚠'), message)
}

/** Fatal or user-facing error. */
export function error(message: string) {
  console.log(pc.red('⨯'), message)
}

// Vite-internal chatter that pen already reports itself in its own words
// (Ready/Compiled above) or that's just connection plumbing nobody needs to see.
// Vite hands a customLogger the bare message - no "[vite] (ssr)" prefix or
// timestamp, that's formatting its own default logger adds.
const SUPPRESSED_INFO = [/^connected\.$/, /^hot updated:/]

/** A Vite `Logger` that routes Vite's own messages (HMR status, and any
 *  plugin's this.warn()/this.error()) through pen's own formatting instead
 *  of Vite's raw `[vite] ...` lines - the same seam Astro composes through.
 *
 *  Pass as `customLogger` alongside `clearScreen: false`, since Vite's
 *  default clear-on-change behavior would otherwise fight Ink for the
 *  terminal. */
export function createPenLogger(): Logger {
  const warnedMessages = new Set<string>()
  const loggedErrors = new WeakSet<object>()
  let warned = false

  return {
    info(message) {
      if (!SUPPRESSED_INFO.some(pattern => pattern.test(message)))
        event(message)
    },
    warn(message) {
      warned = true
      warn(message)
    },
    warnOnce(message) {
      if (warnedMessages.has(message)) return
      warnedMessages.add(message)
      warned = true
      warn(message)
    },
    error(message, options) {
      warned = true
      if (options?.error)
        loggedErrors.add(options.error)
      error(message)
    },
    clearScreen() {
      // Ink owns the terminal - Vite never gets to clear it
    },
    hasErrorLogged(err) {
      return loggedErrors.has(err)
    },
    get hasWarned() {
      return warned
    },
  }
}
