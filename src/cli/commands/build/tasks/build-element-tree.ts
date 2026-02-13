import type { Task } from '@idlesummer/tasker'
import type { ComponentImportData, Route } from '@/core/route-builder'
import type { BuildContext } from '../types'
import { duration } from '@idlesummer/tasker'

// ===== Types =====

export interface PropValue {
  value: string
  isString: boolean // true = quoted string, false = direct reference
}

export interface ElementTree {
  component: string
  props: Record<string, PropValue>
  children?: ElementTree
}

export type ElementTreeMap = Record<string, ElementTree>

// ===== Main Task =====

export const buildElementTree: Task<BuildContext> = {
  name: 'Building element trees',
  onSuccess: (_, dur) => `Built element trees (${duration(dur)})`,
  run: async (ctx) => {
    const manifest = ctx.manifest!
    const componentImports = ctx.componentImports!
    const elementTrees: ElementTreeMap = {}

    for (const [url, route] of Object.entries(manifest)) {
      elementTrees[url] = createElementTree(route, componentImports)
    }

    return { elementTrees }
  },
}

// ===== Helper Functions =====

/**
 * Builds a structured element tree representing nested React components.
 *
 * This function mirrors the runtime composition logic but creates a structured data tree
 * that will be serialized into createElement calls for the generated routes.ts file.
 *
 * Composition order per segment (inside to outside):
 * 1. Screen component (only in leaf segment)
 * 2. Not-found boundary (wraps screen if present)
 * 3. Layout (wraps content)
 * 4. Error boundary (wraps layout + all descendants)
 */
function createElementTree(route: Route, { indices, imports }: ComponentImportData): ElementTree {
  // Start with the screen from the first segment
  const screenSegment = route.chain[0]!
  const screenPath = screenSegment['screen']!
  const screenIndex = indices[screenPath]!

  let tree: ElementTree = {
    component: `Component${screenIndex}`,
    props: {
      key: { value: imports[screenIndex]!, isString: true },
    },
  }

  // Process segments from leaf → root (same order as runtime composition)
  for (const segment of route.chain) {
    // Not-found boundary
    if (segment['not-found']) {
      const path = segment['not-found']
      const index = indices[path]!
      tree = {
        component: 'NotFoundBoundary',
        props: {
          key: { value: imports[index]!, isString: true },
          fallback: { value: `Component${index}`, isString: false },
        },
        children: tree,
      }
    }
    // Error boundary
    if (segment['error']) {
      const path = segment['error']
      const index = indices[path]!
      tree = {
        component: 'ErrorBoundary',
        props: {
          key: { value: imports[index]!, isString: true },
          fallback: { value: `Component${index}`, isString: false },
        },
        children: tree,
      }
    }
    // Layout
    if (segment['layout']) {
      const path = segment['layout']
      const index = indices[path]!
      tree = {
        component: `Component${index}`,
        props: {
          key: { value: imports[index]!, isString: true },
        },
        children: tree,
      }
    }
  }

  return tree
}
