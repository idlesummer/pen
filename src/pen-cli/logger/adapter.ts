import type { Logger } from 'vite'
import { stripVTControlCharacters } from 'node:util'
import pc from 'picocolors'
import { error, event, print, warn } from './console'

// Vite's own announcement that it invalidated a module - <reason> is
// actually our plugin's explanation for why Fast Refresh couldn't apply
// (see validateRefreshBoundaryAndEnqueueUpdate), so it belongs at warn
// severity, not buried in routine info output.
const HMR_INVALIDATE = /^hmr invalidate (\S+)(?: (.+))?$/
const HMR_UPDATE = /^hmr update (.+)$/

/**
 * Adapts Vite's logger to pen's terminal output.
 *
 * @param passthroughInfo - Print every info message verbatim instead of
 * curating it. Dev needs the curated path to stay Ink-compatible and to
 * rewrite HMR's own narration into pen's own warnings/events; build has no
 * competing renderer and no HMR traffic, so Vite's own info output (its
 * build banner, the size report, "built in Xms") can just show through.
 */
export function createPenLogger(passthroughInfo = false): Logger {
  const warnedMessages = new Set<string>()
  const loggedErrors = new WeakSet<object>()
  let warned = false

  return {
    info(message) {
      const strippedMessage = stripVTControlCharacters(message)
      if (passthroughInfo)
        return print(pc.dim(strippedMessage))

      let match: RegExpMatchArray | null

      if ((match = strippedMessage.match(HMR_INVALIDATE))) {
        const [, path, reason] = match
        return warn(reason ? `${reason} ${pc.dim(path)}` : pc.dim(path!))
      }
      if ((match = strippedMessage.match(HMR_UPDATE))) {
        const path = match[1]!
        return event(`Updated ${pc.dim(path)}`)
      }
      // Anything else Vite's own logger emits is internal noise pen's
      // dev output doesn't show - dropped rather than printed as-is.
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
