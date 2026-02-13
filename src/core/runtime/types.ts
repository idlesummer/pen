import type { ReactElement } from 'react'

/**
 * Compiled route elements mapped by URL.
 * Routes are compiled once at build time via codegen.
 */
export type CompiledRoutes = Record<string, ReactElement>
