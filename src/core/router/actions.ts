import type { NavigationHistory } from './types'

export function push(prev: NavigationHistory, newUrl: string, newData?: unknown): NavigationHistory {
  return {
    stack: [...prev.stack.slice(0, prev.position + 1), { url: newUrl, data: newData }],
    position: prev.position + 1,
  }
}

export function replace(prev: NavigationHistory, newUrl: string): NavigationHistory {
  const newStack = [...prev.stack]
  newStack[prev.position] = { url: newUrl }
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
