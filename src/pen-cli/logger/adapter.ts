import type { Logger } from 'vite'
import { stripVTControlCharacters } from 'node:util'
import { print, warn, error } from './console'

// Vite messages already handled by pen or not useful in the terminal.
// The module-runner's own "invalidate <path>: <reason>" duplicates the
// "hmr invalidate" line below once that's rewritten as a warning.
const SUPPRESSED_INFO = [/^connected\.$/, /^hot updated:/, /^invalidate \S+:/]

// Vite's own announcement that it invalidated a module - <reason> is
// actually our plugin's explanation for why Fast Refresh couldn't apply
// (see validateRefreshBoundaryAndEnqueueUpdate), so it belongs at warn
// severity, not buried in routine info output.
const HMR_INVALIDATE = /^hmr invalidate (\S+)(?: (.+))?$/

/** Adapts Vite's logger to pen's terminal output. */
export function createPenLogger(): Logger {
  const warnedMessages = new Set<string>()
  const loggedErrors = new WeakSet<object>()
  let warned = false

  return {
    info(message) {
      const stripped = stripVTControlCharacters(message)

      const invalidate = HMR_INVALIDATE.exec(stripped)
      if (invalidate) {
        const [, path, reason] = invalidate
        warn(reason ? `${reason} - ${path}` : path!)
        return
      }
      if (!SUPPRESSED_INFO.some(pattern => pattern.test(stripped)))
        print(message)
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
