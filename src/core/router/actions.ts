import type { NavigationHistory } from './types'

/**
 * Normalizes a URL to include a trailing slash.
 * Routes are keyed with trailing slashes in the manifest.
 */
export function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

export function push(prev: NavigationHistory, newUrl: string, newData?: unknown): NavigationHistory {
  return {
    stack: [...prev.stack.slice(0, prev.position + 1), { url: normalizeUrl(newUrl), data: newData }],
    position: prev.position + 1,
  }
}

export function replace(prev: NavigationHistory, newUrl: string): NavigationHistory {
  const newStack = [...prev.stack]
  newStack[prev.position] = { url: normalizeUrl(newUrl) }
  return { ...prev, stack: newStack }
}

export function back(prev: NavigationHistory): NavigationHistory {
  return prev.position > 0
    ? { ...prev, position: prev.position - 1 }
    : prev
}

export function forward(prev: NavigationHistory): NavigationHistory {
  return prev.position < prev.stack.length - 1
    ? { ...prev, position: prev.position + 1 }
    : prev
}
