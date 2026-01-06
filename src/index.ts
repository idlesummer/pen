/**
 * @idlesummer/pen - Public API
 *
 * Main exports:
 * - useRouter() - Navigation hook
 * - RouterContextValue - Type definition
 *
 * CLI:
 * - pen build - Build route manifest
 * - pen start - Start application
 *
 * @packageDocumentation
 */

// Navigation API
export { useRouter, type RouterContextValue } from './core/navigation'

// Note: Router, App, and build tools are internal and accessed via CLI
