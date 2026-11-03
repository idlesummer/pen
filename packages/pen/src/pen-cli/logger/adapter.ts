import type { Logger } from 'vite'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { dim } from 'picocolors'
import { error, event, warn } from './console'

// Matches Vite's HMR invalidation messages.
const HMR_INVALIDATE = /^hmr invalidate (\S+)(?: (.+))?$/

// Matches Vite's HMR update messages.
const HMR_UPDATE = /^hmr update (.+)$/

/** Converts a module ID to a display-friendly path. */
function toDisplayPath(id: string): string {
  return id.startsWith('file://') ? fileURLToPath(id) : id
}

/** Adapts Vite's logger to pen's terminal output.
 *
 *  Dev-only - Ink owns the terminal, so Vite's own writes need to be
 *  curated and rewritten to stay Ink-compatible. Build has no competing
 *  renderer, so it uses Vite's stock logger instead of this one.
 */
export function createPenLogger(): Logger {
  const warnedMessages = new Set<string>()
  const loggedErrors = new WeakSet<object>()
  let warned = false

  return {
    info(message) {
      const strippedMessage = stripVTControlCharacters(message)
      let match: RegExpMatchArray | null

      if ((match = strippedMessage.match(HMR_INVALIDATE))) {
        const [, path, reason] = match
        const displayPath = toDisplayPath(path!)
        warn(reason ? `${reason} ${dim(displayPath)}` : dim(displayPath))
      }
      else if ((match = strippedMessage.match(HMR_UPDATE))) {
        event('Updated', toDisplayPath(match[1]!))
      }
      // else, drop other Vite messages to keep dev output focused
    },
    warn(message) {
      warned = true
      warn(message)
    },
    warnOnce(message) {
      if (!warnedMessages.has(message)) {
        warnedMessages.add(message)
        warned = true
        warn(message)
      }
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
