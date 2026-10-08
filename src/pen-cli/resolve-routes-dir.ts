import { APP_DIR_NAME } from '@/lib/constants'

/**
 * Resolves where routes live, relative to the project root.
 *
 * 'src' is today's only convention, not a constant - deciding where the
 * app directory lives is the CLI's job, so every other module receives
 * the result as a parameter instead of importing a fixed path directly.
 */
export function resolveRoutesDir(): string {
  return `src/${APP_DIR_NAME}`
}
