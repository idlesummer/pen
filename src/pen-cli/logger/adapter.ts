import type { Logger } from 'vite'
import { stripVTControlCharacters } from 'node:util'
import pc from 'picocolors'
import { banner, error, event, print, ready, warn } from './console'

// Vite messages already handled by pen or not useful in the terminal.
// The module-runner's own "invalidate <path>: <reason>" duplicates the
// "hmr invalidate" line below once that's rewritten as a warning.
// "hmr update <path>" fires on every accepted update, before success or
// failure is known - not useful on its own, and a failure is already
// reported by the invalidate rewrite below.
// "page reload <file>" (server dispatching a full reload) and
// "program reload" (the module runner acting on it) are the same decision
// the invalidate rewrite already explains, just narrated mechanically.
const SUPPRESSED_INFO = [
  /^connected\.$/,
  /^hot updated:/,
  // /^hmr update /,
  /^invalidate \S+:/,
  /^page reload /,
  /^program reload$/,
]

// Vite's own announcement that it invalidated a module - <reason> is
// actually our plugin's explanation for why Fast Refresh couldn't apply
// (see validateRefreshBoundaryAndEnqueueUpdate), so it belongs at warn
// severity, not buried in routine info output.
const HMR_INVALIDATE = /^hmr invalidate (\S+)(?: (.+))?$/
const HMR_UPDATE = /^hmr update (.+)$/
const INFO_BANNER = /^info: (Pen v.+)$/
const INFO_READY = /^info: (Ready in .+)$/

/** Adapts Vite's logger to pen's terminal output. */
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
        return warn(reason ? `${reason} ${pc.dim(path)}` : pc.dim(path!))
      }
      if ((match = strippedMessage.match(HMR_UPDATE))) {
        const path = match[1]!
        return event(`Updated ${pc.dim(path)}`)
      }
      if ((match = strippedMessage.match(INFO_READY))) {
        const readyMessage = `${match[1]!}\n`
        return ready(readyMessage)
      }
      if ((match = strippedMessage.match(INFO_BANNER))) {
        const bannerMessage = `\n${match[1]!}\n`
        return banner(bannerMessage)
      }
      if (!SUPPRESSED_INFO.some(pattern => pattern.test(strippedMessage)))
        print(strippedMessage)
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
