// commands/dev, commands/build, plugins/react-refresh-ink-plugin - all
// report dev-server/build lifecycle events through this module, and
// create-dev-server/create-builder install it as Vite's customLogger so
// Vite's own messages (HMR, plugin this.warn()/this.error()) share it too.

import type { Logger } from 'vite'
import { event, warn, error } from './console'

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
