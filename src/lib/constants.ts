// Build-time globals injected by tsdown via `define`.
// tsdown replaces these placeholders with actual values
// from package.json at compile time.

declare const __PACKAGE_NAME__: string
declare const __DESCRIPTION__: string
declare const __VERSION__: string

// Package metadata
export const PACKAGE_NAME = __PACKAGE_NAME__
export const DESCRIPTION = __DESCRIPTION__
export const VERSION = __VERSION__

// Framework metadata
export const CLI_NAME = __PACKAGE_NAME__.split('/')?.[1] ?? __PACKAGE_NAME__

// Routes always live in a folder literally named 'app' - never
// user-configurable, same as Next.js's own app/ convention.
export const APP_DIR_NAME = 'app'

// The directory meant to contain APP_DIR_NAME. Also fixed today, but kept
// separate from the folder name above since they're different concerns.
export const APP_DIR = 'src'

// Shared by pen-cli (commands/build, commands/dev) and pen-react/setup,
// lib/ssr-glob - where routes actually live, relative to the project root.
export const ROUTES_DIR = `${APP_DIR}/${APP_DIR_NAME}`
