import type { ComponentType, ReactElement } from 'react'

/**
 * Map of absolute component file paths to their React components.
 */
export type ComponentMap = Record<string, ComponentType>

/**
 * Compiled route elements mapped by URL.
 * Routes are compiled once at build time via codegen.
 */
export type CompiledRoutes = Record<string, ReactElement>
