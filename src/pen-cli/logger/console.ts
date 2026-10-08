import pc from 'picocolors'

/** Prints an unformatted message to the terminal. */
export function print(message: string) {
  console.log(message)
}

/** One-line startup banner, printed once before anything else. */
export function banner(message: string) {
  console.log(pc.bold(pc.bgBlueBright(message)))
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
  console.log(pc.yellow('▲'), message)
}

/** Fatal or user-facing error. */
export function error(message: string) {
  console.log(pc.red('⨯'), message)
}
