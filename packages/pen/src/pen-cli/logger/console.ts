import pc from 'picocolors'

/** One-line startup banner, printed once before anything else. */
export function banner(message: string) {
  console.log('\n' + pc.bold(pc.bgBlueBright(message)))
}

/** The dev server itself is up and about to serve the app. */
export function ready(message: string) {
  console.log(pc.green(`\n✓ ${message}\n`))
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
