// Build-time globals injected by tsdown via `define`.
// tsdown replaces these placeholders with actual values
// from package.json at compile time.

declare const __PACKAGE_NAME__: string
declare const __DESCRIPTION__: string
declare const __VERSION__: string
declare const __INK_VERSION__: string
declare const __REACT_VERSION__: string

// Package metadata
export const PACKAGE_NAME = __PACKAGE_NAME__
export const DESCRIPTION = __DESCRIPTION__
export const PEN_VERSION = __VERSION__
export const INK_VERSION = __INK_VERSION__
export const REACT_VERSION = __REACT_VERSION__
