// commands/dev, plugins/react-refresh-ink-plugin - both report dev-server
// lifecycle events (startup, Fast Refresh updates) through this module.

// No color library pulled in for four codes - hand-rolled ANSI is simpler
// than a dependency.
const color = (code: number) => (text: string) => `\x1b[${code}m${text}\x1b[39m`
const cyan = color(36)
const green = color(32)
const yellow = color(33)
const red = color(31)

function print(prefix: string, message: string) {
  process.stdout.write(`${prefix} ${message}\n`)
}

/** Work that's starting (compiling a changed file). */
export const wait = (message: string) => print(cyan('○'), message)

/** The dev server itself is up and about to serve the app. */
export const ready = (message: string) => print(green('✓'), message)

/** A unit of work (a Fast Refresh update) finished successfully. */
export const event = (message: string) => print(green('✓'), message)

/** Non-fatal - the app keeps running. */
export const warn = (message: string) => print(yellow('⚠'), message)

/** Fatal or user-facing error. */
export const error = (message: string) => print(red('⨯'), message)
