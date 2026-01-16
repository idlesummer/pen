// Build-time globals injected by tsdown via `define`.
// tsdown replaces these placeholders with actual values
// from package.json at compile time.

declare const __DESCRIPTION__: string
declare const __PACKAGE_NAME__: string
declare const __VERSION__: string

// Package metadata
export const DESCRIPTION = __DESCRIPTION__
export const PACKAGE_NAME = __PACKAGE_NAME__
export const VERSION = __VERSION__

// Framework metadata
export const CLI_NAME = __PACKAGE_NAME__.split('/')?.[1] ?? __PACKAGE_NAME__
