import type { Logger } from 'vite'
import { print, warn, error } from './console'

// Vite messages already handled by pen or not useful in the terminal.
const SUPPRESSED_INFO = [/^connected\.$/, /^hot updated:/]

/** Adapts Vite's logger to pen's terminal output. */
export function createPenLogger(): Logger {
  const warnedMessages = new Set<string>()
  const loggedErrors = new WeakSet<object>()
  let warned = false

  return {
    info(message) {
      if (!SUPPRESSED_INFO.some(pattern => pattern.test(message)))
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
